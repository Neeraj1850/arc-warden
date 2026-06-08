import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPromptReport,
  GroqExplainer,
  SafeExplainer,
  type SecurityReport
} from "../src/index.ts";

describe("Report explainers", () => {
  it("returns deterministic safe fallback text", async () => {
    const explainer = new SafeExplainer();
    const explanation = await explainer.explain(sampleSecurityReport());

    assert.equal(explainer.modelName, "safe-fallback");
    assert.match(
      explanation,
      /Deterministic policy engine returned BLOCK with risk score 95/
    );
  });

  it("builds a bounded Groq prompt payload", () => {
    const report = sampleSecurityReport();
    const prompt = buildPromptReport(report) as Record<string, unknown>;

    assert.equal(prompt.verdict, "BLOCK");
    assert.equal(prompt.riskScore, 95);
    assert.equal(prompt.actionType, "erc20_approval");
    assert.ok("findings" in prompt);
    assert.ok("policyViolations" in prompt);
    assert.ok("stateFindings" in prompt);
    assert.ok("simulation" in prompt);
    assert.ok(!("decodedTransaction" in prompt));
    assert.ok(!("transactionEnvelope" in prompt));
    assert.ok(!("executionGraph" in prompt));
    assert.ok(!("reportHash" in prompt));
  });

  it("passes the bounded prompt to the Groq model", async () => {
    let capturedMessages: unknown[] = [];
    const explainer = new GroqExplainer({
      model: "test-groq-model",
      chatModel: {
        async invoke(messages: unknown[]) {
          capturedMessages = messages;
          return { content: "Explained safely." };
        }
      }
    });

    const explanation = await explainer.explain(sampleSecurityReport());

    assert.equal(explainer.modelName, "test-groq-model");
    assert.equal(explanation, "Explained safely.");
    assert.equal(capturedMessages.length, 2);
    assert.ok(JSON.stringify(capturedMessages).includes("Never override"));
    assert.ok(!JSON.stringify(capturedMessages).includes("decodedTransaction"));
  });
});

function sampleSecurityReport(): SecurityReport {
  return {
    verdict: "BLOCK",
    riskScore: 95,
    riskVector: {
      contractRisk: 10,
      tokenRisk: 40,
      behaviorRisk: 95,
      intentDelta: 60,
      sanctionsRisk: 0,
      simulationRisk: 0
    },
    summary: "BLOCK: erc20 approval classified as critical risk.",
    explanation: "Static analyzer explanation.",
    findings: [
      {
        code: "UNLIMITED_APPROVAL",
        title: "Unlimited approval",
        severity: "critical",
        detail: "Approval grants unlimited spend.",
        evidence: ["amount=max uint256"]
      }
    ],
    recommendedAction: "Use a bounded approval.",
    transactionEnvelope: {
      type: "legacy",
      chainId: 5042002,
      hasAccessList: false,
      hasAuthorizationList: false,
      hasBlobFields: false
    },
    actionType: "erc20_approval",
    executionGraph: {
      rootNodeId: "root",
      nodes: [
        {
          id: "root",
          depth: 0,
          kind: "root",
          actionType: "erc20_approval",
          functionName: "erc20.approve",
          selector: "0x095ea7b3",
          evidence: [],
          warnings: []
        }
      ],
      edges: [],
      maxDepth: 0,
      hasNestedExecution: false,
      hasUnknownNode: false
    },
    decodedActions: [],
    assetDeltas: [],
    approvalFindings: [],
    decodedTransaction: {
      selector: "0x095ea7b3",
      functionName: "erc20.approve",
      warnings: []
    },
    policyViolations: [
      {
        code: "UNLIMITED_APPROVAL",
        severity: "critical",
        message: "Transaction grants an unlimited ERC-20 allowance."
      }
    ],
    simulationResult: {
      status: "not_run",
      engine: "local-static",
      summary: "Simulation disabled.",
      balanceDeltas: []
    },
    stateFindings: [],
    saferAlternative: "Use a bounded approval.",
    reportHash: "0x2222222222222222222222222222222222222222222222222222222222222222"
  };
}
