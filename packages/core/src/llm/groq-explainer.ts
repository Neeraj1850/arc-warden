import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { SecurityReport } from "../types/report.types.js";
import type { ReportExplainer } from "./explainer.interface.js";

export interface GroqExplainerOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export class GroqExplainer implements ReportExplainer {
  private readonly model: ChatGroq;

  constructor(options: GroqExplainerOptions = {}) {
    this.model = new ChatGroq({
      apiKey: options.apiKey ?? process.env.GROQ_API_KEY,
      model: options.model ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
      temperature: options.temperature ?? 0
    });
  }

  async explain(report: SecurityReport): Promise<string> {
    const response = await this.model.invoke([
      new SystemMessage(
        [
          "You explain AgentWarden security reports for AI-agent transaction review.",
          "Never override the deterministic verdict.",
          "Do not tell the user to sign a BLOCK transaction.",
          "Keep the explanation concise and operational."
        ].join(" ")
      ),
      new HumanMessage(JSON.stringify(buildPromptReport(report), null, 2))
    ]);

    return normalizeContent(response.content);
  }
}

function buildPromptReport(report: SecurityReport): unknown {
  return {
    verdict: report.verdict,
    riskScore: report.riskScore,
    riskVector: report.riskVector,
    actionType: report.actionType,
    summary: report.summary,
    policyViolations: report.policyViolations,
    recommendedAction: report.recommendedAction,
    simulation: {
      status: report.simulationResult.status,
      engine: report.simulationResult.engine,
      revertReason: report.simulationResult.revertReason
    }
  };
}

function normalizeContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return JSON.stringify(item);
      })
      .join("\n");
  }

  return JSON.stringify(content);
}
