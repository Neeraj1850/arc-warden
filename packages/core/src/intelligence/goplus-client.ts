import type { Address } from "../types/transaction.types.js";

const GOPLUS_BASE_URL = "https://api.gopluslabs.io/api/v1";

export interface GoPlusClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export interface GoPlusFinding {
  source: "goplus";
  category: "token" | "address";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  raw: unknown;
}

export class GoPlusClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options: GoPlusClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.GOPLUS_BASE_URL ?? GOPLUS_BASE_URL;
    this.apiKey = options.apiKey ?? process.env.GOPLUS_API_KEY;
  }

  async checkToken(chainId: number, tokenAddress: Address): Promise<GoPlusFinding[]> {
    const result = await this.getJson(
      `/token_security/${chainId}?contract_addresses=${tokenAddress}`
    );

    return [
      {
        source: "goplus",
        category: "token",
        severity: "medium",
        message: `GoPlus token security response received for ${tokenAddress}.`,
        raw: result
      }
    ];
  }

  async checkAddress(address: Address): Promise<GoPlusFinding[]> {
    const result = await this.getJson(`/address_security/${address}`);

    return [
      {
        source: "goplus",
        category: "address",
        severity: "medium",
        message: `GoPlus address security response received for ${address}.`,
        raw: result
      }
    ];
  }

  private async getJson(path: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`GoPlus request failed: ${response.status}`);
    }

    return response.json();
  }
}
