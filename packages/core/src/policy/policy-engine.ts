import { detectApprovalRisks } from "../analyzer/approval-detector.js";
import { matchIntent } from "../analyzer/intent-matcher.js";
import { decideVerdict, scoreRisk } from "../analyzer/risk-scorer.js";
import type { TransactionIntent } from "../types/intent.types.js";
import type { PolicyDecision } from "../types/policy.types.js";
import type {
  DecodedTransaction,
  UnsignedEvmTransaction
} from "../types/transaction.types.js";

export function evaluatePolicies(
  intent: TransactionIntent,
  transaction: UnsignedEvmTransaction,
  decoded: DecodedTransaction
): PolicyDecision {
  const violations = [
    ...matchIntent(intent, transaction, decoded),
    ...detectApprovalRisks(decoded, intent.allowUnlimitedApproval)
  ];
  const verdict = decideVerdict(violations);

  return {
    verdict,
    riskScore: scoreRisk(decoded, violations),
    violations,
    saferAlternative: buildSaferAlternative(decoded, violations)
  };
}

function buildSaferAlternative(
  decoded: DecodedTransaction,
  violations: PolicyDecision["violations"]
): string | undefined {
  if (violations.some((violation) => violation.code === "UNLIMITED_APPROVAL")) {
    return "Use a bounded approval for the exact intended amount or a short-lived spending allowance.";
  }

  if (violations.some((violation) => violation.code.endsWith("_MISMATCH"))) {
    return "Regenerate the transaction from the original structured intent and verify all addresses before signing.";
  }

  if (decoded.functionName === "unknown") {
    return "Route this transaction to a full ABI-aware decoder and simulator before signing.";
  }

  return undefined;
}
