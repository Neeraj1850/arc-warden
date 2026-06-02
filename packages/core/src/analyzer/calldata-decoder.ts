import type {
  DecodedTransaction,
  Hex,
  UnsignedEvmTransaction
} from "../types/transaction.types.js";
import {
  decodeAddressWord,
  normalizeAddress,
  normalizeHexData,
  parseUint256Word,
  strip0x
} from "../utils/validation.js";

export const ERC20_TRANSFER_SELECTOR = "0xa9059cbb" as const;
export const ERC20_APPROVE_SELECTOR = "0x095ea7b3" as const;

export function decodeCalldata(
  transaction: UnsignedEvmTransaction
): DecodedTransaction {
  const data = normalizeHexData(transaction.data);
  const selector = data.length >= 10 ? (data.slice(0, 10) as Hex) : ("0x" as Hex);

  if (selector === ERC20_TRANSFER_SELECTOR) {
    return decodeErc20Transfer(transaction, selector);
  }

  if (selector === ERC20_APPROVE_SELECTOR) {
    return decodeErc20Approve(transaction, selector);
  }

  return {
    functionName: "unknown",
    selector,
    tokenAddress: normalizeAddress(transaction.to),
    warnings: [`Unsupported function selector ${selector}`]
  };
}

function decodeErc20Transfer(
  transaction: UnsignedEvmTransaction,
  selector: Hex
): DecodedTransaction {
  const words = getTwoWords(transaction.data);
  if (!words) {
    return malformed(selector, transaction, "Malformed ERC-20 transfer calldata");
  }

  const recipient = decodeAddressWord(words[0]);
  const rawAmount = parseUint256Word(words[1]);

  return {
    functionName: "erc20.transfer",
    selector,
    tokenAddress: normalizeAddress(transaction.to),
    recipient,
    amount: rawAmount.toString(),
    rawAmount,
    warnings: []
  };
}

function decodeErc20Approve(
  transaction: UnsignedEvmTransaction,
  selector: Hex
): DecodedTransaction {
  const words = getTwoWords(transaction.data);
  if (!words) {
    return malformed(selector, transaction, "Malformed ERC-20 approve calldata");
  }

  const spender = decodeAddressWord(words[0]);
  const rawAmount = parseUint256Word(words[1]);

  return {
    functionName: "erc20.approve",
    selector,
    tokenAddress: normalizeAddress(transaction.to),
    spender,
    amount: rawAmount.toString(),
    rawAmount,
    warnings: []
  };
}

function getTwoWords(data: string): [string, string] | undefined {
  const body = strip0x(data).slice(8);
  if (body.length < 128) {
    return undefined;
  }

  return [body.slice(0, 64), body.slice(64, 128)];
}

function malformed(
  selector: Hex,
  transaction: UnsignedEvmTransaction,
  message: string
): DecodedTransaction {
  return {
    functionName: "unknown",
    selector,
    tokenAddress: normalizeAddress(transaction.to),
    warnings: [message]
  };
}
