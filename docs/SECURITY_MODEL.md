# Security Model

ArcWarden assumes all external inputs are untrusted, including MCP requests, tool outputs, x402 metadata, calldata, and future simulation responses.

## MVP Controls

- fail closed on unsupported calldata
- block chain mismatch
- block sender mismatch
- block token mismatch
- block recipient or spender mismatch
- block unknown selectors
- block unlimited approvals by default
- produce deterministic report hashes

## LLM Boundary

LLMs must not receive private keys or signing authority. LLM output can explain a report, suggest safer alternatives, or flag uncertainty, but cannot approve a transaction.
