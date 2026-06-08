import { Router } from "express";
import type { SecurityReport } from "@agent-warden/types";
import {
  defaultAnalysisService,
  type AnalysisService
} from "../services/analysis.service.js";
import { jsonStringify, responseLocals } from "../server.js";

export function createAnalyzeRouter(
  analysisService: AnalysisService = defaultAnalysisService
): Router {
  const router = Router();

  router.post("/analyze", async (request, response, next) => {
    try {
      const report = await analysisService.analyzeRequest(request.body);
      logReport(responseLocals(request).requestId, report);

      response.status(200).type("application/json").send(jsonStringify(report));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function logReport(requestId: string, report: SecurityReport): void {
  console.log(
    `[api] analysis ${requestId} verdict=${report.verdict} risk=${report.riskScore} hash=${report.reportHash}`
  );
}
