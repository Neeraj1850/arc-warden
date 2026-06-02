import { analyzeTransaction, type AnalysisRequest } from "@arc-warden/core";
import { analyzeTransactionInputSchema } from "../schemas/mcp.schemas.js";

export const analyzeTransactionTool = {
  name: "analyze_transaction",
  description:
    "Analyze structured intent and unsigned EVM transaction data before an AI agent signs or broadcasts it.",
  inputSchema: analyzeTransactionInputSchema,
  execute(input: AnalysisRequest) {
    return analyzeTransaction(input);
  }
};
