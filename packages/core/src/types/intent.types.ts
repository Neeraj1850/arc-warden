import type { Address } from "./transaction.types.js";

export type IntentAction = "transfer" | "approve" | "contract_call";

export interface TransactionIntent {
  intentId?: string;
  action: IntentAction;
  chainId: number;
  from: Address;
  tokenAddress?: Address;
  recipient?: Address;
  spender?: Address;
  amount?: string;
  maxAmount?: string;
  allowUnlimitedApproval?: boolean;
  description?: string;
}
