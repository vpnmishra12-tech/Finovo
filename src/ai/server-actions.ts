/**
 * @fileOverview Client-Side AI Stubs for Static Export.
 * This file contains NO Server Actions and NO node-only imports.
 * It provides placeholder logic to ensure the app builds successfully for APK.
 */

export async function getAgentAdvice(input: any) {
  return { 
    message: "AI Advice is currently restricted in the offline app. Please use the web version for smart insights.", 
    title: "AI Offline" 
  };
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
