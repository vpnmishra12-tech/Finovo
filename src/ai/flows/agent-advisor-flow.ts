'use server';
/**
 * @fileOverview A Genkit flow for AI Agent advice and reminders.
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

export async function getAgentAdvice(input: AgentAdvisorInput): Promise<AgentAdvisorOutput> {
  return agentAdvisorFlow(input);
}

const advicePrompt = ai.definePrompt({
  name: 'agentAdvicePrompt',
  input: { schema: AgentAdvisorInputSchema },
  output: { schema: AgentAdvisorOutputSchema },
  prompt: `You are Finovo's AI Guardian Agent. 
  {{#if (eq type 'advice')}}
    The user has spent ₹{{{context.spent}}} out of a budget of ₹{{{context.budget}}}. 
    There are {{{context.daysRemaining}}} days left in the month.
    Give blunt, realistic, and helpful financial advice. If they are overspending, activate "Survival Mode" advice. 
    Make it sound like a smart financial coach.
  {{else}}
    The user needs to ask {{{context.debtorName}}} for ₹{{{context.amount}}} they owe.
    Tone: {{{context.tone}}}.
    {{#if (eq context.tone 'funny')}}Make it hilarious but clear.{{/if}}
    {{#if (eq context.tone 'professional')}}Make it sound like a bank or a polite secretary.{{/if}}
    {{#if (eq context.tone 'desi')}}Use Hinglish/casual vibes like "Bhai, scene set kar de".{{/if}}
    Write a short message they can send on WhatsApp.
  {{/if}}`,
});

const agentAdvisorFlow = ai.defineFlow(
  {
    name: 'agentAdvisorFlow',
    inputSchema: AgentAdvisorInputSchema,
    outputSchema: AgentAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await advicePrompt(input);
    return output!;
  }
);
