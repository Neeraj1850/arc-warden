export interface ReportAnchor {
  reportHash: string;
  verdict: "ALLOW" | "WARN" | "BLOCK";
  riskScore: number;
  uri?: string;
}

export interface ReportRegistryClient {
  anchorReport(anchor: ReportAnchor): Promise<string>;
}

export class LocalReportRegistryClient implements ReportRegistryClient {
  async anchorReport(anchor: ReportAnchor): Promise<string> {
    return `local-anchor:${anchor.reportHash}`;
  }
}
