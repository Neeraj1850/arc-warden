import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { SecurityReport } from "../types/report.types.js";
import type { ReportExplainer } from "./explainer.interface.js";

export interface GroqLikeModel {
  invoke(messages: Array<HumanMessage | SystemMessage>): Promise<{ content: unknown }>;
}

export interface GroqExplainerOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  chatModel?: GroqLikeModel;
}

export class GroqExplainer implements ReportExplainer {
  readonly modelName: string;
  private readonly model: GroqLikeModel;

  constructor(options: GroqExplainerOptions = {}) {
    this.modelName = options.model ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
    this.model =
      options.chatModel ??
      new ChatGroq({
        apiKey: options.apiKey ?? process.env.GROQ_API_KEY,
        model: this.modelName,
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
          "Summarize top findings, why they matter, and the safest next action.",
          "Keep the explanation concise and operational."
        ].join(" ")
      ),
      new HumanMessage(JSON.stringify(buildPromptReport(report), null, 2))
    ]);

    return normalizeContent(response.content);
  }
}

export function buildPromptReport(report: SecurityReport): unknown {
  return {
    verdict: report.verdict,
    riskScore: report.riskScore,
    riskVector: report.riskVector,
    actionType: report.actionType,
    summary: report.summary,
    findings: report.findings,
    policyViolations: report.policyViolations,
    stateFindings: report.stateFindings,
    recommendedAction: report.recommendedAction,
    saferAlternative: report.saferAlternative,
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
