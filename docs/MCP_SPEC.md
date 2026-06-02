# MCP Spec

## Tool: `analyze_transaction`

Accepts the same payload as `POST /analyze`.

## Behavior

- validates structured intent and unsigned transaction data
- delegates to the deterministic core analyzer
- returns a security report

## Future Work

- add official MCP SDK transport
- add server authentication
- add x402 payment requirement discovery
- add request hash binding between MCP payload and payment proof
