import type { Address } from "./transaction.types.js";
import type { PolicyViolation, Verdict } from "./policy.types.js";

export type SignatureKind =
  | "eip712_typed_data"
  | "personal_sign"
  | "eth_sign"
  | "unknown";

export type SignatureActionType =
  | "permit_signature"
  | "permit2_signature"
  | "transfer_authorization_signature"
  | "safe_transaction_signature"
  | "login_signature"
  | "authorization_signature"
  | "unknown_signature";

export interface SignatureIntent {
  action: "login" | "permit" | "authorization" | "unknown";
  chainId: number;
  from: Address;
  verifyingContract?: Address;
  spender?: Address;
  maxAmount?: string;
  description?: string;
}

export interface Eip712TypedData {
  domain?: {
    name?: string;
    version?: string;
    chainId?: number | string;
    verifyingContract?: Address;
  };
  primaryType: string;
  message: Record<string, unknown>;
}

export interface SignaturePayload {
  kind: SignatureKind;
  typedData?: Eip712TypedData;
  message?: string;
}

export interface SignatureAnalysisRequest {
  intent: SignatureIntent;
  payload: SignaturePayload;
  requestId?: string;
}

export interface DecodedSignature {
  kind: SignatureKind;
  actionType: SignatureActionType;
  primaryType?: string;
  domainName?: string;
  chainId?: number;
  verifyingContract?: Address;
  owner?: Address;
  spender?: Address;
  value?: string;
  to?: Address;
  deadline?: string;
  warnings: string[];
}

export interface SignatureSecurityReport {
  requestId?: string;
  verdict: Verdict;
  riskScore: number;
  actionType: SignatureActionType;
  decodedSignature: DecodedSignature;
  policyViolations: PolicyViolation[];
  saferAlternative?: string;
  reportHash: string;
}
