import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams
} from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import {
  ARC_FORK_DEFAULT_RECIPIENT,
  ARC_FORK_DEFAULT_SPENDER,
  ARC_FORK_DEFAULT_WALLET,
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_RPC_URL,
  ARC_USDC_ADDRESS,
  ARC_USDC_NATIVE_SCALE,
  seedArcUsdcFixture,
  type ArcAddress
} from "../packages/arc/src/index.ts";
import { createApiServer } from "../apps/api/src/server.ts";
import {
  AGENTWARDEN_CHALLENGE_HEADER,
  AGENTWARDEN_REQUEST_HASH_HEADER,
  hashBoundRequest
} from "../packages/x402/src/index.ts";

const MAX_UINT256 = (1n << 256n) - 1n;
const anvilBinary = resolveAnvilBinary();
const forkPort = Number(process.env.ARC_FORK_PORT ?? 8545);
const forkSource = process.env.ARC_FORK_SOURCE_RPC_URL ?? ARC_TESTNET_RPC_URL;
const forkRpcUrl = `http://127.0.0.1:${forkPort}`;
const wallet = addressEnv("ARC_FORK_WALLET", ARC_FORK_DEFAULT_WALLET);
const recipient = addressEnv("ARC_FORK_RECIPIENT", ARC_FORK_DEFAULT_RECIPIENT);
const spender = addressEnv("ARC_FORK_SPENDER", ARC_FORK_DEFAULT_SPENDER);
const seedAmount = BigInt(process.env.ARC_FORK_SEED_AMOUNT ?? "1000000");
const transferAmount = BigInt(process.env.ARC_FORK_TRANSFER_AMOUNT ?? "1000");

assertAnvilAvailable(anvilBinary);
console.log(`[arc-fork-demo] starting ${anvilBinary} from ${forkSource}`);

const anvil = spawn(
  anvilBinary,
  [
    "--fork-url",
    forkSource,
    "--chain-id",
    String(ARC_TESTNET_CHAIN_ID),
    "--port",
    String(forkPort),
    "--silent"
  ],
  {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  }
);
let apiServer: Server | undefined;

try {
  await waitForRpc(anvil, forkRpcUrl);
  console.log(`[arc-fork-demo] fork ready rpc=${forkRpcUrl}`);

  const seed = await seedArcUsdcFixture({
    rpcUrl: forkRpcUrl,
    recipient: wallet,
    amount: seedAmount
  });
  console.log(
    `[arc-fork-demo] seeded wallet=${seed.recipient} nativeBalance=${seed.nativeBalance} erc20Balance=${seed.recipientBalance}`
  );

  const app = await createApiServer({
    port: 0,
    x402Enabled: true,
    x402Provider: "mock",
    x402PayTo: "0x9999999999999999999999999999999999999999",
    x402AcceptedNetworks: ["eip155:5042002"],
    x402Price: "$0.001",
    x402GatewayFacilitatorUrl: "https://gateway-api-testnet.circle.com",
    x402StandardFacilitatorUrl: "https://x402.org/facilitator",
    x402ChallengeTtlMs: 5 * 60_000,
    analysisRpcUrl: forkRpcUrl,
    analysisRpcTimeoutMs: 10_000,
    simulationMode: "anvil",
    anvilRpcUrl: forkRpcUrl,
    simulationTimeoutMs: 10_000,
    groqModel: "llama-3.1-8b-instant"
  });
  apiServer = app.listen(0);
  await onceListening(apiServer);
  const address = apiServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected AgentWarden API TCP address.");
  }
  const analyzeUrl = `http://127.0.0.1:${address.port}/analyze`;
  console.log(`[arc-fork-demo] api=${analyzeUrl}`);

  const safeReport = await analyzeWithMockPayment(
    analyzeUrl,
    transferRequest(wallet, recipient, transferAmount)
  );
  assertReport("arc-safe-transfer", safeReport, "ALLOW", "success", undefined);

  const maliciousReport = await analyzeWithMockPayment(
    analyzeUrl,
    approvalRequest(wallet, spender)
  );
  assertReport(
    "arc-malicious-approval",
    maliciousReport,
    "BLOCK",
    "success",
    "UNLIMITED_APPROVAL"
  );

  console.log("[arc-fork-demo] complete scenarios=2 failures=0");
} finally {
  if (apiServer) {
    await closeServer(apiServer);
  }
  await stopProcess(anvil);
}

interface DemoReport {
  verdict: "ALLOW" | "WARN" | "BLOCK";
  riskScore: number;
  actionType: string;
  reportHash: string;
  simulationResult: {
    status: string;
    engine: string;
    fallbackFrom?: string;
    fallbackReason?: string;
    revertReason?: string;
  };
  stateSnapshot?: {
    account?: {
      nativeBalance?: string;
    };
    erc20?: Array<{ balance?: string }>;
  };
  policyViolations: Array<{ code: string }>;
}

