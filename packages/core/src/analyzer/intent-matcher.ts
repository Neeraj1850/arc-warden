import type { TransactionIntent } from "../types/intent.types.js";
import type { PolicyViolation } from "../types/policy.types.js";
import type {
  DecodedTransaction,
  UnsignedEvmTransaction
} from "../types/transaction.types.js";
import {
  areAddressesEqual,
  parseAmount
} from "../utils/validation.js";

export function matchIntent(
  intent: TransactionIntent,
  transaction: UnsignedEvmTransaction,
  decoded: DecodedTransaction
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  if (intent.chainId !== transaction.chainId) {
    violations.push({
      code: "CHAIN_MISMATCH",
      severity: "critical",
      message: "Transaction chain does not match the declared intent chain.",
      expected: String(intent.chainId),
      actual: String(transaction.chainId)
    });
  }

  if (!areAddressesEqual(intent.from, transaction.from)) {
    violations.push({
      code: "SENDER_MISMATCH",
      severity: "critical",
      message: "Transaction sender does not match the declared intent sender.",
      expected: intent.from,
      actual: transaction.from
    });
  }

  if (intent.tokenAddress && decoded.tokenAddress && !areAddressesEqual(intent.tokenAddress, decoded.tokenAddress)) {
    violations.push({
      code: "TOKEN_MISMATCH",
      severity: "high",
      message: "Transaction token contract does not match the declared intent token.",
      expected: intent.tokenAddress,
      actual: decoded.tokenAddress
    });
  }

  if (decoded.functionName === "unknown") {
    violations.push({
      code: "UNKNOWN_FUNCTION_SELECTOR",
      severity: "high",
      message: "Calldata selector is unsupported by the MVP decoder.",
      actual: decoded.selector
    });
    return violations;
  }

  if (intent.action === "transfer" && decoded.functionName !== "erc20.transfer") {
    violations.push({
      code: "ACTION_MISMATCH",
      severity: "high",
      message: "Intent expects a transfer, but transaction performs a different action.",
      expected: "erc20.transfer",
      actual: decoded.functionName
    });
  }

  if (intent.action === "approve" && decoded.functionName !== "erc20.approve") {
    violations.push({
      code: "ACTION_MISMATCH",
      severity: "high",
      message: "Intent expects an approval, but transaction performs a different action.",
      expected: "erc20.approve",
      actual: decoded.functionName
    });
  }

  if (decoded.functionName === "erc20.transfer") {
    matchTransferIntent(intent, decoded, violations);
  }

  if (decoded.functionName === "erc20.approve") {
    matchApprovalIntent(intent, decoded, violations);
  }

  matchAmount(intent, decoded, violations);

  return violations;
}

function matchTransferIntent(
  intent: TransactionIntent,
  decoded: DecodedTransaction,
  violations: PolicyViolation[]
): void {
  if (intent.recipient && decoded.recipient && !areAddressesEqual(intent.recipient, decoded.recipient)) {
    violations.push({
      code: "RECIPIENT_MISMATCH",
      severity: "critical",
      message: "Transfer recipient does not match the declared intent recipient.",
      expected: intent.recipient,
      actual: decoded.recipient
    });
  }
}

function matchApprovalIntent(
  intent: TransactionIntent,
  decoded: DecodedTransaction,
  violations: PolicyViolation[]
): void {
  if (intent.spender && decoded.spender && !areAddressesEqual(intent.spender, decoded.spender)) {
    violations.push({
      code: "SPENDER_MISMATCH",
      severity: "critical",
      message: "Approval spender does not match the declared intent spender.",
      expected: intent.spender,
      actual: decoded.spender
    });
  }
}

function matchAmount(
  intent: TransactionIntent,
  decoded: DecodedTransaction,
  violations: PolicyViolation[]
): void {
  if (decoded.rawAmount === undefined) {
    return;
  }

  const exactAmount = parseAmount(intent.amount);
  const maxAmount = parseAmount(intent.maxAmount);

  if (exactAmount !== undefined && decoded.rawAmount !== exactAmount) {
    violations.push({
      code: "AMOUNT_MISMATCH",
      severity: "high",
      message: "Transaction amount does not match the declared exact amount.",
      expected: exactAmount.toString(),
      actual: decoded.rawAmount.toString()
    });
  }

  if (maxAmount !== undefined && decoded.rawAmount > maxAmount) {
    violations.push({
      code: "AMOUNT_EXCEEDS_MAX",
      severity: "high",
      message: "Transaction amount exceeds the declared maximum amount.",
      expected: maxAmount.toString(),
      actual: decoded.rawAmount.toString()
    });
  }
}
