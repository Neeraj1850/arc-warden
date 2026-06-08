import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeSignature,
  analyzeTransaction,
  InMemorySessionStore,
  MAX_UINT256,
  type Address
} from "../src/index.ts";

const CHAIN_ID = 5042002;
const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const SPENDER = "0x3333333333333333333333333333333333333333" as Address;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as Address;

describe("InMemorySessionStore", () => {
  it("flags a transaction after a recent token approval", () => {
    const store = new InMemorySessionStore({ ttlMs: 600_000, now: () => 1_000 });
    const approvalReport = analyzeTransaction({
      intent: {
        action: "approval",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        spender: SPENDER
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeErc20Approve(SPENDER, MAX_UINT256)
      }
    });

    store.recordTransaction(FROM, approvalReport);

    const violations = store.evaluateTransaction(FROM, {
      chainId: CHAIN_ID,
      from: FROM,
      to: TOKEN,
      value: "0",
      data: encodeErc20Transfer(RECIPIENT, 1n)
    });

    assert.equal(violations[0]?.code, "RECENT_APPROVAL_SEQUENCE");
  });

  it("flags a transaction after a recent permit signature", () => {
    const store = new InMemorySessionStore({ ttlMs: 600_000, now: () => 1_000 });
    const permitReport = analyzeSignature({
      intent: {
        action: "permit",
        chainId: CHAIN_ID,
        from: FROM,
        verifyingContract: TOKEN,
        spender: SPENDER,
        maxAmount: MAX_UINT256.toString()
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "TestToken",
            chainId: CHAIN_ID,
            verifyingContract: TOKEN
          },
          primaryType: "Permit",
          message: {
            owner: FROM,
            spender: SPENDER,
            value: MAX_UINT256.toString(),
            deadline: "9999999999"
          }
        }
      }
    });

    store.recordSignature(FROM, permitReport);

    const violations = store.evaluateTransaction(FROM, {
      chainId: CHAIN_ID,
      from: FROM,
      to: TOKEN,
      value: "0",
      data: encodeErc20Transfer(RECIPIENT, 1n)
    });

    assert.equal(violations[0]?.code, "RECENT_APPROVAL_SEQUENCE");
  });

  it("expires old session events", () => {
    let now = 1_000;
    const store = new InMemorySessionStore({ ttlMs: 100, now: () => now });
    const approvalReport = analyzeTransaction({
      intent: {
        action: "approval",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        spender: SPENDER
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeErc20Approve(SPENDER, 1n)
      }
    });

    store.recordTransaction(FROM, approvalReport);
    now = 1_101;

    assert.equal(store.getEvents(FROM).length, 0);
  });
});

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
