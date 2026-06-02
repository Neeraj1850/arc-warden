import type { ServerResponse } from "node:http";
import { sendJson } from "../server.js";

export function handleHealth(response: ServerResponse): void {
  sendJson(response, 200, {
    status: "ok",
    service: "arc-warden-api"
  });
}
