# AgentWarden Attack Payload Report

Generated: deterministic-local-run
Mode: local
Total: 10
Failures: 0

| Payload | Source | Expected | Actual | Risk | Action | Result |
| --- | --- | --- | --- | ---: | --- | --- |
| agentkit-safe-erc20-transfer | AgentKit | ALLOW | ALLOW | 5 | erc20_transfer | PASS |
| goat-unlimited-erc20-approval | GOAT | BLOCK | BLOCK | 95 | erc20_approval | PASS |
| eliza-erc721-set-approval-for-all | Eliza | BLOCK | BLOCK | 95 | erc721_operator_approval | PASS |
| erc1155-set-approval-for-all | Generic | BLOCK | BLOCK | 95 | erc1155_operator_approval | PASS |
| multicall-hidden-approval | GOAT | BLOCK | BLOCK | 100 | multicall | PASS |
| eip7702-authorization-list | Generic | BLOCK | BLOCK | 85 | erc20_transfer | PASS |
| native-value-hidden-in-contract-call | AgentKit | BLOCK | BLOCK | 50 | erc20_transfer | PASS |
| unknown-selector | Generic | BLOCK | BLOCK | 80 | unknown_contract_call | PASS |
| contract-deployment | Generic | ALLOW | ALLOW | 35 | deployment | PASS |
| known-swap-selector | Eliza | ALLOW | ALLOW | 25 | swap | PASS |

## AgentKit-style safe ERC-20 transfer

Payload: `agentkit-safe-erc20-transfer`
Source: AgentKit
Verdict: ALLOW
Risk score: 5
Action: erc20_transfer
Report hash: `0x92c363442c3db76db70a331a51295dbc0368cdf636945524f7f314182dff782b`

Summary: ALLOW: erc20 transfer classified as low risk.

AgentWarden decoded the transaction as erc20 transfer and found no deterministic policy violations before signing. Static analysis only. Set ANALYSIS_RPC_URL to run eth_call simulation.

Findings:
- None

Recommended action: Proceed only if the signer recognizes the recipient, asset, amount, and target contract.

## GOAT-style DeFi approval with unlimited allowance

Payload: `goat-unlimited-erc20-approval`
Source: GOAT
Verdict: BLOCK
Risk score: 95
Action: erc20_approval
Report hash: `0xfec8f13da14085e52688595249cad590118e5eba20913666caa70bcc3854132e`

Summary: BLOCK: erc20 approval classified as critical risk.

AgentWarden decoded the transaction as erc20 approval and found 2 issues before signing. Primary finding: Transaction grants an unlimited ERC-20 allowance.

Findings:
- CRITICAL UNLIMITED_APPROVAL: Transaction grants an unlimited ERC-20 allowance. Evidence: expected=bounded approval amount, actual=115792089237316195423570985008687907853269984665640564039457584007913129639935.
- CRITICAL APPROVAL_ERC20_UNLIMITED: Unlimited ERC-20 allowance. Evidence: standard=erc20, token=0x2222222222222222222222222222222222222222, spender=0x5555555555555555555555555555555555555555, amount=115792089237316195423570985008687907853269984665640564039457584007913129639935.

Recommended action: Use a bounded approval for the exact intended amount or a short-lived spending allowance.

## Eliza-style NFT collection-wide approval

Payload: `eliza-erc721-set-approval-for-all`
Source: Eliza
Verdict: BLOCK
Risk score: 95
Action: erc721_operator_approval
Report hash: `0x5ced29b841f3a4d5501c0538d6c19e034c707a34ed42b91a5e64ec756185ca25`

Summary: BLOCK: erc721 operator approval classified as critical risk.

AgentWarden decoded the transaction as erc721 operator approval and found 2 issues before signing. Primary finding: Transaction grants collection-wide operator permissions.

Findings:
- CRITICAL OPERATOR_APPROVAL_FOR_ALL: Transaction grants collection-wide operator permissions. Evidence: expected=no operator approval or explicit intent allowance, actual=0x5555555555555555555555555555555555555555.
- CRITICAL APPROVAL_ERC721_OPERATOR: ERC-721 collection-wide operator approval. Evidence: standard=erc721, token=0x2222222222222222222222222222222222222222, operator=0x5555555555555555555555555555555555555555.

Recommended action: Avoid collection-wide operator approval. Use token-specific approval or execute through a tightly scoped smart account policy.

## ERC-1155 collection-wide operator approval

Payload: `erc1155-set-approval-for-all`
Source: Generic
Verdict: BLOCK
Risk score: 95
Action: erc1155_operator_approval
Report hash: `0x6cc79c17c16e9d74053d615861f455eaac0fdff300def193739e0a18261e77ee`

Summary: BLOCK: erc1155 operator approval classified as critical risk.

AgentWarden decoded the transaction as erc1155 operator approval and found 2 issues before signing. Primary finding: Transaction grants collection-wide operator permissions.

