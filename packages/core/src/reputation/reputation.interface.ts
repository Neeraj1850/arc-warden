export interface ReputationSignal {
  subject: string;
  score: number;
  reason: string;
  category?: "known_router" | "known_token" | "risky_address" | "unknown";
}

export interface ReputationProvider {
  getSignals(subject: string): Promise<ReputationSignal[]>;
}
