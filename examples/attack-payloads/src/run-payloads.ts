import {
  analyzeTransaction,
  type SecurityReport,
  type Verdict
} from "@agent-warden/core";
import { demoPayloads, type DemoPayload } from "./payloads.js";

const mode = process.argv.includes("--api") ? "api" : "local";
const apiUrl = process.env.AGENTWARDEN_API_URL ?? "http://localhost:8787/analyze";

console.log(`[attack-payloads] mode=${mode}`);
if (mode === "api") {
  console.log(`[attack-payloads] api=${apiUrl}`);
}

let failures = 0;

for (const payload of demoPayloads) {
  const report =
    mode === "api"
      ? await analyzeViaApi(apiUrl, payload)
      : analyzeTransaction(payload.request);
  const passed = report.verdict === payload.expectedVerdict;

  if (!passed) {
    failures += 1;
  }

  printResult(payload, report, passed);
}

console.log(
  `[attack-payloads] complete total=${demoPayloads.length} failures=${failures}`
);

if (failures > 0) {
  process.exitCode = 1;
}

async function analyzeViaApi(
  url: string,
  payload: DemoPayload
): Promise<SecurityReport> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": payload.request.requestId ?? payload.id,
      "x-agentwarden-mock-payment": "paid"
    },
    body: JSON.stringify(payload.request)
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `AgentWarden API rejected ${payload.id}: ${response.status} ${responseText}`
    );
  }

  return JSON.parse(responseText) as SecurityReport;
}

function printResult(
  payload: DemoPayload,
  report: SecurityReport,
  passed: boolean
): void {
  const status = passed ? "PASS" : "FAIL";
  const violations = report.policyViolations
    .map((violation) => violation.code)
    .join(",");

  console.log(
    `[${status}] ${payload.id} source=${payload.source} expected=${payload.expectedVerdict} actual=${report.verdict} risk=${report.riskScore} action=${report.actionType}`
  );

  if (violations) {
    console.log(`       violations=${violations}`);
  }

  if (!passed) {
    console.log(`       title=${payload.title}`);
    console.log(`       hash=${report.reportHash}`);
  }
}
