import { config } from 'dotenv';
config();

import '@/ai/flows/extract-text-expense.ts';
import '@/ai/flows/extract-bill-photo-expense.ts';
import '@/ai/flows/extract-voice-expense.ts';
import '@/ai/flows/agent-advisor-flow.ts';