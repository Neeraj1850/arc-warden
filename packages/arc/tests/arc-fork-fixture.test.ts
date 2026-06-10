import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ARC_USDC_NATIVE_SCALE,
  seedArcUsdcFixture,
  type ArcForkRpcClient
} from "../src/index.js";

const RECIPIENT = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
const ONE_USDC = 1_000_000n;
const ONE_USDC_NATIVE = ONE_USDC * ARC_USDC_NATIVE_SCALE;

describe("Arc fork fixture", () => {
  it("seeds native USDC and verifies the shared ERC-20 balance", async () => {
    const client = new ScriptedClient([
      ["eth_chainId", `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`],
      ["eth_getBalance", "0x0"],
      ["anvil_setBalance", true],
      ["eth_getBalance", `0x${ONE_USDC_NATIVE.toString(16)}`],
      ["eth_call", `0x${ONE_USDC.toString(16)}`]
    ]);

    const result = await seedArcUsdcFixture({
      client,
      recipient: RECIPIENT,
      amount: ONE_USDC
    });

    assert.equal(result.tokenAddress, ARC_USDC_ADDRESS);
    assert.equal(result.nativeBalance, ONE_USDC_NATIVE.toString());
    assert.equal(result.recipientBalance, ONE_USDC.toString());
    assert.equal(result.alreadyFunded, false);
    assert.deepEqual(
      client.calls.map((call) => call.method),
      ["eth_chainId", "eth_getBalance", "anvil_setBalance", "eth_getBalance", "eth_call"]
    );
  });

  it("does not rewrite an exact existing fixture balance", async () => {
    const client = new ScriptedClient([
      ["eth_chainId", `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`],
      ["eth_getBalance", `0x${ONE_USDC_NATIVE.toString(16)}`],
      ["eth_getBalance", `0x${ONE_USDC_NATIVE.toString(16)}`],
      ["eth_call", `0x${ONE_USDC.toString(16)}`]
    ]);

    const result = await seedArcUsdcFixture({
      client,
      recipient: RECIPIENT,
      amount: ONE_USDC
    });

    assert.equal(result.alreadyFunded, true);
    assert.equal(client.calls.length, 4);
  });

  it("rejects inconsistent native and ERC-20 interface balances", async () => {
    const client = new ScriptedClient([
      ["eth_chainId", `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`],
      ["eth_getBalance", "0x0"],
      ["anvil_setBalance", true],
      ["eth_getBalance", `0x${ONE_USDC_NATIVE.toString(16)}`],
      ["eth_call", "0x0"]
    ]);

    await assert.rejects(
      () =>
        seedArcUsdcFixture({
          client,
          recipient: RECIPIENT,
          amount: ONE_USDC
        }),
      /matching native and ERC-20 interface balances/
    );
  });

  it("rejects a non-Arc fork", async () => {
    const client = new ScriptedClient([["eth_chainId", "0x1"]]);
    await assert.rejects(
      () =>
        seedArcUsdcFixture({
          client,
          recipient: RECIPIENT,
          amount: 1n
        }),
      /chain mismatch/
    );
  });
});

class ScriptedClient implements ArcForkRpcClient {
  readonly calls: Array<{ method: string; params?: unknown[] }> = [];

  constructor(private readonly responses: Array<[string, unknown]>) {}

  async request<T>(method: string, params?: unknown[]): Promise<T> {
    this.calls.push({ method, params });
    const response = this.responses.shift();
    assert.ok(response, `Unexpected RPC call ${method}`);
    assert.equal(response[0], method);
    return response[1] as T;
  }
}
