import type { ServerResponse } from "node:http";
import { sendJson } from "../server.js";

export function sendError(response: ServerResponse, error: unknown): void {
  if (error instanceof Error && error.name === "PaymentRequiredError") {
    sendJson(response, 402, {
      error: "Payment required",
      message: error.message
    });
    return;
  }

  sendJson(response, 400, {
    error: "Bad request",
    message: error instanceof Error ? error.message : "Unknown error"
  });
}
