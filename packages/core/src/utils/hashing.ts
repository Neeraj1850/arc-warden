import { createHash } from "node:crypto";

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function hashObject(value: unknown): `0x${string}` {
  const digest = createHash("sha256").update(stableStringify(value)).digest("hex");
  return `0x${digest}`;
}

function canonicalize(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = canonicalize(record[key]);
        return accumulator;
      }, {});
  }

  return value;
}
