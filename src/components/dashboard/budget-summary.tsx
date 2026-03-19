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
import { PiggyBank, Target, TrendingUp, Edit2, AlertTriangle, Info, History, ArrowUpCircle } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function BudgetSummary({ userId, totalSpent, month, year }: { userId: string, totalSpent: number, month: number, year: number }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newBudget, setNewBudget] = useState("");
  const [open, setOpen] = useState(false);
  const [lastMonthDebt, setLastMonthDebt] = useState(0);

  const budgetId = `${year}-${month}`;
  
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId, 'monthlyBudgets', budgetId);
  }, [firestore, userId, budgetId]);

  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);
  const budget = budgetData?.budgetAmount || 0;
  const updateCount = budgetData?.updateCount || 0;

  useEffect(() => {
    async function checkCarryover() {
      if (!firestore || !userId) return;
      const prevDate = new Date(year, month - 2, 1);
      const prevMonth = prevDate.getMonth() + 1;
      const prevYear = prevDate.getFullYear();
      const prevBudgetId = `${prevYear}-${prevMonth}`;
      const prevBudgetRef = doc(firestore, 'users', userId, 'monthlyBudgets', prevBudgetId);
      const prevBudgetSnap = await getDoc(prevBudgetRef);
      if (prevBudgetSnap.exists()) {
        const prevBudgetVal = (prevBudgetSnap.data() as MonthlyBudget).budgetAmount;
        const prevSpent = await getMonthlySpending(firestore, userId, prevMonth, prevYear);
        if (prevSpent > prevBudgetVal) setLastMonthDebt(prevSpent - prevBudgetVal);
        else setLastMonthDebt(0);
      } else setLastMonthDebt(0);
    }
    checkCarryover();
  }, [firestore, userId, month, year]);

  const handleSetBudget = async () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && firestore) {
      const res = await updateMonthlyBudget(firestore, userId, val, month, year);
      if (res.success) {
        setOpen(false);
        setNewBudget("");
        toast({ title: "Success", description: "Budget updated!" });
      } else {
        toast({ variant: "destructive", title: t.limitReached, description: t.limitDesc });
      }
    }
  };

  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - totalSpent, 0);
  const overspentAmount = Math.max(totalSpent - budget, 0);

  return (
    <div className="space-y-2">
      {percentage >= 75 && budget > 0 && (
        <Alert className="py-2 px-4 rounded-xl border bg-destructive/5 text-destructive border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-[10px] font-bold uppercase">
            {percentage >= 100 ? t.alerts.exhausted : t.alerts.critical}
          </AlertDescription>
        </Alert>
      )}

      {lastMonthDebt > 0 && (
        <div className="bg-destructive/10 border-destructive/20 rounded-xl p-2 flex items-center gap-2">
          <History className="w-4 h-4 text-destructive" />
          <p className="text-[9px] font-black text-destructive uppercase tracking-widest">Debt: -₹{lastMonthDebt.toLocaleString()}</p>
        </div>
      )}

      <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden">
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[8px] font-black opacity-70 uppercase tracking-widest">{t.budget}</p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 bg-white/10 hover:bg-white/20">
                    <Edit2 className="w-2.5 h-2.5 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[350px]">
                  <DialogHeader><DialogTitle>{t.actions.setBudget}</DialogTitle></DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-muted-foreground">{t.limitDesc}</p>
                    <Input type="number" placeholder="Enter amount" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
                    <Button onClick={handleSetBudget} className="w-full">{t.actions.save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xl font-headline font-black leading-tight">₹{budget.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <p className="text-[8px] font-black text-muted-foreground mb-0.5 uppercase tracking-widest">{t.spent}</p>
            <p className="text-xl font-headline font-black leading-tight">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-1.5 space-y-1">
              <Progress value={percentage} className="h-1 bg-muted" />
              <div className="flex justify-between text-[8px] text-muted-foreground font-black">
                <span>{percentage.toFixed(0)}%</span>
                <span>{budget.toLocaleString()} LIMIT</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <p className="text-[8px] font-black text-muted-foreground mb-0.5 uppercase tracking-widest">
              {overspentAmount > 0 ? t.overspent : t.remaining}
            </p>
            <p className={`text-xl font-headline font-black leading-tight ${overspentAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
              ₹{(overspentAmount > 0 ? overspentAmount : remaining).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
