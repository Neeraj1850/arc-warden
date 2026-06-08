import { Router } from "express";
import type { ExplainReportResponse } from "@agent-warden/types";
import {
  defaultAnalysisService,
  type AnalysisService
} from "../services/analysis.service.js";
import { jsonStringify, responseLocals } from "../server.js";

export function createExplainReportRouter(
  analysisService: AnalysisService = defaultAnalysisService
): Router {
  const router = Router();

  router.post("/explain-report", async (request, response, next) => {
    try {
      const explanation = await analysisService.explainReportRequest(request.body);
      logExplanation(responseLocals(request).requestId, explanation);

      response.status(200).type("application/json").send(jsonStringify(explanation));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function logExplanation(requestId: string, explanation: ExplainReportResponse): void {
  console.log(
    `[api] explain-report ${requestId} verdict=${explanation.verdict} risk=${explanation.riskScore} hash=${explanation.reportHash} model=${explanation.model}`
  );
}
