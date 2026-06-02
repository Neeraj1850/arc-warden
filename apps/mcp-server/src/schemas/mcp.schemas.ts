import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Expected an EVM address");
const hexSchema = z
  .string()
  .regex(/^0x([a-fA-F0-9]{2})*$/, "Expected 0x-prefixed hex data");
const decimalSchema = z.string().regex(/^\d+$/, "Expected a decimal integer");

export const analyzeTransactionInputSchema = {
  requestId: z.string().optional(),
  intent: z.object({
    intentId: z.string().optional(),
    action: z.enum(["transfer", "approve", "contract_call"]),
    chainId: z.number().int().positive(),
    from: addressSchema,
    tokenAddress: addressSchema.optional(),
    recipient: addressSchema.optional(),
    spender: addressSchema.optional(),
    amount: decimalSchema.optional(),
    maxAmount: decimalSchema.optional(),
    allowUnlimitedApproval: z.boolean().optional(),
    description: z.string().optional()
  }),
  transaction: z.object({
    chainId: z.number().int().positive(),
    from: addressSchema,
    to: addressSchema,
    value: decimalSchema.optional(),
    data: hexSchema
  })
};
