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
  prompt: `You are an expert Forensic Accountant. Your task is to audit the provided bill/receipt image.

Check for the following:
1. **Mathematical Accuracy**: Add up all line items and taxes. Does it match the printed "Total"?
2. **Hidden/Extra Charges**: Identify if there are "Service Charges" (often optional in some regions), "Handling Fees", or "Misc Charges" that seem unnecessary.
3. **Tax Audit**: Verify if GST/VAT percentages are applied correctly to the taxable amount.
4. **Overcharging**: Check if any item price looks unusually high or duplicated.

If you find a discrepancy (even of 1 rupee), set isCorrect to false and list the errors.

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
