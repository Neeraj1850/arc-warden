import { decodeCalldata } from "./calldata-decoder.js";
import { inferStaticBalanceDeltas } from "./balance-delta-analyzer.js";
import { evaluatePolicies } from "../policy/policy-engine.js";
import type {
  AnalysisRequest,
  SecurityReport,
  SimulationResult
} from "../types/report.types.js";
import { hashObject } from "../utils/hashing.js";

export function analyzeTransaction(request: AnalysisRequest): SecurityReport {
  const decodedTransaction = decodeCalldata(request.transaction);
  const policyDecision = evaluatePolicies(
    request.intent,
    request.transaction,
    decodedTransaction
  );
  const simulationResult: SimulationResult = {
    status: "not_run",
    engine: "local-static",
    summary: "Static MVP analysis only. No RPC simulation was executed.",
    balanceDeltas: inferStaticBalanceDeltas(request.transaction, decodedTransaction)
  };

  const reportWithoutHash = {
    requestId: request.requestId,
    verdict: policyDecision.verdict,
    riskScore: policyDecision.riskScore,
    decodedTransaction,
    policyViolations: policyDecision.violations,
    simulationResult,
    saferAlternative: policyDecision.saferAlternative
  };

  return {
    ...reportWithoutHash,
    reportHash: hashObject({
      intent: request.intent,
      transaction: request.transaction,
      report: reportWithoutHash
    })
  };
}
