import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { AnalysisRequest } from "@agent-warden/core";
import {
  analyzeTransactionToolDescription,
  analyzeTransactionToolInputSchema,
  analyzeTransactionToolName,
  executeAnalyzeTransactionTool
} from "./tools/analyze-transaction.tool.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "agent-warden",
    version: "0.1.0"
  });

  server.tool(
    analyzeTransactionToolName,
    analyzeTransactionToolDescription,
    analyzeTransactionToolInputSchema,
    async (input) => executeAnalyzeTransactionTool(input as AnalysisRequest)
  );

  return server;
}

if (process.argv.includes("--describe")) {
  console.log(
    JSON.stringify(
      {
        name: "agent-warden",
        transport: "stdio",
        tools: [
          {
            name: analyzeTransactionToolName,
            description: analyzeTransactionToolDescription
          }
        ]
      },
      null,
      2
    )
  );
} else {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("[mcp] AgentWarden MCP server connected over stdio");
}
