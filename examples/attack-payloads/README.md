# Attack Payloads

This package runs a grant-demo suite of unsigned EVM transaction payloads through AgentWarden.

It demonstrates common agent signing risks:

- safe ERC-20 transfer
- unlimited ERC-20 approval
- ERC-721 collection-wide operator approval
- ERC-1155 collection-wide operator approval
- suspicious multicall with hidden approval
- EIP-7702 authorization-list transaction
- native value hidden in a contract call
- unknown selector
- contract deployment
- known swap selector

## Local Analyzer Mode

Runs directly against `@agent-warden/core` without starting the API.

```bash
pnpm --filter @agent-warden/attack-payloads local
```

## API Mode

Start the API with x402 disabled:

```bash
$env:X402_ENABLED="false"
pnpm --filter @agent-warden/api dev
```

Run the payload suite:

```bash
pnpm --filter @agent-warden/attack-payloads api
```

Override the API URL:

```bash
$env:AGENTWARDEN_API_URL="http://localhost:8787/analyze"
pnpm --filter @agent-warden/attack-payloads api
```