function transferRequest(from: ArcAddress, to: ArcAddress, amount: bigint) {
  const nativeAmount = amount * ARC_USDC_NATIVE_SCALE;
  return {
    requestId: `arc-fork-safe-${Date.now()}`,
    intent: {
      action: "native_transfer",
      chainId: ARC_TESTNET_CHAIN_ID,
      from,
      recipient: to,
      amount: nativeAmount.toString(),
      allowNativeValue: true
    },
    transaction: {
      chainId: ARC_TESTNET_CHAIN_ID,
      from,
      to,
      value: nativeAmount.toString(),
      data: "0x"
    }
  };
}

function approvalRequest(from: ArcAddress, spenderAddress: ArcAddress) {
  return {
    requestId: `arc-fork-malicious-${Date.now()}`,
    intent: {
      action: "approval",
      chainId: ARC_TESTNET_CHAIN_ID,
      from,
      tokenAddress: ARC_USDC_ADDRESS,
      spender: spenderAddress,
      maxAmount: MAX_UINT256.toString()
    },
    transaction: {
      chainId: ARC_TESTNET_CHAIN_ID,
      from,
      to: ARC_USDC_ADDRESS,
      value: "0",
      data: `0x095ea7b3${encodeAddress(spenderAddress)}${encodeUint256(MAX_UINT256)}`
    }
  };
}

async function analyzeWithMockPayment(
  url: string,
  request: ReturnType<typeof transferRequest> | ReturnType<typeof approvalRequest>
): Promise<DemoReport> {
  const route = "/analyze";
  const challenge = randomUUID();
  const headers = {
    "content-type": "application/json",
    [AGENTWARDEN_CHALLENGE_HEADER]: challenge,
    [AGENTWARDEN_REQUEST_HASH_HEADER]: hashBoundRequest(route, request)
  };
  const preflight = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request)
  });
  if (preflight.status !== 402) {
    throw new Error(`Expected mock x402 preflight 402, received ${preflight.status}.`);
  }

  const paid = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "x-agentwarden-mock-payment": "paid"
    },
    body: JSON.stringify(request)
  });
  const body = await paid.text();
  if (!paid.ok) {
    throw new Error(`AgentWarden analysis failed with ${paid.status}: ${body}`);
  }
  return JSON.parse(body) as DemoReport;
}

function assertReport(
  label: string,
  report: DemoReport,
  expectedVerdict: DemoReport["verdict"],
  expectedSimulationStatus: string,
  requiredViolation: string | undefined
): void {
  const balance =
    report.stateSnapshot?.account?.nativeBalance ??
    report.stateSnapshot?.erc20?.[0]?.balance;
  const hasViolation =
    !requiredViolation ||
    report.policyViolations.some((violation) => violation.code === requiredViolation);
  const passed =
    report.verdict === expectedVerdict &&
    report.simulationResult.engine === "anvil" &&
    report.simulationResult.status === expectedSimulationStatus &&
    Boolean(balance) &&
    hasViolation;

  console.log(
    `[${passed ? "PASS" : "FAIL"}] ${label} verdict=${report.verdict} risk=${report.riskScore} simulation=${report.simulationResult.engine}:${report.simulationResult.status} balance=${balance ?? "missing"}`
  );
  console.log(`       hash=${report.reportHash}`);
  if (!passed) {
    console.log(
      `       simulation=${JSON.stringify(report.simulationResult)} violations=${report.policyViolations.map((violation) => violation.code).join(",") || "none"}`
    );
    throw new Error(`${label} did not satisfy the Arc fork acceptance criteria.`);
  }
}

function assertAnvilAvailable(binary: string): void {
  const result = spawnSync(binary, ["--version"], {
    windowsHide: true,
    encoding: "utf8"
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Anvil is required for demo:arc-fork. Install Foundry, then ensure '${binary}' is on PATH.`
    );
  }
}

function resolveAnvilBinary(): string {
  const configured = process.env.ANVIL_BINARY?.trim();
  if (configured) {
    return configured;
  }

  if (process.platform === "win32") {
    const foundryAnvil = join(homedir(), ".foundry", "bin", "anvil.exe");
    if (existsSync(foundryAnvil)) {
      return foundryAnvil;
    }
  }

  return "anvil";
}

async function waitForRpc(
  process: ChildProcessWithoutNullStreams,
  rpcUrl: string
): Promise<void> {
  let stderr = "";
  process.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (process.exitCode !== null) {
      throw new Error(`Anvil exited before startup: ${stderr.trim()}`);
    }

    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_chainId",
          params: []
        })
      });
      if (response.ok) {
        return;
      }
    } catch {
      // Startup polling intentionally ignores connection failures.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Anvil RPC. ${stderr.trim()}`);
}

function onceListening(server: Server): Promise<void> {
  if (server.listening) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function stopProcess(process: ChildProcessWithoutNullStreams): Promise<void> {
  if (process.exitCode !== null) {
    return;
  }
  process.kill();
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2_000);
    process.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function addressEnv(name: string, fallback: ArcAddress): ArcAddress {
  return validateAddress(name, process.env[name]?.trim() || fallback);
}

function validateAddress(name: string, value: string): ArcAddress {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be an EVM address.`);
  }
  return value.toLowerCase() as ArcAddress;
}

function encodeAddress(address: ArcAddress): string {
  return address.slice(2).padStart(64, "0");
}

function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}
