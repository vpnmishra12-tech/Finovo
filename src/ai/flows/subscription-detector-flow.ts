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
    config: {
      temperature: 0, // Forensic precision ke liye 0 temperature, no creativity
    },
    prompt: `Analyze the provided expense list for RECURRING SUBSCRIPTIONS ONLY (e.g., Netflix, Spotify, Gym, iCloud, Mobile Postpaid, or any amount paid every month/year).

RULES:
1. If no recurring patterns or subscription-related keywords are found, return an EMPTY array for subscriptions.
2. Do NOT invent or hallucinate subscriptions. 
3. One-time purchases should NOT be included.
4. Total Annual Drain is the sum of (amount * 12) for monthly subs.

Expenses:
{{#each expenses}}
- Date: {{{transactionDate}}}, Amount: ₹{{{amount}}}, Desc: {{{description}}}
{{/each}}

Strictly return results based ONLY on the data above.`,
  });

  const { output } = await detectorPrompt(input);
  if (!output) {
    throw new Error('AI failed to detect subscriptions.');
  }
  return output;
}
