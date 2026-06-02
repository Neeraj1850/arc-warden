export type Address = `0x${string}`;
export type Hex = `0x${string}`;

export interface UnsignedEvmTransaction {
  chainId: number;
  from: Address;
  to: Address;
  value?: string;
  data: Hex;
}

export type DecodedFunctionName =
  | "erc20.transfer"
  | "erc20.approve"
  | "unknown";

export interface DecodedTransaction {
  functionName: DecodedFunctionName;
  selector: Hex;
  tokenAddress?: Address;
  recipient?: Address;
  spender?: Address;
  amount?: string;
  rawAmount?: bigint;
  warnings: string[];
}

export interface TokenBalanceDelta {
  tokenAddress: Address;
  account: Address;
  delta: string;
}
