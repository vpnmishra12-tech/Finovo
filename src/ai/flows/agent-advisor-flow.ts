/**
 * @fileOverview A Genkit flow for AI Agent advice and reminders.
 * Removed 'use server' for static export compatibility.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgentAdvisorInputSchema = z.object({
  type: z.enum(['advice', 'reminder']),
  context: z.object({
    budget: z.number().optional(),
    spent: z.number().optional(),
    daysRemaining: z.number().optional(),
    debtorName: z.string().optional(),
    amount: z.number().optional(),
    tone: z.enum(['funny', 'professional', 'desi']).optional(),
  }),
});
export type AgentAdvisorInput = z.infer<typeof AgentAdvisorInputSchema>;

const AgentAdvisorOutputSchema = z.object({
  message: z.string().describe('The AI generated message or advice.'),
  title: z.string().optional().describe('A catchy title for the advice.'),
});
export type AgentAdvisorOutput = z.infer<typeof AgentAdvisorOutputSchema>;

const advicePrompt = ai.definePrompt({
  name: 'agentAdvicePrompt',
  input: { schema: AgentAdvisorInputSchema },
  output: { schema: AgentAdvisorOutputSchema },
  prompt: `You are Finovo's AI Guardian Agent. 

Input Type: {{{type}}}

Context Information:
- Spent: ₹{{{context.spent}}}
- Budget: ₹{{{context.budget}}}
- Days Remaining: {{{context.daysRemaining}}}
- Debtor: {{{context.debtorName}}}
- Amount: ₹{{{context.amount}}}
- Tone: {{{context.tone}}}

Your Tasks:
1. If the type is 'advice': 
   Analyze the spending (₹{{{context.spent}}} out of ₹{{{context.budget}}}) with {{{context.daysRemaining}}} days left. 
   Give blunt, realistic, and helpful financial advice. If they are overspending (ratio > 0.8), activate "Survival Mode" advice. 
   Make it sound like a smart financial coach.

2. If the type is 'reminder':
   The user needs to ask {{{context.debtorName}}} for ₹{{{context.amount}}} they owe.
   Tone requested: {{{context.tone}}}.
   - If 'funny': Make it hilarious but clear.
   - If 'professional': Make it sound like a bank or a polite secretary.
   - If 'desi': Use Hinglish/casual vibes like "Bhai, scene set kar de".
   Write a short, punchy message they can send on WhatsApp.`,
});

export async function getAgentAdvice(input: AgentAdvisorInput): Promise<AgentAdvisorOutput> {
  const { output } = await advicePrompt(input);
  if (!output) {
    throw new Error('Agent failed to generate a response.');
  }
  return output;
}
