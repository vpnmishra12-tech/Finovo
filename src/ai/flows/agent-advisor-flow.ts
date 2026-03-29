/**
 * @fileOverview A Genkit flow for AI Agent advice and reminders.
 * Removed 'use server' for static export compatibility.
 */
import { z } from 'zod';

export type AgentAdvisorInput = {
  type: 'advice' | 'reminder';
  context: {
    budget?: number;
    spent?: number;
    daysRemaining?: number;
    debtorName?: string;
    amount?: number;
    tone?: 'funny' | 'professional' | 'desi';
  };
};

export type AgentAdvisorOutput = {
  message: string;
  title?: string;
};

export async function getAgentAdvice(input: AgentAdvisorInput): Promise<AgentAdvisorOutput> {
  return { message: "AI Offline", title: "AI Offline" };
}
