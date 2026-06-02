# Architecture

ArcWarden is split into deterministic analysis, transport wrappers, payment verification, and future onchain attestation.

```mermaid
flowchart LR
  Agent["External AI Agent"] --> MCP["MCP Server"]
  Agent --> API["HTTP API"]
  MCP --> Core["Core Analyzer"]
  API --> Core
  API --> X402["x402 Payment Gate"]
  Core --> Policy["Policy Engine"]
  Core --> Decoder["Calldata Decoder"]
  Core --> Sim["Simulation Boundary"]
  Core --> Report["Security Report"]
  Report --> Arc["Arc Report Registry"]
```

The first MVP keeps the analyzer local and deterministic. Network integrations are represented by explicit interfaces so each can be added without changing core policy behavior.
