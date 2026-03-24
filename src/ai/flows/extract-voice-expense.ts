
'use server';
/**
 * @fileOverview A Genkit flow to extract expense details from a transcribed voice input.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractVoiceExpenseInputSchema = z.object({
  transcribedText: z.string().describe('The transcribed voice input from the user describing an expense.'),
});
export type ExtractVoiceExpenseInput = z.infer<typeof ExtractVoiceExpenseInputSchema>;

const expenseCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'EMI', 'Recharge', 'Subscription', 'Miscellaneous'] as const;
const ExtractVoiceExpenseOutputSchema = z.object({
  amount: z.number().describe('The numerical amount of the expense.'),
  category: z.enum(expenseCategories).describe('The category of the expense from the predefined list.'),
  description: z.string().describe('A brief, concise description of the expense.'),
});
export type ExtractVoiceExpenseOutput = z.infer<typeof ExtractVoiceExpenseOutputSchema>;

const extractVoiceExpensePrompt = ai.definePrompt({
  name: 'extractVoiceExpensePrompt',
  input: {schema: ExtractVoiceExpenseInputSchema},
  output: {schema: ExtractVoiceExpenseOutputSchema},
  prompt: `You are an AI assistant for a personal finance expense tracker. Your task is to extract expense details from a user's natural language command, which has been transcribed from voice.

You need to identify the following:
1. The numerical amount of the expense.
2. The most relevant category for the expense from this strict list: Food, Transport, Bills, Shopping, EMI, Recharge, Subscription, Miscellaneous.
3. A brief, concise description of the expense based on the user's input.

Category Rules:
- 'Subscription': Use for Netflix, Spotify, Gym, Youtube, Prime, iCloud, or any recurring monthly/yearly memberships.
- 'Recharge': Mobile top-up, DTH, data packs.
- 'Miscellaneous': Cigarettes, snacks, Paan, Gutkha, Alcohol.

User's transcribed voice input: "{{{transcribedText}}}"

Example:
Input: "Subscribed to Netflix for 499"
Output: {
  "amount": 499,
  "category": "Subscription",
  "description": "Netflix Subscription"
}
`,
});

const extractVoiceExpenseFlow = ai.defineFlow(
  {
    name: 'extractVoiceExpenseFlow',
    inputSchema: ExtractVoiceExpenseInputSchema,
    outputSchema: ExtractVoiceExpenseOutputSchema,
  },
  async (input) => {
    const {output} = await extractVoiceExpensePrompt(input);
    if (!output) {
      throw new Error('Failed to extract expense details.');
    }
    return output;
  }
);

export async function extractVoiceExpense(input: ExtractVoiceExpenseInput): Promise<ExtractVoiceExpenseOutput> {
  return extractVoiceExpenseFlow(input);
}
