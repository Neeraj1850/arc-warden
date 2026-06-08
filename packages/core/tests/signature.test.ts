import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeSignature,
  type Address,
  type SignatureAnalysisRequest
} from "../src/index.ts";

const CHAIN_ID = 5042002;
const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const SPENDER = "0x3333333333333333333333333333333333333333" as Address;
const OTHER = "0x4444444444444444444444444444444444444444" as Address;
const MAX_UINT256 = (1n << 256n) - 1n;

describe("analyzeSignature", () => {
  it("blocks EIP-2612 permit typed data with unlimited allowance", () => {
    const report = analyzeSignature(permitRequest(MAX_UINT256.toString()));

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "permit_signature");
    assert.equal(report.decodedSignature.spender, SPENDER);
    assert.ok(
      report.policyViolations.some(
        (violation) => violation.code === "PERMIT_TYPED_DATA_SIGNATURE"
      )
    );
    assert.ok(
      report.policyViolations.some(
        (violation) => violation.code === "UNLIMITED_SIGNATURE_ALLOWANCE"
      )
    );
  });

  it("blocks Permit2-style typed data", () => {
    const report = analyzeSignature({
      requestId: "permit2",
      intent: {
        action: "permit",
        chainId: CHAIN_ID,
        from: FROM,
        verifyingContract: TOKEN,
        spender: SPENDER,
        maxAmount: "1000"
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "Permit2",
            chainId: CHAIN_ID,
            verifyingContract: TOKEN
          },
          primaryType: "PermitSingle",
          message: {
            owner: FROM,
            spender: SPENDER,
            permitted: {
              amount: "1000"
            },
            sigDeadline: "9999999999"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "permit2_signature");
    assert.equal(report.decodedSignature.value, "1000");
  });

  it("blocks Permit2 batch typed data", () => {
    const report = analyzeSignature({
      requestId: "permit2-batch",
      intent: {
        action: "permit",
        chainId: CHAIN_ID,
        from: FROM,
        verifyingContract: TOKEN,
        spender: SPENDER
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "Permit2",
            chainId: CHAIN_ID,
            verifyingContract: TOKEN
          },
          primaryType: "PermitBatch",
          message: {
            owner: FROM,
            spender: SPENDER,
            permitted: {
              amount: "1000"
            },
            sigDeadline: "9999999999"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "permit2_signature");
  });

  it("blocks EIP-3009 transfer authorization typed data", () => {
    const report = analyzeSignature({
      requestId: "transfer-auth",
      intent: {
        action: "authorization",
        chainId: CHAIN_ID,
        from: FROM,
        verifyingContract: TOKEN
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "USDC",
            chainId: CHAIN_ID,
            verifyingContract: TOKEN
          },
          primaryType: "TransferWithAuthorization",
          message: {
            from: FROM,
            to: SPENDER,
            value: "1000",
            validBefore: "9999999999"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "transfer_authorization_signature");
    assert.equal(report.decodedSignature.to, SPENDER);
  });

  it("blocks Safe transaction typed data until execution payload is decoded", () => {
    const report = analyzeSignature({
      requestId: "safe-tx",
      intent: {
        action: "authorization",
        chainId: CHAIN_ID,
        from: FROM,
        verifyingContract: TOKEN
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "Safe",
            chainId: CHAIN_ID,
            verifyingContract: TOKEN
          },
          primaryType: "SafeTx",
          message: {
            to: SPENDER,
            value: "0",
            data: "0xdeadbeef"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "safe_transaction_signature");
    assert.ok(
      report.policyViolations.some(
        (violation) => violation.code === "SAFE_TRANSACTION_SIGNATURE"
      )
    );
  });

  it("blocks EIP-7702-style authorization typed data", () => {
    const report = analyzeSignature({
      requestId: "authorization",
      intent: {
        action: "authorization",
        chainId: CHAIN_ID,
        from: FROM
      },
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          domain: {
            name: "EIP7702",
            chainId: CHAIN_ID
          },
          primaryType: "Authorization",
          message: {
            authority: FROM,
            address: SPENDER,
            nonce: "1"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.equal(report.actionType, "authorization_signature");
  });

  it("blocks blind eth_sign payloads", () => {
    const report = analyzeSignature({
      requestId: "blind-sign",
      intent: {
        action: "unknown",
        chainId: CHAIN_ID,
        from: FROM
      },
      payload: {
        kind: "eth_sign",
        message: "0xdeadbeef"
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.ok(
      report.policyViolations.some((violation) => violation.code === "BLIND_ETH_SIGN")
    );
  });

  it("allows recognized login personal_sign messages", () => {
    const report = analyzeSignature({
      requestId: "login",
      intent: {
        action: "login",
        chainId: CHAIN_ID,
        from: FROM
      },
      payload: {
        kind: "personal_sign",
        message: "Sign in to AgentWarden with nonce 123."
      }
    });

    assert.equal(report.verdict, "ALLOW");
    assert.equal(report.actionType, "login_signature");
    assert.equal(report.policyViolations.length, 0);
  });

  it("blocks owner mismatch in typed data", () => {
    const report = analyzeSignature({
      ...permitRequest("1000"),
      payload: {
        kind: "eip712_typed_data",
        typedData: {
          ...permitRequest("1000").payload.typedData!,
          message: {
            owner: OTHER,
            spender: SPENDER,
            value: "1000",
            deadline: "9999999999"
          }
        }
      }
    });

    assert.equal(report.verdict, "BLOCK");
    assert.ok(
      report.policyViolations.some(
        (violation) => violation.code === "SIGNATURE_OWNER_MISMATCH"
      )
    );
  });

  it("keeps signature report hash deterministic", () => {
    const request = permitRequest("1000");

    assert.equal(
      analyzeSignature(request).reportHash,
      analyzeSignature(request).reportHash
    );
  });
});

function permitRequest(value: string): SignatureAnalysisRequest {
  return {
    requestId: "permit",
    intent: {
      action: "permit",
      chainId: CHAIN_ID,
      from: FROM,
      verifyingContract: TOKEN,
      spender: SPENDER,
      maxAmount: value
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
          value,
          deadline: "9999999999"
        }
      }
    }
  };
}
