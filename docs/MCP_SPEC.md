# MCP Spec

## Tool: `analyze_transaction`

Accepts the same payload as `POST /analyze`.

## Behavior

- validates structured intent and unsigned transaction data
- delegates to the deterministic core analyzer
- returns a security report
- logs verdict, risk score, and report hash to stderr for local demo tracing

## Current Transport

The MCP server now uses the official TypeScript SDK over stdio:

```bash
pnpm --filter @agent-warden/mcp-server dev
```

You can inspect the registered tool shape with:

```bash
pnpm --filter @agent-warden/mcp-server dev -- --describe
```

## x402 Split

MCP is not itself an HTTP payment transport. The current clean split is:

- MCP server exposes `analyze_transaction` to agents.
- HTTP API exposes `POST /analyze` as the x402-protected resource.
- A future bridge mode can make the MCP tool call the paid HTTP API instead of the local analyzer.

## Future Work

- add server authentication
- add x402 payment requirement discovery
- add request hash binding between MCP payload and payment proof
