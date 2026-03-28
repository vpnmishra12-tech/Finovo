'use server';
/**
 * @fileOverview A Genkit flow for auditing bills and receipts to catch errors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BillAuditInputSchema = z.object({
  billPhotoDataUri: z
    .string()
    .describe(
      "A photo of a bill or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BillAuditInput = z.infer<typeof BillAuditInputSchema>;

const BillAuditOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether or not the bill calculations are correct.'),
  detectedErrors: z.array(z.string()).describe('A list of specific errors or hidden charges found.'),
  summary: z.string().describe('A brief explanation of the audit findings.'),
  detectedTotal: z.number().describe('The total amount calculated by the AI from individual items.'),
  suggestedAction: z.string().describe('What the user should say or do if errors are found.'),
});
export type BillAuditOutput = z.infer<typeof BillAuditOutputSchema>;

export async function auditBill(input: BillAuditInput): Promise<BillAuditOutput> {
  const auditPrompt = ai.definePrompt({
    name: 'billAuditPrompt',
    input: { schema: BillAuditInputSchema },
    output: { schema: BillAuditOutputSchema },
    prompt: `You are an expert Forensic Accountant and Tax Auditor. Your task is to audit the provided bill/receipt image with extreme precision.

Key Auditing Rules:
1. **Mathematical Consistency**: Calculate the sum of all individual items manually. Compare this sum to the Sub-Total and Grand Total shown on the bill. Flag any difference, even of 1 Rupee.
2. **Dynamic Tax Verification**: 
   - Tax rates vary by product category.
   - First, check if the tax amount shown matches the percentage stated on the bill.
   - Second, use your current knowledge of standard tax slabs for the merchant type.
3. **Hidden / Illegal Charges**: Detect "Service Charges" and flag optional ones.
4. **Merchant Integrity**: Check for GSTIN if applicable.

If you find ANY discrepancy, set isCorrect to false. Provide a firm sentence for the user in suggestedAction.

Here is the bill photo: {{media url=billPhotoDataUri}}`,
  });

  const { output } = await auditPrompt(input);
  if (!output) {
    throw new Error('AI failed to audit the bill.');
  }
  return output;
}
