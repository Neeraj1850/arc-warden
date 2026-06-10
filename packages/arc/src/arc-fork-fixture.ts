export const ARC_TESTNET_CHAIN_ID = 5_042_002;
export const ARC_TESTNET_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;
export const ARC_USDC_NATIVE_SCALE = 10n ** 12n;
export const ARC_FORK_DEFAULT_WALLET =
  "0x1111111111111111111111111111111111111111" as const;
export const ARC_FORK_DEFAULT_RECIPIENT =
  "0x3333333333333333333333333333333333333333" as const;
export const ARC_FORK_DEFAULT_SPENDER =
  "0x5555555555555555555555555555555555555555" as const;

const BALANCE_OF_SELECTOR = "0x70a08231";

export type ArcAddress = `0x${string}`;

export interface ArcForkRpcClient {
  request<T>(method: string, params?: unknown[]): Promise<T>;
}

export interface SeedArcUsdcOptions {
  rpcUrl?: string;
  client?: ArcForkRpcClient;
  recipient: ArcAddress;
  amount: bigint;
  timeoutMs?: number;
}

export interface ArcForkSeedResult {
  chainId: number;
  tokenAddress: ArcAddress;
  recipient: ArcAddress;
  amount: string;
  nativeBalance: string;
  recipientBalance: string;
  alreadyFunded: boolean;
}

export async function seedArcUsdcFixture(
  options: SeedArcUsdcOptions
): Promise<ArcForkSeedResult> {
  if (options.amount <= 0n) {
    throw new Error("Arc fork seed amount must be greater than zero.");
  }

  const client =
    options.client ??
    new FetchArcForkRpcClient(options.rpcUrl ?? "http://127.0.0.1:8545", {
      timeoutMs: options.timeoutMs
    });
  const chainId = Number(BigInt(await client.request<string>("eth_chainId")));
  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error(
      `Arc fork chain mismatch: expected ${ARC_TESTNET_CHAIN_ID}, received ${chainId}.`
    );
  }

  const targetNativeBalance = options.amount * ARC_USDC_NATIVE_SCALE;
  const existingNativeBalance = BigInt(
    await client.request<string>("eth_getBalance", [options.recipient, "latest"])
  );
  const alreadyFunded = existingNativeBalance === targetNativeBalance;

  if (!alreadyFunded) {
    await client.request<boolean>("anvil_setBalance", [
      options.recipient,
      toRpcQuantity(targetNativeBalance)
    ]);
  }

  const nativeBalance = BigInt(
    await client.request<string>("eth_getBalance", [options.recipient, "latest"])
  );
  const recipientBalance = await readUsdcBalance(client, options.recipient);
  if (nativeBalance !== targetNativeBalance || recipientBalance !== options.amount) {
    throw new Error(
      "Arc fork native USDC seed did not produce matching native and ERC-20 interface balances."
    );
  }

  return {
    chainId,
    tokenAddress: ARC_USDC_ADDRESS,
    recipient: options.recipient,
    amount: options.amount.toString(),
    nativeBalance: nativeBalance.toString(),
    recipientBalance: recipientBalance.toString(),
    alreadyFunded
  };
}

export class FetchArcForkRpcClient implements ArcForkRpcClient {
  private requestId = 0;

  constructor(
    private readonly rpcUrl: string,
    private readonly options: { timeoutMs?: number } = {}
  ) {}

  async request<T>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? 10_000
    );

    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: ++this.requestId,
          method,
          params
        })
      });
      const body = (await response.json()) as {
        result?: T;
        error?: { message?: string };
      };
      if (!response.ok || body.error) {
        throw new Error(
          body.error?.message ?? `Arc fork RPC failed with status ${response.status}.`
        );
      }
      return body.result as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function readUsdcBalance(
  client: ArcForkRpcClient,
  address: ArcAddress
): Promise<bigint> {
  const value = await client.request<string>("eth_call", [
    {
      to: ARC_USDC_ADDRESS,
      data: `${BALANCE_OF_SELECTOR}${encodeAddress(address)}`
    },
    "latest"
  ]);
  return BigInt(value || "0x0");
}

function encodeAddress(address: ArcAddress): string {
  return address.slice(2).padStart(64, "0");
}

function toRpcQuantity(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}
