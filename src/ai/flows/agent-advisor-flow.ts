/**
 * @fileOverview A flow for AI Agent advice.
 * Explicitly removed server-side only logic for static export compatibility.
 */

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
  return { message: "AI Features require a live server connection.", title: "AI Offline" };
}
