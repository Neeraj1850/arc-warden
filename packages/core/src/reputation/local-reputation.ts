import type { ReputationProvider, ReputationSignal } from "./reputation.interface.js";
import type { Address } from "../types/transaction.types.js";
import { normalizeAddress } from "../utils/validation.js";

export class LocalReputationProvider implements ReputationProvider {
  private readonly knownRouters: Set<Address>;
  private readonly knownTokens: Set<Address>;
  private readonly riskyAddresses: Map<Address, string>;

  constructor(options: LocalReputationOptions = {}) {
    this.knownRouters = new Set((options.knownRouters ?? []).map(normalizeAddress));
    this.knownTokens = new Set((options.knownTokens ?? []).map(normalizeAddress));
    this.riskyAddresses = new Map(
      Object.entries(options.riskyAddresses ?? {}).map(([address, reason]) => [
        normalizeAddress(address),
        reason
      ])
    );
  }

  async getSignals(subject: string): Promise<ReputationSignal[]> {
    const address = normalizeAddress(subject);
    const signals: ReputationSignal[] = [];
    const riskyReason = this.riskyAddresses.get(address);

    if (riskyReason) {
      signals.push({
        subject: address,
        score: 100,
        category: "risky_address",
        reason: riskyReason
      });
    }

    if (this.knownRouters.has(address)) {
      signals.push({
        subject: address,
        score: 10,
        category: "known_router",
        reason: "Address is present in the local known router registry."
      });
    }

    if (this.knownTokens.has(address)) {
      signals.push({
        subject: address,
        score: 10,
        category: "known_token",
        reason: "Address is present in the local known token registry."
      });
    }

    if (signals.length === 0) {
      signals.push({
        subject: address,
        score: 50,
        category: "unknown",
        reason: "Address is not present in the local deterministic registry."
      });
    }

    return signals;
  }
}

export interface LocalReputationOptions {
  knownRouters?: string[];
  knownTokens?: string[];
  riskyAddresses?: Record<string, string>;
}
