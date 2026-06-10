import { randomUUID } from "node:crypto";
import {
  AGENTWARDEN_CHALLENGE_HEADER,
  AGENTWARDEN_REQUEST_HASH_HEADER,
  hashBoundRequest
} from "@agent-warden/x402";

const ARC_TESTNET_CHAIN_ID = 5_042_002;
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_USDC_NATIVE_SCALE = 10n ** 12n;
const ARC_FORK_DEFAULT_WALLET = "0x1111111111111111111111111111111111111111";
const ARC_FORK_DEFAULT_RECIPIENT = "0x3333333333333333333333333333333333333333";
const ARC_FORK_DEFAULT_SPENDER = "0x5555555555555555555555555555555555555555";
const ETHEREUM_SEPOLIA_CHAIN_ID = 11_155_111;
const MAX_UINT256 = (1n << 256n) - 1n;

type Scenario =
  | "safe-transfer"
  | "malicious-approval"
  | "arc-safe-transfer"
  | "arc-malicious-approval";
type Address = `0x${string}`;

interface AnalysisRequest {
  requestId: string;
  intent: {
    action: "transfer" | "approve" | "native_transfer";
    chainId: number;
    from: Address;
    tokenAddress?: Address;
    recipient?: Address;
    spender?: Address;
    amount?: string;
    maxAmount?: string;
    allowNativeValue?: boolean;
    description: string;
  };
  transaction: {
    chainId: number;
    from: Address;
    to: Address;
    data: `0x${string}`;
    value: string;
  };
}

interface SecurityReport {
  verdict: "ALLOW" | "WARN" | "BLOCK";
  riskScore: number;
  reportHash: string;
  policyViolations: Array<{
    code: string;
    severity: string;
    message: string;
  }>;
  simulationResult?: {
    status: string;
    engine: string;
    summary: string;
  };
  stateSnapshot?: {
    account?: {
      nativeBalance?: string;
    };
    erc20?: Array<{
      balance?: string;
    }>;
  };
  saferAlternative?: string;
}

const scenario = parseScenario(process.argv[2]);
const dryRun = process.argv.includes("--dry-run");
const config = getConfig(scenario);
const request = buildAnalysisRequest(scenario, config);

printRequest(request, scenario, config.apiUrl);

if (dryRun) {
  console.log("[mock-agent] dry run complete; request was not sent");
} else {
  const report = await sendAnalysisRequest(config.apiUrl, request);
  printReport(report);
}

function parseScenario(value: string | undefined): Scenario {
  if (
    value === "malicious-approval" ||
    value === "arc-safe-transfer" ||
    value === "arc-malicious-approval"
  ) {
    return value;
  }

  return "safe-transfer";
}

function getConfig(selectedScenario: Scenario) {
  if (selectedScenario.startsWith("arc-")) {
    return {
      apiUrl: process.env.AGENTWARDEN_API_URL ?? "http://localhost:8787/analyze",
      chainId: ARC_TESTNET_CHAIN_ID,
      networkName: "Arc fork",
      wallet: addressEnv("ARC_FORK_WALLET", ARC_FORK_DEFAULT_WALLET),
      tokenAddress: addressEnv("ARC_FORK_TOKEN", ARC_USDC_ADDRESS),
      recipient: addressEnv("ARC_FORK_RECIPIENT", ARC_FORK_DEFAULT_RECIPIENT),
      spender: addressEnv("ARC_FORK_SPENDER", ARC_FORK_DEFAULT_SPENDER),
      transferAmount: BigInt(process.env.ARC_FORK_TRANSFER_AMOUNT ?? "1000")
    };
  }

  return {
    apiUrl: process.env.AGENTWARDEN_API_URL ?? "http://localhost:8787/analyze",
    chainId: ETHEREUM_SEPOLIA_CHAIN_ID,
    networkName: "Ethereum Sepolia",
    wallet: addressEnv("MOCK_AGENT_WALLET", "0x1111111111111111111111111111111111111111"),
    tokenAddress: addressEnv(
      "SEPOLIA_TOKEN_ADDRESS",
      "0x2222222222222222222222222222222222222222"
    ),
    recipient: addressEnv(
      "SEPOLIA_RECIPIENT",
      "0x3333333333333333333333333333333333333333"
    ),
    spender: addressEnv("SEPOLIA_SPENDER", "0x5555555555555555555555555555555555555555"),
    transferAmount: 1_000_000n
  };
}

