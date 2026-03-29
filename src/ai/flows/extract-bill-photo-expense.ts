/**
 * @fileOverview A flow for extracting expense details.
 * Removed 'use server' and Genkit imports for static build compatibility.
 */

export type ExtractBillPhotoExpenseInput = {
  billPhotoDataUri: string;
};

export type ExtractBillPhotoExpenseOutput = {
  amount: number;
  merchant: string;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI' | 'Recharge' | 'Subscription' | 'Miscellaneous';
};

export async function extractBillPhotoExpense(
  input: ExtractBillPhotoExpenseInput
): Promise<ExtractBillPhotoExpenseOutput> {
  throw new Error('AI Unavailable');
}
