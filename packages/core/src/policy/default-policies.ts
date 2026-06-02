export const DEFAULT_POLICY_SET = {
  failClosedUnknownSelectors: true,
  blockUnlimitedApprovals: true,
  requireChainMatch: true,
  requireSenderMatch: true,
  requireIntentRecipientOrSpenderMatch: true
} as const;
