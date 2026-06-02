export interface ArcClientConfig {
  rpcUrl: string;
  chainId: number;
}

export class ArcClient {
  constructor(public readonly config: ArcClientConfig) {}

  getNetworkLabel(): string {
    return `arc-testnet:${this.config.chainId}`;
  }
}
