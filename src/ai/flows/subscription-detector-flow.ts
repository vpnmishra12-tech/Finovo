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
    name: z.string().describe('The identified name of the subscription.'),
    amount: z.number().describe('The recurring amount.'),
    frequency: z.string().describe('The pattern frequency (e.g., Monthly, Yearly).'),
    confidence: z.number().describe('Confidence level 0-1.'),
    reason: z.string().describe('Why this was flagged as a subscription.'),
  })),
  totalAnnualDrain: z.number().describe('The total estimated cost per year.'),
  summary: z.string().describe('A brief advice on potential savings.'),
});
export type SubscriptionDetectorOutput = z.infer<typeof SubscriptionDetectorOutputSchema>;

export async function detectSubscriptions(input: SubscriptionDetectorInput): Promise<SubscriptionDetectorOutput> {
  const detectorPrompt = ai.definePrompt({
    name: 'subscriptionDetectorPrompt',
    input: { schema: SubscriptionDetectorInputSchema },
    output: { schema: SubscriptionDetectorOutputSchema },
    prompt: `You are a Forensic Financial Auditor specialized in detecting "Subscription Leaks".

Analyze the following list of user expenses:
{{#each expenses}}
- Date: {{{transactionDate}}}, Amount: ₹{{{amount}}}, Desc: {{{description}}}
{{/each}}

Strategy:
1. Recurring Pattern Match: Look for same/similar amounts at regular intervals.
2. Keyword Intelligence: Flag terms like Netflix, Spotify, Gym, etc.
3. Confidence Score: Higher if 2+ occurrences.
4. Estimate Annual Drain: Monthly * 12.

Provide a structured JSON output.`,
  });

  const { output } = await detectorPrompt(input);
  if (!output) {
    throw new Error('AI failed to detect subscriptions.');
  }
  return output;
}
