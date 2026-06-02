import type { IncomingMessage, ServerResponse } from "node:http";
import type { AnalysisRequest } from "@arc-warden/core";
import { requireX402Payment } from "../middleware/x402.middleware.js";
import { analyzeRequest } from "../services/analysis.service.js";
import { readJsonBody, sendJson } from "../server.js";

export async function handleAnalyze(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await requireX402Payment(request);
  const body = await readJsonBody<AnalysisRequest>(request);
  const report = analyzeRequest(body);

  sendJson(response, 200, report);
}
