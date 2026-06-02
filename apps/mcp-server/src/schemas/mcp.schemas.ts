export const analyzeTransactionInputSchema = {
  type: "object",
  required: ["intent", "transaction"],
  additionalProperties: false,
  properties: {
    requestId: { type: "string" },
    intent: {
      type: "object",
      required: ["action", "chainId", "from"],
      additionalProperties: true,
      properties: {
        intentId: { type: "string" },
        action: { enum: ["transfer", "approve", "contract_call"] },
        chainId: { type: "number" },
        from: { type: "string" },
        tokenAddress: { type: "string" },
        recipient: { type: "string" },
        spender: { type: "string" },
        amount: { type: "string" },
        maxAmount: { type: "string" },
        allowUnlimitedApproval: { type: "boolean" },
        description: { type: "string" }
      }
    },
    transaction: {
      type: "object",
      required: ["chainId", "from", "to", "data"],
      additionalProperties: true,
      properties: {
        chainId: { type: "number" },
        from: { type: "string" },
        to: { type: "string" },
        value: { type: "string" },
        data: { type: "string" }
      }
    }
  }
} as const;