Findings:
- CRITICAL OPERATOR_APPROVAL_FOR_ALL: Transaction grants collection-wide operator permissions. Evidence: expected=no operator approval or explicit intent allowance, actual=0x5555555555555555555555555555555555555555.
- CRITICAL APPROVAL_ERC1155_OPERATOR: ERC-1155 collection-wide operator approval. Evidence: standard=erc1155, token=0x2222222222222222222222222222222222222222, operator=0x5555555555555555555555555555555555555555.

Recommended action: Avoid collection-wide operator approval. Use token-specific approval or execute through a tightly scoped smart account policy.

## Multicall containing hidden approval selector

Payload: `multicall-hidden-approval`
Source: GOAT
Verdict: BLOCK
Risk score: 100
Action: multicall
Report hash: `0xf9a80489c9ce40214e784ebbb884ebb052f52dbac1566a7d13e7ba12c4b85881`

Summary: BLOCK: multicall classified as critical risk.

AgentWarden decoded the transaction as multicall and found 2 issues before signing. Primary finding: Multicall contains nested approval or swap selectors that require stricter review.

Findings:
- CRITICAL SUSPICIOUS_MULTICALL: Multicall contains nested approval or swap selectors that require stricter review.
- MEDIUM APPROVAL_ERC20: ERC-20 allowance change. Evidence: standard=erc20, token=0x6666666666666666666666666666666666666666.

Recommended action: Split the multicall into individual transactions or simulate and review every nested call before signing.

## EIP-7702 authorization-list transaction

Payload: `eip7702-authorization-list`
Source: Generic
Verdict: BLOCK
Risk score: 85
Action: erc20_transfer
Report hash: `0x2fdb269885eff3c1f5e1ae16837ca5d8f4da4ce67f5b5451f704c9f24d309cfd`

Summary: BLOCK: erc20 transfer classified as high risk.

AgentWarden decoded the transaction as erc20 transfer and found 1 issue before signing. Primary finding: Transaction contains an EIP-7702 authorization list that may delegate EOA execution authority.

Findings:
- CRITICAL EIP7702_AUTHORIZATION_PRESENT: Transaction contains an EIP-7702 authorization list that may delegate EOA execution authority. Evidence: expected=no authorization list unless explicitly allowed, actual=authorizationList.

Recommended action: Do not sign EIP-7702 authorization-list transactions unless the delegate code and policy are independently verified.

## Native value attached to token transfer calldata

Payload: `native-value-hidden-in-contract-call`
Source: AgentKit
Verdict: BLOCK
Risk score: 50
Action: erc20_transfer
Report hash: `0x8e9be4cca377b994cda42550483542ffc5c0a1591d76082d41ab4bb0f18e9e41`

Summary: BLOCK: erc20 transfer classified as medium risk.

AgentWarden decoded the transaction as erc20 transfer and found 1 issue before signing. Primary finding: Transaction includes native value but intent did not explicitly allow it.

Findings:
- HIGH UNEXPECTED_NATIVE_VALUE: Transaction includes native value but intent did not explicitly allow it. Evidence: expected=0, actual=1.

Recommended action: Do not sign this transaction. Regenerate it from trusted intent or remove the risky operation.

## Unknown contract selector

Payload: `unknown-selector`
Source: Generic
Verdict: BLOCK
Risk score: 80
Action: unknown_contract_call
Report hash: `0x166f4656d0f06bf215146f9db326988cad26c78f25e103f3148f27a54ebe4578`

Summary: BLOCK: unknown contract call classified as high risk.

AgentWarden decoded the transaction as unknown contract call and found 1 issue before signing. Primary finding: Calldata selector is unsupported by the MVP decoder.

Findings:
- HIGH UNKNOWN_FUNCTION_SELECTOR: Calldata selector is unsupported by the MVP decoder. Evidence: actual=0xdeadbeef.

Recommended action: Route this transaction to a full ABI-aware decoder and simulator before signing.

## Contract deployment transaction

Payload: `contract-deployment`
Source: Generic
Verdict: ALLOW
Risk score: 35
Action: deployment
Report hash: `0x6c7341947b085fdee756ba536498094ec6b606fb8f3fe8247acf9d5b8731ef58`

Summary: ALLOW: deployment classified as low risk.

AgentWarden decoded the transaction as deployment and found no deterministic policy violations before signing. Static analysis only. Set ANALYSIS_RPC_URL to run eth_call simulation.

Findings:
- None

Recommended action: Proceed only if the signer recognizes the recipient, asset, amount, and target contract.

## Known router swap selector

Payload: `known-swap-selector`
Source: Eliza
Verdict: ALLOW
Risk score: 25
Action: swap
Report hash: `0x03d6eecb4cc34b02918a943b0767c6e1be8cb50f20e4db65c95bc2a553a06f36`

Summary: ALLOW: swap classified as low risk.

AgentWarden decoded the transaction as swap and found no deterministic policy violations before signing. Static analysis only. Set ANALYSIS_RPC_URL to run eth_call simulation.

Findings:
- None

Recommended action: Proceed only if the signer recognizes the recipient, asset, amount, and target contract.

