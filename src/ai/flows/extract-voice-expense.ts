/**
 * @fileOverview A flow for extracting voice expenses.
 * Removed 'use server' and Genkit imports for static build compatibility.
 */

export type ExtractVoiceExpenseInput = {
  transcribedText: string;
};

export type ExtractVoiceExpenseOutput = {
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI' | 'Recharge' | 'Subscription' | 'Miscellaneous';
  description: string;
};

export async function extractVoiceExpense(input: ExtractVoiceExpenseInput): Promise<ExtractVoiceExpenseOutput> {
  throw new Error('AI Unavailable');
}
