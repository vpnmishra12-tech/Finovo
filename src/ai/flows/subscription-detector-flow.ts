/**
 * @fileOverview A flow for detecting subscriptions.
 * Removed 'use server' and Genkit imports for static build compatibility.
 */

export type SubscriptionDetectorInput = {
  expenses: Array<{
    description: string;
    amount: number;
    transactionDate: string;
    category?: string;
  }>;
};

export type SubscriptionDetectorOutput = {
  subscriptions: Array<{
    name: string;
    amount: number;
    frequency: string;
    confidence: number;
    reason: string;
  }>;
  totalAnnualDrain: number;
  summary: string;
};

export async function detectSubscriptions(input: SubscriptionDetectorInput): Promise<SubscriptionDetectorOutput> {
  return { subscriptions: [], totalAnnualDrain: 0, summary: "Offline mode" };
}
