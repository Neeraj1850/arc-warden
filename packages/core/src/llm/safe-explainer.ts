import type { SecurityReport } from "../types/report.types.js";
import type { ReportExplainer } from "./explainer.interface.js";

export class SafeExplainer implements ReportExplainer {
  async explain(report: SecurityReport): Promise<string> {
    return `Deterministic policy engine returned ${report.verdict} with risk score ${report.riskScore}.`;
  }
}
