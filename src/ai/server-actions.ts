/**
 * @fileOverview Safe Client-Side AI Stubs for Static Export.
 * These functions replace Server Actions to prevent build errors.
 * They return a consistent "Requires Server" response in APK mode.
 */

const OFFLINE_ERROR = {
  error: "AI Features require a live server connection and are not available in this static build.",
  message: "AI Features require a live server.",
  isCorrect: true,
  summary: "AI Audit is only available in the web version.",
  subscriptions: [],
  totalAnnualDrain: 0
};

export async function getAgentAdvice(input: any) {
  return { message: "AI Advice is currently unavailable in the offline app.", title: "AI Offline" };
}

export async function auditBill(input: any) {
  return {
    isCorrect: true,
    detectedErrors: [],
    summary: "AI Bill Audit is disabled in this static build.",
    detectedTotal: 0,
    suggestedAction: "Please check your bill manually."
  };
}

export async function extractBillPhotoExpense(input: any) {
  throw new Error("AI Extraction is not supported in the offline APK build.");
}

export async function extractTextExpense(input: any) {
  throw new Error("AI Text Extraction is not supported in the offline APK build.");
}

export async function extractVoiceExpense(input: any) {
  throw new Error("AI Voice Extraction is not supported in the offline APK build.");
}

export async function detectSubscriptions(input: any) {
  return {
    subscriptions: [],
    totalAnnualDrain: 0,
    summary: "AI Subscription Detection is disabled in this static build."
  };
}
