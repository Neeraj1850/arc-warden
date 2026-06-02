export interface ApiEnv {
  port: number;
  x402Enabled: boolean;
}

export function getEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 8787),
    x402Enabled: process.env.X402_ENABLED === "true"
  };
}
