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
    category: z.string().optional(),
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

const detectorPrompt = ai.definePrompt({
  name: 'subscriptionDetectorPrompt',
  input: { schema: SubscriptionDetectorInputSchema },
  output: { schema: SubscriptionDetectorOutputSchema },
  config: {
    temperature: 0.1,
  },
  prompt: `Analyze the provided expense list for RECURRING SUBSCRIPTIONS.

STRICT RULE:
1. ONLY consider an expense as a subscription if its "category" field is exactly "Subscription".
2. If the category is NOT "Subscription", you MUST IGNORE it, even if the description looks like a subscription.
3. Sum the annual cost (amount * 12 for monthly) of ONLY the valid subscriptions found.

Expenses:
{{#each expenses}}
- Date: {{{transactionDate}}}, Amount: ₹{{{amount}}}, Category: {{{category}}}, Desc: {{{description}}}
{{/each}}

If no valid subscriptions are found with category "Subscription", return an empty array for subscriptions and 0 for drain.`,
});

export async function detectSubscriptions(input: SubscriptionDetectorInput): Promise<SubscriptionDetectorOutput> {
  const { output } = await detectorPrompt(input);
  if (!output) {
    throw new Error('AI failed to detect subscriptions.');
  }
  return output;
}
