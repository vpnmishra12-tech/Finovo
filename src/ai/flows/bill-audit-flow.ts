/**
 * @fileOverview A flow for auditing bills.
 * Removed 'use server' and Genkit imports for static build compatibility.
 */

export type BillAuditInput = {
  billPhotoDataUri: string;
};

export type BillAuditOutput = {
  isCorrect: boolean;
  detectedErrors: string[];
  summary: string;
  detectedTotal: number;
  suggestedAction: string;
};

export async function auditBill(input: BillAuditInput): Promise<BillAuditOutput> {
  return {
    isCorrect: true,
    detectedErrors: [],
    summary: "Offline mode",
    detectedTotal: 0,
    suggestedAction: "Check manually"
  };
}
