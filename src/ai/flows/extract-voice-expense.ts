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

const expenseCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'EMI'] as const;
const ExtractVoiceExpenseOutputSchema = z.object({
  amount: z.number().describe('The numerical amount of the expense.'),
  category: z.enum(expenseCategories).describe('The category of the expense from the predefined list: Food, Transport, Bills, Shopping, EMI.'),
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
2. The most relevant category for the expense from this strict list: Food, Transport, Bills, Shopping, EMI.
3. A brief, concise description of the expense based on the user's input.

If an amount is not explicitly mentioned, infer a reasonable amount based on the context if possible, otherwise use 0.
If a category is not explicitly mentioned, assign the most appropriate one from the list. If none are suitable, default to 'Shopping'.

User's transcribed voice input: "{{{transcribedText}}}"

Example:
Input: "Paid 350 for a bus ticket"
Output: {
  "amount": 350,
  "category": "Transport",
  "description": "Bus ticket"
}

Input: "I bought groceries for 500 rupees yesterday"
Output: {
  "amount": 500,
  "category": "Food",
  "description": "Groceries"
}

Input: "Electric bill payment of 1200"
Output: {
  "amount": 1200,
  "category": "Bills",
  "description": "Electric bill"
}

Input: "New shoes, 2500"
Output: {
  "amount": 2500,
  "category": "Shopping",
  "description": "New shoes"
}

Input: "Monthly loan installment"
Output: {
  "amount": 0,
  "category": "EMI",
  "description": "Monthly loan installment"
}

Input: "Coffee, 150"
Output: {
  "amount": 150,
  "category": "Food",
  "description": "Coffee"
}

Input: "I went out for dinner"
Output: {
  "amount": 0,
  "category": "Food",
  "description": "Dinner"
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
