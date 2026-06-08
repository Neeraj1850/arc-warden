import type { ExplainReportResponse, SecurityReport } from "../types/report.types.js";
import type { ReportExplainer } from "./explainer.interface.js";

export const EXPLAIN_REPORT_SAFETY_NOTICE =
  "This explanation is non-authoritative. The deterministic AgentWarden verdict, risk score, findings, and report hash remain the source of truth.";

export async function explainReport(
  report: SecurityReport,
  explainer: ReportExplainer,
  fallbackExplainer: ReportExplainer = explainer
): Promise<ExplainReportResponse> {
  try {
    return buildExplainReportResponse(
      report,
      explainer.modelName,
      await explainer.explain(report)
    );
  } catch {
    return buildExplainReportResponse(
      report,
      fallbackExplainer.modelName,
      await fallbackExplainer.explain(report)
    );
  }
}

function buildExplainReportResponse(
  report: SecurityReport,
  model: string,
  explanation: string
): ExplainReportResponse {
  return {
    verdict: report.verdict,
    riskScore: report.riskScore,
    reportHash: report.reportHash,
    model,
    explanation,
    safetyNotice: EXPLAIN_REPORT_SAFETY_NOTICE
  };
}
