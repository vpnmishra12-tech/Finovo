/**
 * @fileOverview This file implements a Genkit flow for extracting expense details from a natural language text input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpenseCategorySchema = z.enum(['Food', 'Transport', 'Bills', 'Shopping', 'EMI', 'Recharge', 'Subscription', 'Miscellaneous']);

const ExtractTextExpenseInputSchema = z.object({
  textInput: z.string().describe('A natural language sentence describing an expense.'),
});
export type ExtractTextExpenseInput = z.infer<typeof ExtractTextExpenseInputSchema>;

const ExtractTextExpenseOutputSchema = z.object({
  amount: z.number().describe('The extracted numerical amount of the expense.'),
  category: ExpenseCategorySchema.describe('The category of the expense, chosen from Food, Transport, Bills, Shopping, EMI, Recharge, Subscription, or Miscellaneous.'),
  description: z.string().describe('A brief description of the expense.'),
});
export type ExtractTextExpenseOutput = z.infer<typeof ExtractTextExpenseOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractTextExpensePrompt',
  input: { schema: ExtractTextExpenseInputSchema },
  output: { schema: ExtractTextExpenseOutputSchema },
  prompt: `You are an AI assistant specialized in extracting expense details from natural language sentences.
Your task is to parse the user's input and extract the expense amount, assign a relevant category, and provide a brief description.

Predefined Categories: Food, Transport, Bills, Shopping, EMI, Recharge, Subscription, Miscellaneous

Guidelines:
- 'Subscription': Use for recurring services like Netflix, Spotify, Gym, Youtube Premium, Amazon Prime, or any app/service memberships.
- 'Recharge': Use for mobile phone top-ups, DTH recharges.
- 'Miscellaneous': Use for small personal items like Cigarettes, snacks, or things not covered elsewhere.

User Input: "{{{textInput}}}"

Please extract the following information and return it in JSON format:
- 'amount': The numerical value of the expense. If no currency is specified, assume Indian Rupees.
- 'category': The most appropriate category from the predefined list.
- 'description': A concise description of the expense.`,
});

const extractTextExpenseFlow = ai.defineFlow(
  {
    name: 'extractTextExpenseFlow',
    inputSchema: ExtractTextExpenseInputSchema,
    outputSchema: ExtractTextExpenseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function extractTextExpense(input: ExtractTextExpenseInput): Promise<ExtractTextExpenseOutput> {
  return extractTextExpenseFlow(input);
}
