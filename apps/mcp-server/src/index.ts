import { analyzeTransactionTool } from "./tools/analyze-transaction.tool.js";

export const tools = [analyzeTransactionTool];

if (process.argv.includes("--describe")) {
  console.log(JSON.stringify({ tools }, null, 2));
}
