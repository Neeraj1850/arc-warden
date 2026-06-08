import type { PolicyViolation } from "../types/policy.types.js";
import type { SecurityReport } from "../types/report.types.js";
import type { SignatureSecurityReport } from "../types/signature.types.js";
import type { Address, UnsignedEvmTransaction } from "../types/transaction.types.js";
import { normalizeAddress } from "../utils/validation.js";

export const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000;

export type SessionEventKind =
  | "approval"
  | "permit_signature"
  | "operator_approval"
  | "unknown_selector";

export interface SessionEvent {
  kind: SessionEventKind;
  signer: Address;
  target?: Address;
  spender?: Address;
  riskScore: number;
  verdict: SecurityReport["verdict"];
  reportHash: string;
  observedAt: number;
  expiresAt: number;
}

export interface SessionMemoryOptions {
  ttlMs?: number;
  now?: () => number;
}

export class InMemorySessionStore {
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly eventsBySigner = new Map<Address, SessionEvent[]>();

  constructor(options: SessionMemoryOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_SESSION_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  recordTransaction(signer: Address, report: SecurityReport): void {
    const events = sessionEventsFromTransactionReport(
      normalizeAddress(signer),
      report,
      this.now(),
      this.ttlMs
    );

    this.addEvents(events);
  }

  recordSignature(signer: Address, report: SignatureSecurityReport): void {
    const events = sessionEventsFromSignatureReport(
      normalizeAddress(signer),
      report,
      this.now(),
      this.ttlMs
    );

    this.addEvents(events);
  }

  evaluateTransaction(
    signer: Address,
    transaction: UnsignedEvmTransaction
  ): PolicyViolation[] {
    const events = this.activeEvents(normalizeAddress(signer));
    const target = transaction.to ? normalizeAddress(transaction.to) : undefined;
    const recentApproval = events.find(
      (event) =>
        ["approval", "permit_signature", "operator_approval"].includes(event.kind) &&
        (!target || !event.target || event.target === target)
    );

    if (!recentApproval) {
      return [];
    }

    return [
      {
        code: "RECENT_APPROVAL_SEQUENCE",
        severity: "high",
        message:
          "Signer recently approved token spending or operator permissions before this transaction.",
        expected: "independent review between approval and follow-up transaction",
        actual: `${recentApproval.kind}:${recentApproval.reportHash}`
      }
    ];
  }

  getEvents(signer: Address): SessionEvent[] {
    return this.activeEvents(normalizeAddress(signer));
  }

  clear(): void {
    this.eventsBySigner.clear();
  }

  private addEvents(events: SessionEvent[]): void {
    for (const event of events) {
      const existing = this.activeEvents(event.signer);
      existing.push(event);
      this.eventsBySigner.set(event.signer, existing);
    }
  }

  private activeEvents(signer: Address): SessionEvent[] {
    const now = this.now();
    const active = (this.eventsBySigner.get(signer) ?? []).filter(
      (event) => event.expiresAt > now
    );

    this.eventsBySigner.set(signer, active);
    return active;
  }
}

export function sessionEventsFromTransactionReport(
  signer: Address,
  report: SecurityReport,
  observedAt: number,
  ttlMs = DEFAULT_SESSION_TTL_MS
): SessionEvent[] {
  return report.decodedActions
    .map((action): SessionEvent | undefined => {
      if (action.actionType === "erc20_approval") {
        return buildEvent("approval", signer, report, observedAt, ttlMs, {
          target: action.tokenAddress ?? action.contractAddress,
          spender: action.spender
        });
      }

      if (
        action.actionType === "erc721_operator_approval" ||
        action.actionType === "erc1155_operator_approval"
      ) {
        return buildEvent("operator_approval", signer, report, observedAt, ttlMs, {
          target: action.tokenAddress ?? action.contractAddress,
          spender: action.operator
        });
      }

      if (action.actionType === "unknown_contract_call") {
        return buildEvent("unknown_selector", signer, report, observedAt, ttlMs, {
          target: action.contractAddress
        });
      }

      return undefined;
    })
    .filter((event): event is SessionEvent => event !== undefined);
}

export function sessionEventsFromSignatureReport(
  signer: Address,
  report: SignatureSecurityReport,
  observedAt: number,
  ttlMs = DEFAULT_SESSION_TTL_MS
): SessionEvent[] {
  if (
    report.actionType !== "permit_signature" &&
    report.actionType !== "permit2_signature"
  ) {
    return [];
  }

  return [
    {
      kind: "permit_signature",
      signer,
      target: report.decodedSignature.verifyingContract,
      spender: report.decodedSignature.spender,
      riskScore: report.riskScore,
      verdict: report.verdict,
      reportHash: report.reportHash,
      observedAt,
      expiresAt: observedAt + ttlMs
    }
  ];
}

function buildEvent(
  kind: SessionEventKind,
  signer: Address,
  report: SecurityReport,
  observedAt: number,
  ttlMs: number,
  details: { target?: Address; spender?: Address }
): SessionEvent {
  return {
    kind,
    signer,
    target: details.target,
    spender: details.spender,
    riskScore: report.riskScore,
    verdict: report.verdict,
    reportHash: report.reportHash,
    observedAt,
    expiresAt: observedAt + ttlMs
  };
}
