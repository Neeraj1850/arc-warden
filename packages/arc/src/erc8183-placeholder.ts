export interface SecurityReviewJob {
  jobId: string;
  requester: string;
  reportHash: string;
  paymentToken: string;
  paymentAmount: string;
}

export interface AgenticCommerceJobClient {
  settleSecurityReview(job: SecurityReviewJob): Promise<string>;
}
