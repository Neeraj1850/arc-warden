export interface AgentIdentityRegistration {
  agentId: string;
  owner: string;
  metadataUri: string;
}

export interface AgentIdentityClient {
  registerAgent(identity: AgentIdentityRegistration): Promise<string>;
}
