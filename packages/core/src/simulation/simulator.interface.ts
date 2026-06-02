import type { AnalysisRequest, SimulationResult } from "../types/report.types.js";

export interface TransactionSimulator {
  simulate(request: AnalysisRequest): Promise<SimulationResult>;
}
