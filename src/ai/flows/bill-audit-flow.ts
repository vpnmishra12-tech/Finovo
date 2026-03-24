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
  return billAuditFlow(input);
}

const auditPrompt = ai.definePrompt({
  name: 'billAuditPrompt',
  input: { schema: BillAuditInputSchema },
  output: { schema: BillAuditOutputSchema },
  prompt: `You are an expert Forensic Accountant and Tax Auditor. Your task is to audit the provided bill/receipt image with extreme precision.

Key Auditing Rules:
1. **Mathematical Consistency**: Calculate the sum of all individual items manually. Compare this sum to the Sub-Total and Grand Total shown on the bill. Flag any difference, even of 1 Rupee.
2. **Dynamic Tax Verification**: 
   - Tax rates vary by product category (e.g., 5%, 12%, 18%, 28% in India). 
   - First, check if the tax amount shown matches the percentage stated on the bill (Math Check).
   - Second, use your current, up-to-date knowledge of standard tax slabs for the detected merchant type. If a restaurant is charging 28% GST (which is usually 5% or 18%), flag it as "Suspicious Tax Rate".
   - Ensure tax is calculated on the Sub-Total, not on top of other taxes (Cascading tax check).
3. **Hidden / Illegal Charges**: 
   - Detect "Service Charges". Note that in many regions like India, Service Charge is optional and cannot be forced.
   - Look for "Misc", "Rounding", or "Handling" fees that don't have a clear breakdown.
4. **Duplicate Entries**: Scrutinize the list for similar items added twice or redundant entries.
5. **Merchant Integrity**: Check if a GSTIN (GST Number) is present. If it's a large bill without a GSTIN, flag it as a "Potential Fake Bill".

If you find ANY discrepancy, set isCorrect to false. 

In 'suggestedAction', provide a firm, polite, and legally-grounded sentence the user can use at the billing counter to resolve the issue.

Here is the bill photo: {{media url=billPhotoDataUri}}`,
});

const billAuditFlow = ai.defineFlow(
  {
    name: 'billAuditFlow',
    inputSchema: BillAuditInputSchema,
    outputSchema: BillAuditOutputSchema,
  },
  async (input) => {
    const { output } = await auditPrompt(input);
    if (!output) {
      throw new Error('AI failed to audit the bill.');
    }
    return output;
  }
);
