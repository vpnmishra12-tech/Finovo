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
  prompt: `You are an expert Forensic Accountant. Your task is to audit the provided bill/receipt image with extreme scrutiny.

Check for the following:
1. **Mathematical Accuracy**: Sum up every single line item and tax. Does the math add up to the final 'Grand Total'? Even a 1 rupee difference is an error.
2. **Hidden/Illegal Charges**: Detect 'Service Charges' (often optional/illegal), 'Misc Fees', 'Handling Charges', or 'Container Charges' that look suspicious. 
3. **GST/VAT Audit**: Check if the tax percentage applied matches the tax amount. Ensure tax is not calculated on top of other taxes (tax on tax).
4. **Duplication Check**: Look for items listed twice or similar-looking entries that might be a double-charge.
5. **Overcharging**: If possible, identify if the GST number (GSTIN) is missing which might indicate a fake bill.

If you find ANY discrepancy or suspicious charge, set isCorrect to false and list the errors clearly.

In the 'suggestedAction', provide a clear, firm sentence the user can say to the merchant to get a refund or correction.

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
