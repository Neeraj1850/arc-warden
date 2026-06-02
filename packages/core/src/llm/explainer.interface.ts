import type { SecurityReport } from "../types/report.types.js";

export interface ReportExplainer {
  explain(report: SecurityReport): Promise<string>;
}
