import type { AnalysisRequest, Verdict } from "@agent-warden/core";

type Address = `0x${string}`;

export interface DemoPayload {
  id: string;
  title: string;
  source: "AgentKit" | "GOAT" | "Eliza" | "Generic";
  expectedVerdict: Verdict;
  request: AnalysisRequest;
}

const CHAIN_ID = 11155111;
const FROM = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const RECIPIENT = "0x3333333333333333333333333333333333333333" as Address;
const OTHER = "0x4444444444444444444444444444444444444444" as Address;
const SPENDER = "0x5555555555555555555555555555555555555555" as Address;
const ROUTER = "0x6666666666666666666666666666666666666666" as Address;
const MAX_UINT256 = (1n << 256n) - 1n;

export const demoPayloads: DemoPayload[] = [
  {
    id: "agentkit-safe-erc20-transfer",
    title: "AgentKit-style safe ERC-20 transfer",
    source: "AgentKit",
    expectedVerdict: "ALLOW",
    request: {
      requestId: "agentkit-safe-erc20-transfer",
      intent: {
        action: "token_transfer",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        amount: "1000000",
        description: "AgentKit benchmark: transfer test USDC."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeErc20Transfer(RECIPIENT, 1_000_000n)
      }
    }
  },
  {
    id: "goat-unlimited-erc20-approval",
    title: "GOAT-style DeFi approval with unlimited allowance",
    source: "GOAT",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "goat-unlimited-erc20-approval",
      intent: {
        action: "approval",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        spender: SPENDER,
        maxAmount: MAX_UINT256.toString(),
        description: "GOAT benchmark: approve router before DeFi action."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeErc20Approve(SPENDER, MAX_UINT256)
      }
    }
  },
  {
    id: "eliza-erc721-set-approval-for-all",
    title: "Eliza-style NFT collection-wide approval",
    source: "Eliza",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "eliza-erc721-set-approval-for-all",
      intent: {
        action: "nft_transfer",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        spender: SPENDER,
        description: "Eliza benchmark: NFT action attempts operator approval."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeSetApprovalForAll(SPENDER, true)
      }
    }
  },
  {
    id: "erc1155-set-approval-for-all",
    title: "ERC-1155 collection-wide operator approval",
    source: "Generic",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "erc1155-set-approval-for-all",
      intent: {
        action: "approval",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        spender: SPENDER,
        description: "Generic benchmark: ERC-1155 operator approval."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: encodeSetApprovalForAll(SPENDER, true)
      }
    }
  },
  {
    id: "multicall-hidden-approval",
    title: "Multicall containing hidden approval selector",
    source: "GOAT",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "multicall-hidden-approval",
      intent: {
        action: "multicall",
        chainId: CHAIN_ID,
        from: FROM,
        description: "GOAT benchmark: plugin-style multicall bundle."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: ROUTER,
        value: "0",
        data: `0xac9650d8${"0".repeat(64)}095ea7b3${"0".repeat(120)}` as `0x${string}`
      }
    }
  },
  {
    id: "eip7702-authorization-list",
    title: "EIP-7702 authorization-list transaction",
    source: "Generic",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "eip7702-authorization-list",
      intent: {
        action: "token_transfer",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        amount: "1",
        description: "Generic benchmark: delegated EOA authorization attempt."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        type: 4,
        authorizationList: [{ address: OTHER }],
        value: "0",
        data: encodeErc20Transfer(RECIPIENT, 1n)
      }
    }
  },
  {
    id: "native-value-hidden-in-contract-call",
    title: "Native value attached to token transfer calldata",
    source: "AgentKit",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "native-value-hidden-in-contract-call",
      intent: {
        action: "token_transfer",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        amount: "1",
        description: "AgentKit benchmark: token transfer should not include native value."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "1",
        data: encodeErc20Transfer(RECIPIENT, 1n)
      }
    }
  },
  {
    id: "unknown-selector",
    title: "Unknown contract selector",
    source: "Generic",
    expectedVerdict: "BLOCK",
    request: {
      requestId: "unknown-selector",
      intent: {
        action: "contract_call",
        chainId: CHAIN_ID,
        from: FROM,
        tokenAddress: TOKEN,
        description: "Generic benchmark: opaque calldata."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: TOKEN,
        value: "0",
        data: "0xdeadbeef"
      }
    }
  },
  {
    id: "contract-deployment",
    title: "Contract deployment transaction",
    source: "Generic",
    expectedVerdict: "ALLOW",
    request: {
      requestId: "contract-deployment",
      intent: {
        action: "deployment",
        chainId: CHAIN_ID,
        from: FROM,
        description: "Generic benchmark: deployment with explicit deployment intent."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        value: "0",
        data: "0x60006000"
      }
    }
  },
  {
    id: "known-swap-selector",
    title: "Known router swap selector",
    source: "Eliza",
    expectedVerdict: "ALLOW",
    request: {
      requestId: "known-swap-selector",
      intent: {
        action: "swap",
        chainId: CHAIN_ID,
        from: FROM,
        description: "Eliza benchmark: swap action through known router selector."
      },
      transaction: {
        chainId: CHAIN_ID,
        from: FROM,
        to: ROUTER,
        value: "0",
        data: "0x38ed1739"
      }
    }
  }
];

function encodeErc20Transfer(recipient: Address, amount: bigint): `0x${string}` {
  return `0xa9059cbb${encodeAddress(recipient)}${encodeUint256(amount)}`;
}

function encodeErc20Approve(spender: Address, amount: bigint): `0x${string}` {
  return `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}`;
}

function encodeSetApprovalForAll(operator: Address, approved: boolean): `0x${string}` {
  return `0xa22cb465${encodeAddress(operator)}${encodeUint256(approved ? 1n : 0n)}`;
}

function encodeAddress(address: Address): string {
  return address.slice(2).padStart(64, "0");
}

function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}
