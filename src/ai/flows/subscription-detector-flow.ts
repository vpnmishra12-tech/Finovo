'use server';
/**
 * @fileOverview A Genkit flow for detecting recurring subscription expenses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SubscriptionDetectorInputSchema = z.object({
  expenses: z.array(z.object({
    description: z.string(),
    amount: z.number(),
    transactionDate: z.string(),
  })).describe('List of past expenses to analyze for recurring patterns.'),
});
export type SubscriptionDetectorInput = z.infer<typeof SubscriptionDetectorInputSchema>;

const SubscriptionDetectorOutputSchema = z.object({
  subscriptions: z.array(z.object({
    name: z.string().describe('The identified name of the subscription (e.g., Netflix).'),
    amount: z.number().describe('The recurring amount.'),
    frequency: z.string().describe('The pattern frequency (e.g., Monthly, Yearly).'),
    confidence: z.number().describe('Confidence level 0-1.'),
    reason: z.string().describe('Why this was flagged as a subscription.'),
  })),
  totalAnnualDrain: z.number().describe('The total estimated cost per year for all detected subscriptions.'),
  summary: z.string().describe('A brief advice on potential savings.'),
});
export type SubscriptionDetectorOutput = z.infer<typeof SubscriptionDetectorOutputSchema>;

export async function detectSubscriptions(input: SubscriptionDetectorInput): Promise<SubscriptionDetectorOutput> {
  return subscriptionDetectorFlow(input);
}

const detectorPrompt = ai.definePrompt({
  name: 'subscriptionDetectorPrompt',
  input: { schema: SubscriptionDetectorInputSchema },
  output: { schema: SubscriptionDetectorOutputSchema },
  prompt: `You are a Forensic Financial Auditor specialized in detecting "Subscription Leaks" and recurring patterns in spending.

Analyze the following list of user expenses:
{{#each expenses}}
- Date: {{{transactionDate}}}, Amount: ₹{{{amount}}}, Desc: {{{description}}}
{{/each}}

Your Tasks:
1. Identify Recurring Payments: Look for same/similar amounts paid to the same merchant or for the same purpose periodically (e.g., every ~30 days or once a year).
2. Look for Keywords: Flag anything with "Netflix", "Spotify", "Amazon Prime", "Disney", "Rent", "Gym", "Premium", "Subscription", "DTH", "Insurance", "SIP", "EMI", "Renew".
3. Calculate Frequency: Determine if it's Monthly, Quarterly, or Yearly.
4. Estimated Annual Drain: Sum up the annual cost of all identified subscriptions.
5. Provide Advice: If there are redundant subscriptions or high monthly drains, suggest what to review.

Format your response as structured JSON.`,
});

const subscriptionDetectorFlow = ai.defineFlow(
  {
    name: 'subscriptionDetectorFlow',
    inputSchema: SubscriptionDetectorInputSchema,
    outputSchema: SubscriptionDetectorOutputSchema,
  },
  async (input) => {
    const { output } = await detectorPrompt(input);
    if (!output) {
      throw new Error('AI failed to detect subscriptions.');
    }
    return output;
  }
);
