export interface ReputationSignal {
  subject: string;
  score: number;
  reason: string;
}

export interface ReputationProvider {
  getSignals(subject: string): Promise<ReputationSignal[]>;
}
