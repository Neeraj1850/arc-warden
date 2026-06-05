import {
  analyzeTransactionWithSimulation,
  validateAnalysisRequest
} from "@agent-warden/core";
import type { SecurityReport } from "@agent-warden/types";

export async function analyzeRequest(request: unknown): Promise<SecurityReport> {
  return analyzeTransactionWithSimulation(validateAnalysisRequest(request));
}
