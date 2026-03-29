'use server';

/**
 * @fileOverview Centralized Server Actions for AI flows.
 * Next.js 15 requires ONLY async functions to be exported from 'use server' files.
 * This file explicitly exports only the functions to avoid compiler errors.
 */

import { getAgentAdvice as _getAgentAdvice } from './flows/agent-advisor-flow';
import { auditBill as _auditBill } from './flows/bill-audit-flow';
import { extractBillPhotoExpense as _extractBillPhotoExpense } from './flows/extract-bill-photo-expense';
import { extractTextExpense as _extractTextExpense } from './flows/extract-text-expense';
import { extractVoiceExpense as _extractVoiceExpense } from './flows/extract-voice-expense';
import { detectSubscriptions as _detectSubscriptions } from './flows/subscription-detector-flow';

export async function getAgentAdvice(input: any) {
  return _getAgentAdvice(input);
}

export async function auditBill(input: any) {
  return _auditBill(input);
}

export async function extractBillPhotoExpense(input: any) {
  return _extractBillPhotoExpense(input);
}

export async function extractTextExpense(input: any) {
  return _extractTextExpense(input);
}

export async function extractVoiceExpense(input: any) {
  return _extractVoiceExpense(input);
}

export async function detectSubscriptions(input: any) {
  return _detectSubscriptions(input);
}
