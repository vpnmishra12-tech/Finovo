/**
 * @fileOverview A flow for extracting text expenses.
 * Removed 'use server' and Genkit imports for static build compatibility.
 */

export type ExtractTextExpenseInput = {
  textInput: string;
};

export type ExtractTextExpenseOutput = {
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI' | 'Recharge' | 'Subscription' | 'Miscellaneous';
  description: string;
};

export async function extractTextExpense(input: ExtractTextExpenseInput): Promise<ExtractTextExpenseOutput> {
  throw new Error('AI Unavailable');
}
