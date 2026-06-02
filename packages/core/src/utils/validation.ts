import type { Address, Hex } from "../types/transaction.types.js";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const HEX_PATTERN = /^0x([a-fA-F0-9]{2})*$/;

export function isAddress(value: string | undefined): value is Address {
  return typeof value === "string" && ADDRESS_PATTERN.test(value);
}

export function normalizeAddress(value: string): Address {
  if (!isAddress(value)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }

  return value.toLowerCase() as Address;
}

export function areAddressesEqual(left?: string, right?: string): boolean {
  if (!left || !right || !isAddress(left) || !isAddress(right)) {
    return false;
  }

  return left.toLowerCase() === right.toLowerCase();
}

export function normalizeHexData(value: string | undefined): Hex {
  if (!value) {
    return "0x";
  }

  const normalized = value.toLowerCase();
  if (!HEX_PATTERN.test(normalized)) {
    throw new Error(`Invalid hex data: ${value}`);
  }

  return normalized as Hex;
}

export function strip0x(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

export function decodeAddressWord(word: string): Address {
  if (word.length !== 64) {
    throw new Error(`Invalid ABI address word length: ${word.length}`);
  }

  return normalizeAddress(`0x${word.slice(24)}`);
}

export function parseUint256Word(word: string): bigint {
  if (word.length !== 64 || !/^[a-fA-F0-9]+$/.test(word)) {
    throw new Error("Invalid ABI uint256 word");
  }

  return BigInt(`0x${word}`);
}

export function parseAmount(value: string | undefined): bigint | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }

  return BigInt(value);
}
