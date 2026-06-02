import type { AnalysisRequest, SimulationResult } from "../types/report.types.js";
import type { TransactionSimulator } from "./simulator.interface.js";

export class EthCallSimulator implements TransactionSimulator {
  async simulate(_request: AnalysisRequest): Promise<SimulationResult> {
    return {
      status: "not_run",
      engine: "eth_call",
      summary: "eth_call simulator placeholder. No RPC call is made in the MVP.",
      balanceDeltas: []
    };
  }
}
