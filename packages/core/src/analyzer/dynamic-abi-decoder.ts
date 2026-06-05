import { whatsabi } from "@shazow/whatsabi";
import { createPublicClient, decodeFunctionData, http, type Abi } from "viem";
import type { Address, Hex, UnsignedEvmTransaction } from "../types/transaction.types.js";

export interface DynamicAbiDecodeResult {
  status: "not_run" | "decoded" | "failed";
  contractAddress?: Address;
  functionName?: string;
  abiSource?: string;
  hasCode?: boolean;
  error?: string;
}

export async function decodeWithDynamicAbi(
  transaction: UnsignedEvmTransaction,
  rpcUrl?: string
): Promise<DynamicAbiDecodeResult> {
  if (!rpcUrl || !transaction.to || transaction.data === "0x") {
    return { status: "not_run" };
  }

  try {
    const client = createPublicClient({
      transport: http(rpcUrl)
    });
    const loaded = await whatsabi.autoload(transaction.to, {
      provider: client,
      followProxies: true
    });

    if (!loaded.hasCode || loaded.abi.length === 0) {
      return {
        status: "failed",
        contractAddress: transaction.to,
        hasCode: loaded.hasCode,
        error: "No ABI recovered from deployed bytecode."
      };
    }

    const decoded = decodeFunctionData({
      abi: loaded.abi as Abi,
      data: transaction.data as Hex
    });

    return {
      status: "decoded",
      contractAddress: transaction.to,
      functionName: decoded.functionName,
      abiSource: loaded.abiLoadedFrom?.constructor.name,
      hasCode: loaded.hasCode
    };
  } catch (error) {
    return {
      status: "failed",
      contractAddress: transaction.to,
      error: error instanceof Error ? error.message : "Unknown dynamic ABI error"
    };
  }
}
