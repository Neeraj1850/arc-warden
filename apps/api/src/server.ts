import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleAnalyze } from "./routes/analyze.route.js";
import { handleHealth } from "./routes/health.route.js";
import { sendError } from "./middleware/error.middleware.js";

export function createApiServer() {
  return createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        handleHealth(response);
        return;
      }

      if (request.method === "POST" && request.url === "/analyze") {
        await handleAnalyze(request, response);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendError(response, error);
    }
  });
}

export async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    throw new Error("Request body is required");
  }

  return JSON.parse(rawBody) as T;
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body, bigintJsonReplacer, 2));
}

function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
