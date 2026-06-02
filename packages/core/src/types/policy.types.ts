export type Verdict = "ALLOW" | "WARN" | "BLOCK";

export type ViolationSeverity = "low" | "medium" | "high" | "critical";

export interface PolicyViolation {
  code: string;
  severity: ViolationSeverity;
  message: string;
  expected?: string;
  actual?: string;
}

export interface PolicyDecision {
  verdict: Verdict;
  riskScore: number;
  violations: PolicyViolation[];
  saferAlternative?: string;
}
