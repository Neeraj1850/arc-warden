import type { TransactionIntent } from "./intent.types.js";
import type { PolicyViolation, Verdict } from "./policy.types.js";
import type {
  DecodedTransaction,
  TokenBalanceDelta,
  UnsignedEvmTransaction
} from "./transaction.types.js";

export interface AnalysisRequest {
  intent: TransactionIntent;
  transaction: UnsignedEvmTransaction;
  requestId?: string;
}

export interface SimulationResult {
  status: "not_run" | "success" | "failed";
  engine: "local-static" | "eth_call" | "anvil" | "tenderly" | "blocksec";
  summary: string;
  balanceDeltas: TokenBalanceDelta[];
}

export interface SecurityReport {
  requestId?: string;
  verdict: Verdict;
  riskScore: number;
  decodedTransaction: DecodedTransaction;
  policyViolations: PolicyViolation[];
  simulationResult: SimulationResult;
  saferAlternative?: string;
  reportHash: string;
}
