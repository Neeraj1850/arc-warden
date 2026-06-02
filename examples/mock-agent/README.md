# Mock Agent

This example simulates an external AI agent with a wallet address asking ArcWarden to review an unsigned Ethereum Sepolia transaction before signing or broadcasting it.

It uses:

- transaction network: Ethereum Sepolia, chain ID `11155111`
- payment mode: mock x402 header
- endpoint: `POST /analyze`

The mock payment is intentionally local-only. Real x402 testnet payment should use Base Sepolia `eip155:84532` with the public testnet facilitator.

## Run

Start the API in mock payment mode:

```bash
X402_ENABLED=true X402_MODE=mock pnpm --filter @arc-warden/api dev
```

In another terminal, run the safe transfer:

```bash
pnpm --filter @arc-warden/mock-agent safe
```

Run the malicious approval:

```bash
pnpm --filter @arc-warden/mock-agent malicious
```

## Environment

```bash
ARCWARDEN_API_URL=http://localhost:8787/analyze
MOCK_AGENT_WALLET=0x1111111111111111111111111111111111111111
SEPOLIA_TOKEN_ADDRESS=0x2222222222222222222222222222222222222222
SEPOLIA_RECIPIENT=0x3333333333333333333333333333333333333333
SEPOLIA_SPENDER=0x5555555555555555555555555555555555555555
```

## Expected Output

Safe transfer should return `ALLOW`.

Malicious unlimited approval should return `BLOCK`.
