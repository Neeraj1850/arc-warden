import {
  ARC_FORK_DEFAULT_WALLET,
  seedArcUsdcFixture,
  type ArcAddress
} from "../packages/arc/src/index.ts";

const result = await seedArcUsdcFixture({
  rpcUrl: process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545",
  recipient: addressEnv("ARC_FORK_WALLET", ARC_FORK_DEFAULT_WALLET),
  amount: BigInt(process.env.ARC_FORK_SEED_AMOUNT ?? "1000000")
});

console.log("[arc-fork] fixture seeded");
console.log(`[arc-fork] chainId=${result.chainId}`);
console.log(`[arc-fork] token=${result.tokenAddress}`);
console.log(`[arc-fork] wallet=${result.recipient}`);
console.log(`[arc-fork] nativeBalance=${result.nativeBalance}`);
console.log(`[arc-fork] erc20Balance=${result.recipientBalance}`);
console.log(`[arc-fork] alreadyFunded=${result.alreadyFunded}`);

function addressEnv(name: string, fallback: ArcAddress): ArcAddress {
  return validateAddress(name, process.env[name]?.trim() || fallback);
}

function validateAddress(name: string, value: string): ArcAddress {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be an EVM address.`);
  }
  return value.toLowerCase() as ArcAddress;
}