function addressEnv(name: string, fallback: Address): Address {
  const value = process.env[name] ?? fallback;

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be an EVM address`);
  }

  return value as Address;
}

function buildAnalysisRequest(
  selectedScenario: Scenario,
  config: ReturnType<typeof getConfig>
): AnalysisRequest {
  if (selectedScenario === "arc-safe-transfer") {
    const nativeAmount = config.transferAmount * ARC_USDC_NATIVE_SCALE;
    return {
      requestId: `mock-agent-${selectedScenario}-${Date.now()}`,
      intent: {
        action: "native_transfer",
        chainId: config.chainId,
        from: config.wallet,
        recipient: config.recipient,
        amount: nativeAmount.toString(),
        allowNativeValue: true,
        description: "Mock agent is about to transfer native USDC on an Arc fork."
      },
      transaction: {
        chainId: config.chainId,
        from: config.wallet,
        to: config.recipient,
        value: nativeAmount.toString(),
        data: "0x"
      }
    };
  }

  if (
    selectedScenario === "malicious-approval" ||
    selectedScenario === "arc-malicious-approval"
  ) {
    return {
      requestId: `mock-agent-${selectedScenario}-${Date.now()}`,
      intent: {
        action: "approve",
        chainId: config.chainId,
        from: config.wallet,
        tokenAddress: config.tokenAddress,
        spender: config.spender,
        maxAmount: MAX_UINT256.toString(),
        description: `Mock agent is about to approve a spender on ${config.networkName}.`
      },
      transaction: {
        chainId: config.chainId,
        from: config.wallet,
        to: config.tokenAddress,
        value: "0",
        data: encodeErc20Approve(config.spender, MAX_UINT256)
      }
    };
  }

  return {
    requestId: `mock-agent-${selectedScenario}-${Date.now()}`,
    intent: {
      action: "transfer",
      chainId: config.chainId,
      from: config.wallet,
      tokenAddress: config.tokenAddress,
      recipient: config.recipient,
      amount: config.transferAmount.toString(),
      description: `Mock agent is about to transfer a test token on ${config.networkName}.`
    },
    transaction: {
      chainId: config.chainId,
      from: config.wallet,
      to: config.tokenAddress,
      value: "0",
      data: encodeErc20Transfer(config.recipient, config.transferAmount)
    }
  };
}

async function sendAnalysisRequest(
  apiUrl: string,
  request: AnalysisRequest
): Promise<SecurityReport> {
  const route = new URL(apiUrl).pathname;
  const challenge = randomUUID();
  const bindingHeaders = {
    "content-type": "application/json",
    "x-request-id": request.requestId,
    [AGENTWARDEN_CHALLENGE_HEADER]: challenge,
    [AGENTWARDEN_REQUEST_HASH_HEADER]: hashBoundRequest(route, request)
  };
  console.log("[mock-agent] sending unpaid x402 preflight");
  const preflight = await fetch(apiUrl, {
    method: "POST",
    headers: bindingHeaders,
    body: JSON.stringify(request)
  });

  if (preflight.ok) {
    console.log(`[mock-agent] response status=${preflight.status}`);
    return (await preflight.json()) as SecurityReport;
  }

  if (preflight.status !== 402) {
    throw new Error(`AgentWarden preflight failed: ${await preflight.text()}`);
  }

  console.log("[mock-agent] retrying with mock x402 payment");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      ...bindingHeaders,
      "x-agentwarden-mock-payment": "paid"
    },
    body: JSON.stringify(request)
  });
  const responseText = await response.text();
  console.log(`[mock-agent] response status=${response.status}`);

  if (!response.ok) {
    throw new Error(`AgentWarden rejected request: ${responseText}`);
  }

  return JSON.parse(responseText) as SecurityReport;
}

function printRequest(
  request: AnalysisRequest,
  selectedScenario: Scenario,
  apiUrl: string
): void {
  console.log("[mock-agent] scenario", selectedScenario);
  console.log("[mock-agent] api", apiUrl);
  console.log("[mock-agent] wallet", request.intent.from);
  console.log("[mock-agent] txChainId", request.transaction.chainId);
  console.log("[mock-agent] requestId", request.requestId);
  console.log("[mock-agent] unsignedTx", JSON.stringify(request.transaction, null, 2));
}

function printReport(report: SecurityReport): void {
  console.log("[mock-agent] verdict", report.verdict);
  console.log("[mock-agent] riskScore", report.riskScore);
  console.log("[mock-agent] reportHash", report.reportHash);

  if (report.simulationResult) {
    console.log(
      "[mock-agent] simulation",
      `${report.simulationResult.engine}:${report.simulationResult.status}`
    );
  }

  const balance =
    report.stateSnapshot?.account?.nativeBalance ??
    report.stateSnapshot?.erc20?.[0]?.balance;
  if (balance) {
    console.log("[mock-agent] analyzedBalance", balance);
  }

  if (report.policyViolations.length > 0) {
    console.log("[mock-agent] policyViolations");
    for (const violation of report.policyViolations) {
      console.log(
        `  - ${violation.severity.toUpperCase()} ${violation.code}: ${violation.message}`
      );
    }
  }

  if (report.saferAlternative) {
    console.log("[mock-agent] saferAlternative", report.saferAlternative);
  }
}

function encodeErc20Transfer(recipient: Address, amount: bigint): `0x${string}` {
  return `0xa9059cbb${encodeAddress(recipient)}${encodeUint256(amount)}`;
}

function encodeErc20Approve(spender: Address, amount: bigint): `0x${string}` {
  return `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}`;
}

function encodeAddress(address: Address): string {
  return address.slice(2).padStart(64, "0");
}

function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}
