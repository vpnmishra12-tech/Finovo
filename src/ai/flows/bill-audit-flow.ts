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

const auditPrompt = ai.definePrompt({
  name: 'billAuditPrompt',
  input: { schema: BillAuditInputSchema },
  output: { schema: BillAuditOutputSchema },
  config: {
    temperature: 0,
  },
  prompt: `Audit this bill/receipt image. 
1. Sum all items and verify against total.
2. Check for hidden or optional charges.
3. Verify tax logic.

Bill Photo: {{media url=billPhotoDataUri}}`,
});

export async function auditBill(input: BillAuditInput): Promise<BillAuditOutput> {
  const { output } = await auditPrompt(input);
  if (!output) {
    throw new Error('AI failed to audit the bill.');
  }
  return output;
}
