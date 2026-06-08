import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LocalReputationProvider,
  policyViolationsFromReputationSignals
} from "../src/index.ts";

const ROUTER = "0x1111111111111111111111111111111111111111";
const TOKEN = "0x2222222222222222222222222222222222222222";
const RISKY = "0x3333333333333333333333333333333333333333";
const UNKNOWN = "0x4444444444444444444444444444444444444444";

describe("LocalReputationProvider", () => {
  it("classifies known routers", async () => {
    const provider = new LocalReputationProvider({ knownRouters: [ROUTER] });
    const signals = await provider.getSignals(ROUTER);

    assert.equal(signals[0]?.category, "known_router");
    assert.equal(signals[0]?.score, 10);
  });

  it("classifies known tokens", async () => {
    const provider = new LocalReputationProvider({ knownTokens: [TOKEN] });
    const signals = await provider.getSignals(TOKEN);

    assert.equal(signals[0]?.category, "known_token");
    assert.equal(signals[0]?.score, 10);
  });

  it("classifies risky addresses and maps them to policy violations", async () => {
    const provider = new LocalReputationProvider({
      riskyAddresses: {
        [RISKY]: "local test risky address"
      }
    });
    const signals = await provider.getSignals(RISKY);
    const violations = policyViolationsFromReputationSignals(signals);

    assert.equal(signals[0]?.category, "risky_address");
    assert.equal(violations[0]?.code, "LOCAL_RISKY_ADDRESS");
  });

  it("classifies unknown addresses without blocking by default", async () => {
    const provider = new LocalReputationProvider();
    const signals = await provider.getSignals(UNKNOWN);
    const violations = policyViolationsFromReputationSignals(signals);

    assert.equal(signals[0]?.category, "unknown");
    assert.equal(violations.length, 0);
  });
});
