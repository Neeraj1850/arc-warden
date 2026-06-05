import { GoPlusClient, normalizeAddress } from "@agent-warden/core";
import type { Address } from "@agent-warden/types";
import { addressSchema } from "../schemas/mcp.schemas.js";

export const checkAddressToolName = "check_address";

export const checkAddressToolDescription =
  "Check a single EVM address against optional external intelligence.";

export const checkAddressToolInputSchema = {
  address: addressSchema
};

export async function executeCheckAddressTool(input: { address: Address }) {
  const address = normalizeAddress(input.address);

  if (process.env.GOPLUS_ENABLED !== "true") {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              address,
              status: "not_configured",
              findings: [],
              message: "Set GOPLUS_ENABLED=true to call GoPlus address intelligence."
            },
            null,
            2
          )
        }
      ]
    };
  }

  const findings = await new GoPlusClient().checkAddress(address);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            address,
            status: "checked",
            findings
          },
          null,
          2
        )
      }
    ]
  };
}
