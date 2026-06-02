import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeTransaction,
  MAX_UINT256,
  type AnalysisRequest,
  type Address
} from "../src/index.ts";

const CHAIN_ID = 5042002;
const FROM = "0x1111111111111111111111111111111111111111" as Address;
const USDC = "0x2222222222222222222222222222222222222222" as Address;
const RECIPIENT = "0x3333333333333333333333333333333333333333" as Address;
const OTHER = "0x4444444444444444444444444444444444444444" as Address;
const SPENDER = "0x5555555555555555555555555555555555555555" as Address;

describe("analyzeTransaction", () => {
  it("allows a safe USDC transfer matching intent", () => {
    const report = analyzeTransaction(transferRequest({ recipient: RECIPIENT }));

    assert.equal(report.verdict, "ALLOW");
    assert.equal(report.riskScore, 5);
    assert.equal(report.decodedTransaction.functionName, "erc20.transfer");
    assert.equal(report.policyViolations.length, 0);
    assert.match(report.reportHash, /^0x[a-f0-9]{64}$/);
  });

  it("blocks recipient mismatch", () => {
    const report = analyzeTransaction(
      transferRequest({ intentRecipient: RECIPIENT, recipient: OTHER })
    );

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.policyViolations[0]?.code, "RECIPIENT_MISMATCH");
  });

  it("blocks unlimited approval", () => {
    const report = analyzeTransaction(approvalRequest(MAX_UINT256.toString()));

    assert.equal(report.verdict, "BLOCK");
    assert.ok(report.policyViolations.some((violation) => violation.code === "UNLIMITED_APPROVAL"));
  });

  it("blocks unknown function selector", () => {
    const report = analyzeTransaction({
      intent: {
        action: "contract_call",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: USDC
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: USDC,
        data: "0xdeadbeef"
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.decodedTransaction.functionName, "unknown");
    assert.ok(report.policyViolations.some((violation) => violation.code === "UNKNOWN_FUNCTION_SELECTOR"));
  });

  it("blocks chain mismatch", () => {
    const request = transferRequest({ recipient: RECIPIENT });
    request.transaction.chainId = 84532;

    const report = analyzeTransaction(request);

    assert.equal(report.verdict, "BLOCK");
    assert.ok(report.policyViolations.some((violation) => violation.code === "CHAIN_MISMATCH"));
  });
});

function transferRequest(options: {
  intentRecipient?: Address;
  recipient: Address;
  amount?: bigint;
}): AnalysisRequest {
  const amount = options.amount ?? 1_000_000n;

  return {
    intent: {
      action: "transfer",
      chainId: CHAIN_ID,
      from: FROM,
      tokenAddress: USDC,
      recipient: options.intentRecipient ?? options.recipient,
      amount: amount.toString()
    },
    transaction: {
      chainId: CHAIN_ID,
      from: FROM,
      to: USDC,
      data: encodeErc20Transfer(options.recipient, amount)
    }
  };
}

function approvalRequest(amount: string): AnalysisRequest {
  return {
    intent: {
      action: "approve",
      chainId: CHAIN_ID,
      from: FROM,
      tokenAddress: USDC,
      spender: SPENDER,
      maxAmount: amount
    },
    transaction: {
      chainId: CHAIN_ID,
      from: FROM,
      to: USDC,
      data: encodeErc20Approve(SPENDER, BigInt(amount))
    }
  };
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
