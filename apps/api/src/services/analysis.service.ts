import {
  analyzeTransaction,
  type AnalysisRequest,
  type SecurityReport
} from "@arc-warden/core";

export function analyzeRequest(request: AnalysisRequest): SecurityReport {
  return analyzeTransaction(request);
}
