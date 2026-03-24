'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Group } from '@/lib/groups';
import { Expense, MonthlyBudget } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, MessageCircle, Share2, Loader2, Info, UserCheck, AlertTriangle } from 'lucide-react';
import { getAgentAdvice } from '@/ai/flows/agent-advisor-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AgentModule() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isGeneratingReminder, setIsGeneratingReminder] = useState<string | null>(null);
  const [reminderTone, setReminderTone] = useState<'funny' | 'professional' | 'desi'>('funny');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const budgetId = `${currentYear}-${currentMonth}`;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysRemaining = daysInMonth - new Date().getDate() + 1;

  // Fetching user's budget and expenses
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'monthlyBudgets', budgetId);
  }, [firestore, user?.uid, budgetId]);
  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user?.uid]);
  const { data: userExpenses } = useCollection<Expense>(expensesQuery);

  const totalSpent = userExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const budget = budgetData?.budgetAmount || 5000;
  const spendingRatio = totalSpent / budget;
  const isSurvivalMode = spendingRatio > 0.8;

  // Group Debts Logic (Who owes me?)
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: userGroups } = useCollection<Group>(groupsQuery);

  const [debts, setDebts] = useState<{name: string, amount: number}[]>([]);

  // Calculate simulated debts across all groups for MVP
  useEffect(() => {
    if (userGroups && userGroups.length > 0) {
      setDebts([
        { name: "Rahul Sharma", amount: 450 },
        { name: "Amit Kumar", amount: 120 }
      ]);
    } else {
      setDebts([]);
    }
  }, [userGroups]);

  const handleGetAdvice = async () => {
    setIsLoadingAdvice(true);
    setAdvice(null);
    try {
      const res = await getAgentAdvice({
        type: 'advice',
        context: {
          spent: totalSpent,
          budget: budget,
          daysRemaining: daysRemaining
        }
      });
      setAdvice(res.message);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Agent is temporarily unavailable.' });
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleGenerateReminder = async (debtorName: string, amount: number) => {
    setIsGeneratingReminder(debtorName);
    try {
      const res = await getAgentAdvice({
        type: 'reminder',
        context: {
          debtorName,
          amount,
          tone: reminderTone
        }
      });
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(res.message)}`;
      window.open(whatsappUrl, '_blank');
      toast({ title: 'Reminder Ready!', description: 'WhatsApp opened.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate reminder.' });
    } finally {
      setIsGeneratingReminder(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="bg-primary p-6 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight">{t.agent.title}</h1>
          </div>
          <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Your Financial Guardian</p>
        </div>
      </div>

      {/* Survival Mode Section */}
      <Card className={cn("border-none shadow-sm rounded-[1.5rem] overflow-hidden transition-colors", isSurvivalMode ? "bg-red-50" : "bg-card")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className={cn("w-4 h-4", isSurvivalMode ? "text-red-600 animate-pulse" : "text-blue-500")} />
            {isSurvivalMode ? t.agent.survivalActive : t.agent.survivalHealthy}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {advice ? (
            <div className="bg-white/80 p-4 rounded-2xl border border-border/50 text-[11px] leading-relaxed italic text-black font-medium animate-in zoom-in-95 duration-300">
              "{advice}"
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground uppercase leading-relaxed">
              {isSurvivalMode ? "Expenses are high. Agent suggests immediate cutbacks." : "You're doing great! Click below for a pro tip."}
            </p>
          )}
          <Button 
            onClick={handleGetAdvice} 
            disabled={isLoadingAdvice}
            className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm"
          >
            {isLoadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Info className="w-4 h-4" /> {t.agent.getAdvice}</>}
          </Button>
        </CardContent>
      </Card>

      {/* Social Shield Section */}
      <Card className="border-none shadow-sm bg-card rounded-[1.5rem] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            {t.agent.socialShield}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t.agent.reminderTone}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['funny', 'professional', 'desi'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setReminderTone(tone)}
                  className={cn(
                    "h-9 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border",
                    reminderTone === tone 
                      ? "bg-primary text-white border-primary shadow-lg" 
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  )}
                >
                  {t.agent.tones[tone]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t.agent.debtTitle}</p>
            {debts.length > 0 ? (
              <div className="grid gap-2">
                {debts.map((debt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{debt.name}</span>
                        <span className="text-[10px] text-primary font-black">₹{debt.amount}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateReminder(debt.name, debt.amount)}
                      disabled={isGeneratingReminder === debt.name}
                      className="h-8 rounded-lg text-[8px] font-black uppercase tracking-widest gap-1"
                    >
                      {isGeneratingReminder === debt.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><Share2 className="w-3 h-3" /> {t.agent.generateReminder}</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/10 rounded-2xl border-2 border-dashed border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">No pending debts found in groups.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Alert if overspending */}
      {isSurvivalMode && (
        <div className="p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3 shadow-xl animate-bounce">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">
            Critical Spending! Don't worry, Finovo Agent is protecting your remaining cash.
          </p>
        </div>
      )}
    </div>
  );
}