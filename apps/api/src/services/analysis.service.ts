import {
  applyAdditionalPolicyViolations,
  analyzeSignature,
  analyzeTransactionWithSimulation,
  InMemorySessionStore,
  LocalReputationProvider,
  policyViolationsFromReputationSignals,
  validateAnalysisRequest
} from "@agent-warden/core";
import type {
  AnalysisRequest,
  PolicyViolation,
  ReputationProvider,
  SecurityReport,
  SignatureAnalysisRequest,
  SignatureSecurityReport
} from "@agent-warden/core";

export interface AnalysisService {
  analyzeRequest(request: unknown): Promise<SecurityReport>;
  analyzeSignatureRequest(request: unknown): SignatureSecurityReport;
}

export interface AnalysisServiceOptions {
  sessionStore?: InMemorySessionStore;
  reputationProvider?: ReputationProvider;
}

export function createAnalysisService(
  options: AnalysisServiceOptions = {}
): AnalysisService {
  const sessionStore = options.sessionStore ?? new InMemorySessionStore();
  const reputationProvider = options.reputationProvider ?? new LocalReputationProvider();

  return {
    async analyzeRequest(request: unknown): Promise<SecurityReport> {
      const normalizedRequest = validateAnalysisRequest(request);
      const sessionViolations = sessionStore.evaluateTransaction(
        normalizedRequest.transaction.from,
        normalizedRequest.transaction
      );
      const baseReport = await analyzeTransactionWithSimulation(normalizedRequest);
      const reputationViolations = await collectReputationViolations(
        normalizedRequest,
        baseReport,
        reputationProvider
      );
      const report = applyAdditionalPolicyViolations(normalizedRequest, baseReport, [
        ...sessionViolations,
        ...reputationViolations
      ]);

      sessionStore.recordTransaction(normalizedRequest.transaction.from, report);
      return report;
    },

    analyzeSignatureRequest(request: unknown): SignatureSecurityReport {
      const signatureRequest = request as SignatureAnalysisRequest;
      const report = analyzeSignature(signatureRequest);

      sessionStore.recordSignature(signatureRequest.intent.from, report);
      return report;
    }
  };
}

async function collectReputationViolations(
  request: AnalysisRequest,
  report: SecurityReport,
  reputationProvider: ReputationProvider
): Promise<PolicyViolation[]> {
  const subjects = new Set<string>();
  if (request.transaction.to) {
    subjects.add(request.transaction.to);
  }

  for (const action of report.decodedActions) {
    for (const address of [
      action.contractAddress,
      action.tokenAddress,
      action.recipient,
      action.spender,
      action.operator
    ]) {
      if (address) {
        subjects.add(address);
      }
    }
  }

  const signals = (
    await Promise.all(
      [...subjects].map((subject) => reputationProvider.getSignals(subject))
    )
  ).flat();

  return policyViolationsFromReputationSignals(signals);
}

export const defaultAnalysisService = createAnalysisService();
