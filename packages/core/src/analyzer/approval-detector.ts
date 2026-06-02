import type { PolicyViolation } from "../types/policy.types.js";
import type { DecodedTransaction } from "../types/transaction.types.js";

export const MAX_UINT256 = (1n << 256n) - 1n;

export function detectApprovalRisks(
  decoded: DecodedTransaction,
  allowUnlimitedApproval = false
): PolicyViolation[] {
  if (decoded.functionName !== "erc20.approve" || decoded.rawAmount === undefined) {
    return [];
  }

  if (decoded.rawAmount === MAX_UINT256 && !allowUnlimitedApproval) {
    return [
      {
        code: "UNLIMITED_APPROVAL",
        severity: "critical",
        message: "Transaction grants an unlimited ERC-20 allowance.",
        expected: "bounded approval amount",
        actual: decoded.amount
      }
    ];
  }

  if (decoded.rawAmount === MAX_UINT256 && allowUnlimitedApproval) {
    return [
      {
        code: "UNLIMITED_APPROVAL_ALLOWED",
        severity: "medium",
        message: "Intent explicitly allows unlimited approval, but this remains risky.",
        expected: "bounded approval amount preferred",
        actual: decoded.amount
      }
    ];
  }

  return [];
}
