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

The repository has a no-op verifier and API middleware placeholder. No real x402 payment verification is connected yet.
