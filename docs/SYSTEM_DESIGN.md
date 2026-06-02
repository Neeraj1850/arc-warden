# System Design

## Goal

Provide a security checkpoint that spend-capable AI agents call before signing or broadcasting blockchain transactions.

## Inputs

- structured intent
- unsigned EVM transaction
- optional request ID
- future x402 payment proof

## Outputs

- verdict: `ALLOW`, `WARN`, or `BLOCK`
- deterministic risk score
- decoded transaction
- policy violations
- static simulation summary
- safer alternative
- report hash

## Authority Model

The deterministic policy engine decides the final verdict. LLMs may be added as explainers or reviewers, but their output cannot override deterministic policy.
