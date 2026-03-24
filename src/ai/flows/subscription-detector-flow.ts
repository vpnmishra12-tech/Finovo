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
    reason: z.string().describe('Why this was flagged as a subscription (e.g., Fixed amount pattern or keyword match).'),
  })),
  totalAnnualDrain: z.number().describe('The total estimated cost per year for all detected subscriptions.'),
  summary: z.string().describe('A brief advice on potential savings or what to review.'),
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

Analyze the following list of user expenses provided by the user:
{{#each expenses}}
- Date: {{{transactionDate}}}, Amount: ₹{{{amount}}}, Desc: {{{description}}}
{{/each}}

Your Analysis Strategy:
1. **Recurring Pattern Match**: Look for the exact same amount or very similar amounts (±10%) paid to the same merchant or for the same category at regular intervals (e.g., once every 28-32 days, or once every ~365 days).
2. **Keyword Intelligence**: Even if a payment appears only once in the list, if the description contains terms like "Netflix", "Spotify", "Youtube Premium", "Gym", "Amazon Prime", "Disney", "Zomato Gold", "Swiggy One", "DTH", "Insurance Premium", "iCloud", "Adobe", or "Software Subscription", flag it as a potential monthly subscription.
3. **Calculate Frequency**: Identify if the pattern is Monthly, Quarterly, or Yearly.
4. **Confidence Score**: Set a higher confidence if you see 2+ occurrences of the same payment. Set a lower confidence if it's based on keywords only.
5. **Estimate Annual Drain**: Calculate how much this will cost the user in a full year (e.g., Monthly amount * 12).

Provide a structured JSON output with the findings. If no subscriptions are found, return an empty array for 'subscriptions' and 0 for 'totalAnnualDrain'.`,
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
