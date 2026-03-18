
'use server';
/**
 * @fileOverview This file implements a Genkit flow for extracting expense details from a natural language text input.
 *
 * - extractTextExpense - A function that extracts expense details (amount, category, description) from text.
 * - ExtractTextExpenseInput - The input type for the extractTextExpense function.
 * - ExtractTextExpenseOutput - The return type for the extractTextExpense function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpenseCategorySchema = z.enum(['Food', 'Transport', 'Bills', 'Shopping', 'EMI', 'Recharge', 'Miscellaneous']);

const ExtractTextExpenseInputSchema = z.object({
  textInput: z.string().describe('A natural language sentence describing an expense.'),
});
export type ExtractTextExpenseInput = z.infer<typeof ExtractTextExpenseInputSchema>;

const ExtractTextExpenseOutputSchema = z.object({
  amount: z.number().describe('The extracted numerical amount of the expense.'),
  category: ExpenseCategorySchema.describe('The category of the expense, chosen from Food, Transport, Bills, Shopping, EMI, Recharge, or Miscellaneous.'),
  description: z.string().describe('A brief description of the expense.'),
});
export type ExtractTextExpenseOutput = z.infer<typeof ExtractTextExpenseOutputSchema>;

export async function extractTextExpense(input: ExtractTextExpenseInput): Promise<ExtractTextExpenseOutput> {
  return extractTextExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextExpensePrompt',
  input: { schema: ExtractTextExpenseInputSchema },
  output: { schema: ExtractTextExpenseOutputSchema },
  prompt: `You are an AI assistant specialized in extracting expense details from natural language sentences.
Your task is to parse the user's input and extract the expense amount, assign a relevant category, and provide a brief description.

Predefined Categories: Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous

Guidelines for 'Miscellaneous':
- Use this category for items like Cigarettes, Paan, Gutkha, Alcohol, or other small personal items not covered by other categories.

Guidelines for 'Recharge':
- Use this for mobile phone top-ups, DTH recharges, or data plans.

User Input: "{{{textInput}}}"

Please extract the following information and return it in JSON format:
- 'amount': The numerical value of the expense. If no currency is specified, assume Indian Rupees.
- 'category': The most appropriate category from the predefined list (Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous).
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
