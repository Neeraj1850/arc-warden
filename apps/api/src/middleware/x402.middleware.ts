import type { IncomingMessage } from "node:http";
import { getEnv } from "../config/env.js";

export async function requireX402Payment(request: IncomingMessage): Promise<void> {
  const env = getEnv();

  if (!env.x402Enabled) {
    return;
  }

  const paymentHeader = request.headers["x-payment"];
  if (!paymentHeader) {
    const error = new Error("x402 payment header is required");
    error.name = "PaymentRequiredError";
    throw error;
  }

  // Future implementation: verify payment with x402 facilitator and bind it to the request hash.
}
