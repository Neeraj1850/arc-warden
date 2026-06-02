import type {
  DecodedTransaction,
  TokenBalanceDelta,
  UnsignedEvmTransaction
} from "../types/transaction.types.js";

export function inferStaticBalanceDeltas(
  transaction: UnsignedEvmTransaction,
  decoded: DecodedTransaction
): TokenBalanceDelta[] {
  if (
    decoded.functionName !== "erc20.transfer" ||
    !decoded.tokenAddress ||
    !decoded.recipient ||
    !decoded.amount
  ) {
    return [];
  }

  return [
    {
      tokenAddress: decoded.tokenAddress,
      account: transaction.from,
      delta: `-${decoded.amount}`
    },
    {
      tokenAddress: decoded.tokenAddress,
      account: decoded.recipient,
      delta: decoded.amount
    }
  ];
}
