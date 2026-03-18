
"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget, getMonthlySpending } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PiggyBank, Target, TrendingUp, Edit2, AlertTriangle, Info, History } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function BudgetSummary({ userId, totalSpent }: { userId: string, totalSpent: number }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newBudget, setNewBudget] = useState("");
  const [open, setOpen] = useState(false);
  const [lastMonthDebt, setLastMonthDebt] = useState(0);

  const now = new Date();
  const budgetId = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId, 'monthlyBudgets', budgetId);
  }, [firestore, userId, budgetId]);

  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);
  const budget = budgetData?.budgetAmount || 0;
  const updateCount = budgetData?.updateCount || 0;

  // Fetch previous month's overspending
  useEffect(() => {
    async function checkCarryover() {
      if (!firestore || !userId) return;
      
      const prevDate = new Date();
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.getMonth() + 1;
      const prevYear = prevDate.getFullYear();
      
      const prevBudgetId = `${prevYear}-${prevMonth}`;
      const prevBudgetRef = doc(firestore, 'users', userId, 'monthlyBudgets', prevBudgetId);
      const prevBudgetSnap = await (getDoc(prevBudgetRef) as any);
      
      if (prevBudgetSnap.exists()) {
        const prevBudgetVal = prevBudgetSnap.data().budgetAmount;
        const prevSpent = await getMonthlySpending(firestore, userId, prevMonth, prevYear);
        if (prevSpent > prevBudgetVal) {
          setLastMonthDebt(prevSpent - prevBudgetVal);
        }
      }
    }
    checkCarryover();
  }, [firestore, userId]);

  const handleSetBudget = async () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && firestore) {
      const res = await updateMonthlyBudget(firestore, userId, val);
      if (res.success) {
        setOpen(false);
        setNewBudget("");
        toast({ title: "Success", description: "Budget updated!" });
      } else {
        toast({ 
          variant: "destructive", 
          title: t.limitReached, 
          description: t.limitDesc 
        });
      }
    }
  };

  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - totalSpent, 0);

  return (
    <div className="space-y-4">
      {/* Percentage Alerts */}
      {percentage >= 100 && (
        <Alert variant="destructive" className="animate-pulse rounded-2xl border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">{t.alerts.exhausted}</AlertTitle>
        </Alert>
      )}
      {percentage >= 75 && percentage < 100 && (
        <Alert className="bg-orange-500/10 text-orange-600 border-orange-500/50 rounded-2xl border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">{t.alerts.critical}</AlertTitle>
        </Alert>
      )}
      {percentage >= 50 && percentage < 75 && (
        <Alert className="bg-blue-500/10 text-blue-600 border-blue-500/50 rounded-2xl border-2">
          <Info className="h-5 w-5" />
          <AlertTitle className="font-bold">{t.alerts.halfway}</AlertTitle>
        </Alert>
      )}

      {/* Carryover Alert */}
      {lastMonthDebt > 0 && (
        <Card className="bg-destructive/10 border-destructive/20 rounded-2xl border-2">
          <CardContent className="p-4 flex items-center gap-3">
            <History className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-xs font-bold text-destructive uppercase tracking-widest">{t.overspentLastMonth}</p>
              <p className="text-lg font-headline font-bold text-destructive">-₹{lastMonthDebt.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Manage your spending carefully this month.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs bg-white/10 hover:bg-white/20 text-white">
                    <Edit2 className="w-3 h-3 mr-1" /> {t.actions.setBudget} ({updateCount}/2)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[350px]">
                  <DialogHeader>
                    <DialogTitle>{t.actions.setBudget}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-muted-foreground">{t.limitDesc}</p>
                    <Input 
                      type="number" 
                      placeholder="Enter monthly goal" 
                      value={newBudget} 
                      onChange={(e) => setNewBudget(e.target.value)}
                    />
                    <Button onClick={handleSetBudget} className="w-full">{t.actions.save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wider">{t.budget}</p>
            <p className="text-3xl font-headline font-bold">₹{budget.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-accent/20 rounded-lg">
                <PiggyBank className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.spent}</p>
            <p className="text-2xl font-headline font-bold">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-4 space-y-2">
              <Progress value={percentage} className={`h-1.5 ${percentage >= 100 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''}`} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>{percentage.toFixed(0)}%</span>
                <span>₹{budget.toLocaleString()} CAP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${remaining > 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <Target className={`w-5 h-5 ${remaining > 0 ? 'text-green-500' : 'text-destructive'}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.remaining}</p>
            <p className={`text-2xl font-headline font-bold ${remaining > 0 ? 'text-green-500' : 'text-destructive'}`}>
              ₹{remaining.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
