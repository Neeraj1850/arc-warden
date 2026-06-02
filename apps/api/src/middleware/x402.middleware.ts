import type { RequestHandler } from "express";
import type { ApiEnv } from "../config/env.js";

export async function createX402Middleware(env: ApiEnv): Promise<RequestHandler> {
  if (!env.x402Enabled) {
    return (_request, _response, next) => next();
  }

  if (env.x402Mode === "mock") {
    return mockX402Middleware;
  }

  if (!env.x402PayTo) {
    throw new Error("X402_PAY_TO is required when X402_MODE=real");
  }

  const [{ paymentMiddleware, x402ResourceServer }, { ExactEvmScheme }, { HTTPFacilitatorClient }] =
    await Promise.all([
      import("@x402/express"),
      import("@x402/evm/exact/server"),
      import("@x402/core/server")
    ]);

  const facilitatorClient = new HTTPFacilitatorClient({
    url: env.x402FacilitatorUrl
  });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    env.x402Network,
    new ExactEvmScheme()
  );

  console.log(
    `[x402] real middleware enabled route="POST /analyze" price=${env.x402Price} network=${env.x402Network}`
  );

  return paymentMiddleware(
    {
      "POST /analyze": {
        accepts: [
          {
            scheme: "exact",
            price: env.x402Price,
            network: env.x402Network,
            payTo: env.x402PayTo
          }
        ],
        description: "ArcWarden pre-transaction security analysis",
        mimeType: "application/json"
      }
    },
    resourceServer
  ) as RequestHandler;
}

const mockX402Middleware: RequestHandler = (request, response, next) => {
  if (request.method !== "POST" || request.path !== "/analyze") {
    next();
    return;
  }

  const mockPayment = request.headers["x-arcwarden-mock-payment"];
  if (!mockPayment) {
    console.log("[x402] mock payment missing for POST /analyze");
    response.status(402).json({
      error: "Payment required",
      mode: "mock",
      paymentHeader: "x-arcwarden-mock-payment",
      message:
        "Set x-arcwarden-mock-payment: paid to exercise the local flow without testnet USDC."
    });
    return;
  }

  console.log(`[x402] mock payment accepted value=${String(mockPayment)}`);
  next();
};
