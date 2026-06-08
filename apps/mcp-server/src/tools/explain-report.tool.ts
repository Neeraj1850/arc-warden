import {
  explainReport,
  GroqExplainer,
  SafeExplainer,
  validateExplainReportRequest
} from "@agent-warden/core";
import type { ExplainReportRequest } from "@agent-warden/types";
import { explainReportInputSchema } from "../schemas/mcp.schemas.js";

export const explainReportToolName = "explain_report";

export const explainReportToolDescription =
  "Explain an existing AgentWarden transaction security report without changing its deterministic verdict.";

export const explainReportToolInputSchema = explainReportInputSchema;

export async function executeExplainReportTool(input: ExplainReportRequest) {
  const request = validateExplainReportRequest(input);
  const primaryExplainer = createDefaultMcpExplainer();
  const explanation = await explainReport(
    request.report,
    primaryExplainer,
    new SafeExplainer()
  );

  console.error(
    `[mcp] explain_report verdict=${explanation.verdict} risk=${explanation.riskScore} hash=${explanation.reportHash} model=${explanation.model}`
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(explanation, bigintJsonReplacer, 2)
      }
    ]
  };
}

function createDefaultMcpExplainer() {
  if (!process.env.GROQ_API_KEY) {
    return new SafeExplainer();
  }

  return new GroqExplainer({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant"
  });
}

function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
