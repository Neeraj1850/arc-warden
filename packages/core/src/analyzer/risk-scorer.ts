import type { PolicyViolation, Verdict } from "../types/policy.types.js";
import type { DecodedTransaction } from "../types/transaction.types.js";

const SEVERITY_WEIGHTS = {
  low: 5,
  medium: 20,
  high: 45,
  critical: 80
} as const;

export function scoreRisk(
  decoded: DecodedTransaction,
  violations: PolicyViolation[]
): number {
  const baseRisk = decoded.functionName === "erc20.approve" ? 15 : 5;
  const violationRisk = violations.reduce(
    (total, violation) => total + SEVERITY_WEIGHTS[violation.severity],
    0
  );

  return Math.min(100, baseRisk + violationRisk);
}

export function decideVerdict(violations: PolicyViolation[]): Verdict {
  if (violations.some((violation) => violation.severity === "critical" || violation.severity === "high")) {
    return "BLOCK";
  }

  if (violations.some((violation) => violation.severity === "medium" || violation.severity === "low")) {
    return "WARN";
  }

  return "ALLOW";
}
