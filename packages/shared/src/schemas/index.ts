export const EVM_ADDRESS_JSON_SCHEMA = {
  type: "string",
  pattern: "^0x[a-fA-F0-9]{40}$"
} as const;

export const HEX_DATA_JSON_SCHEMA = {
  type: "string",
  pattern: "^0x([a-fA-F0-9]{2})*$"
} as const;
