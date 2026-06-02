# x402 Flow

## Planned Flow

1. Caller requests the `analyze_transaction` MCP resource or `POST /analyze`.
2. ArcWarden returns or enforces an x402 payment requirement.
3. Caller pays on the configured testnet with a max payment cap.
4. ArcWarden verifies the payment proof with a facilitator.
5. Payment proof is bound to the canonical analysis request hash.
6. ArcWarden rejects replayed, expired, or mismatched proofs.
7. ArcWarden returns the security report with `Cache-Control: no-store`.

## MVP Status

The API has two x402 modes:

- `X402_ENABLED=false`: payments disabled for local analyzer testing.
- `X402_ENABLED=true` and `X402_MODE=mock`: `POST /analyze` requires `x-arcwarden-mock-payment: paid`, logs the payment gate, and does not touch testnet funds.
- `X402_ENABLED=true` and `X402_MODE=real`: `POST /analyze` uses the official x402 Express middleware, EVM exact-payment scheme, and configured facilitator.

## Real Testnet Config

```bash
X402_ENABLED=true
X402_MODE=real
X402_PAY_TO=0xYourReceivingWallet
X402_PRICE=$0.001
X402_NETWORK=eip155:84532
X402_FACILITATOR_URL=https://x402.org/facilitator
```

The mock-agent flow uses an Ethereum Sepolia transaction under review and `X402_MODE=mock` so logs prove the flow before paying Base Sepolia USDC.

```bash
X402_ENABLED=true X402_MODE=mock pnpm --filter @arc-warden/api dev
pnpm --filter @arc-warden/mock-agent safe
pnpm --filter @arc-warden/mock-agent malicious
```
