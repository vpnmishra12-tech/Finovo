import { config } from 'dotenv';
config();

import '@/ai/flows/extract-text-expense.ts';
import '@/ai/flows/extract-bill-photo-expense.ts';
import '@/ai/flows/extract-voice-expense.ts';
import '@/ai/flows/agent-advisor-flow.ts';
import '@/ai/flows/bill-audit-flow.ts';
import '@/ai/flows/subscription-detector-flow.ts';
