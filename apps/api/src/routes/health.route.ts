import { Router } from "express";

export function createHealthRouter(): Router {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "agent-warden-api"
    });
  });

  return router;
}
