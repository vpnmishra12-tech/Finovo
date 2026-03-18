
'use server';
/**
 * @fileOverview A Genkit flow for extracting expense details from a bill photo.
 *
 * - extractBillPhotoExpense - A function that handles the extraction process from a bill photo.
 * - ExtractBillPhotoExpenseInput - The input type for the extractBillPhotoExpense function.
 * - ExtractBillPhotoExpenseOutput - The return type for the extractBillPhotoExpense function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractBillPhotoExpenseInputSchema = z.object({
  billPhotoDataUri: z
    .string()
    .describe(
      "A photo of a bill or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractBillPhotoExpenseInput = z.infer<typeof ExtractBillPhotoExpenseInputSchema>;

const ExtractBillPhotoExpenseOutputSchema = z.object({
  amount: z.number().describe('The total amount extracted from the bill.'),
  merchant: z.string().describe('The name of the merchant identified on the bill.'),
  category: z
    .enum(['Food', 'Transport', 'Bills', 'Shopping', 'EMI', 'Recharge', 'Miscellaneous'])
    .describe('The suggested expense category from the predefined list: Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous.'),
});
export type ExtractBillPhotoExpenseOutput = z.infer<typeof ExtractBillPhotoExpenseOutputSchema>;

export async function extractBillPhotoExpense(
  input: ExtractBillPhotoExpenseInput
): Promise<ExtractBillPhotoExpenseOutput> {
  return extractBillPhotoExpenseFlow(input);
}

const extractBillPhotoExpensePrompt = ai.definePrompt({
  name: 'extractBillPhotoExpensePrompt',
  input: { schema: ExtractBillPhotoExpenseInputSchema },
  output: { schema: ExtractBillPhotoExpenseOutputSchema },
  prompt: `You are an expert in extracting financial information from receipts and bills.

From the provided bill photo, your task is to:
1. Extract the total amount of the expense.
2. Identify the merchant's name.
3. Categorize the expense into one of the following predefined categories: Food, Transport, Bills, Shopping, EMI, Recharge, Miscellaneous.

Here is the bill photo: {{media url=billPhotoDataUri}}`,
});

const extractBillPhotoExpenseFlow = ai.defineFlow(
  {
    name: 'extractBillPhotoExpenseFlow',
    inputSchema: ExtractBillPhotoExpenseInputSchema,
    outputSchema: ExtractBillPhotoExpenseOutputSchema,
  },
  async (input) => {
    const { output } = await extractBillPhotoExpensePrompt(input);
    if (!output) {
      throw new Error('Failed to extract expense details from the bill photo.');
    }
    return output;
  }
);
