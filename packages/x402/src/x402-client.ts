import type { X402PaymentRequirement } from "./x402-types.js";

export interface X402Client {
  getPaymentRequirement(resource: string): Promise<X402PaymentRequirement>;
}

export class StaticX402Client implements X402Client {
  constructor(private readonly requirement: X402PaymentRequirement) {}

  async getPaymentRequirement(_resource: string): Promise<X402PaymentRequirement> {
    return this.requirement;
  }
}
