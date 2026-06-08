import type { SecurityReport } from "../types/report.types.js";

export interface ReportExplainer {
  readonly modelName: string;
  explain(report: SecurityReport): Promise<string>;
}
