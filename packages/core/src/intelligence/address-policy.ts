import type { PolicyViolation } from "../types/policy.types.js";
import type { ReputationSignal } from "../reputation/reputation.interface.js";

export function policyViolationsFromReputationSignals(
  signals: ReputationSignal[]
): PolicyViolation[] {
  return signals
    .filter((signal) => signal.category === "risky_address")
    .map((signal) => ({
      code: "LOCAL_RISKY_ADDRESS",
      severity: "critical",
      message: "Address is present in the local risky address registry.",
      actual: `${signal.subject}: ${signal.reason}`
    }));
}
