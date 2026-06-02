export interface X402PaymentRequirement {
  resource: string;
  network: string;
  payTo: string;
  maxAmount: string;
  asset: string;
  description: string;
}

export interface X402PaymentProof {
  paymentHeader: string;
  requestHash: string;
  resource: string;
}

export interface X402VerificationResult {
  ok: boolean;
  paymentId?: string;
  reason?: string;
}
