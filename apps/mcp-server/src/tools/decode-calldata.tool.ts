import { decodeCalldata } from "@agent-warden/core";
import type { TransactionIntent, UnsignedEvmTransaction } from "@agent-warden/types";
import { intentSchema, transactionSchema } from "../schemas/mcp.schemas.js";

export const decodeCalldataToolName = "decode_calldata";

export const decodeCalldataToolDescription =
  "Decode unsigned EVM transaction calldata without applying policy or scoring.";

export const decodeCalldataToolInputSchema = {
  transaction: transactionSchema,
  intent: intentSchema.optional()
};

export async function executeDecodeCalldataTool(input: {
  transaction: UnsignedEvmTransaction;
  intent?: TransactionIntent;
}) {
  const decoded = decodeCalldata(input.transaction, input.intent);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(decoded, bigintJsonReplacer, 2)
      }
    ]
  };
}

function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
