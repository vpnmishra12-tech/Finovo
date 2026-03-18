
'use server';
/**
 * @fileOverview A Genkit flow to extract expense details from a transcribed voice input.
 *
 * - extractVoiceExpense - A function that processes transcribed voice input to extract expense details.
 * - ExtractVoiceExpenseInput - The input type for the extractVoiceExpense function.
 * - ExtractVoiceExpenseOutput - The return type for the extractVoiceExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractVoiceExpenseInputSchema = z.object({
  transcribedText: z.string().describe('The transcribed voice input from the user describing an expense.'),
});
export type ExtractVoiceExpenseInput = z.infer<typeof ExtractVoiceExpenseInputSchema>;

const expenseCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'EMI', 'Recharge', 'Miscellaneous'] as const;
const ExtractVoiceExpenseOutputSchema = z.object({
  amount: z.number().describe('The numerical amount of the expense.'),
  category: z.enum(expenseCategories).describe('The category of the expense from the predefined list: Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous.'),
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
2. The most relevant category for the expense from this strict list: Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous.
3. A brief, concise description of the expense based on the user's input.

Category Rules:
- 'Recharge': Mobile top-up, DTH, data packs.
- 'Miscellaneous': Cigarettes, Paan, Gutkha, Alcohol, snacks, or unspecified small items.
- 'Bills': Rent, Electricity, Water, Internet bills (not mobile recharge).

User's transcribed voice input: "{{{transcribedText}}}"

Example:
Input: "Recharged my phone for 299"
Output: {
  "amount": 299,
  "category": "Recharge",
  "description": "Mobile Recharge"
}

Input: "Bought a pack of cigarettes for 180"
Output: {
  "amount": 180,
  "category": "Miscellaneous",
  "description": "Cigarettes"
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
