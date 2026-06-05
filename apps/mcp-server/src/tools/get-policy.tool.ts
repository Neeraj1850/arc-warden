import { DEFAULT_POLICY_SET } from "@agent-warden/core";

export const getPolicyToolName = "get_policy";

export const getPolicyToolDescription =
  "Return the active deterministic AgentWarden policy flags.";

export const getPolicyToolInputSchema = {};

export async function executeGetPolicyTool() {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(DEFAULT_POLICY_SET, null, 2)
      }
    ]
  };
}
