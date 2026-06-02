import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  if (error instanceof Error && error.name === "PaymentRequiredError") {
    response.status(402).json({
      error: "Payment required",
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "Bad request",
    message: error instanceof Error ? error.message : "Unknown error"
  });
};
