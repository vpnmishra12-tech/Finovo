"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget, getMonthlySpending } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Edit2, History } from 'lucide-react';
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
    <div className="space-y-3">
      {percentage >= 75 && budget > 0 && (
        <Alert className="py-1 px-3 rounded-xl border bg-destructive/5 text-destructive border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-[9px] font-black uppercase tracking-widest leading-none">
            {percentage >= 100 ? t.alerts.exhausted : t.alerts.critical}
          </AlertDescription>
        </Alert>
      )}

      {lastMonthDebt > 0 && (
        <div className="bg-destructive/10 border-destructive/20 rounded-xl p-2 flex items-center gap-2">
          <History className="w-3 h-3 text-destructive" />
          <p className="text-[9px] font-black text-destructive uppercase tracking-widest">Last Month Debt: -₹{lastMonthDebt.toLocaleString()}</p>
        </div>
      )}

      <div className="grid gap-2.5">
        <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden rounded-[1.8rem]">
          <CardContent className="p-4 py-5 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-black opacity-70 uppercase tracking-[0.2em]">{t.budget}</p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/10 hover:bg-white/20 p-0 rounded-full">
                    <Edit2 className="w-3.5 h-3.5 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[350px] rounded-3xl">
                  <DialogHeader><DialogTitle className="font-headline uppercase font-black">{t.actions.setBudget}</DialogTitle></DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-xs font-bold text-black/60 uppercase tracking-tight">{t.limitDesc}</p>
                    <Input type="number" placeholder="Enter amount" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-12 rounded-xl font-bold" />
                    <Button onClick={handleSetBudget} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">{t.actions.save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-3xl font-headline font-black leading-none tracking-tight">₹{budget.toLocaleString()}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <Card className="bg-card border-2 border-primary/5 shadow-sm overflow-hidden rounded-[1.2rem]">
            <CardContent className="p-4">
              <p className="text-[9px] font-black text-black/40 mb-1 uppercase tracking-widest">{t.spent}</p>
              <p className="text-xl font-headline font-black leading-tight text-black">₹{totalSpent.toLocaleString()}</p>
              <div className="mt-2">
                <Progress value={percentage} className="h-1 bg-muted" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-primary/5 shadow-sm overflow-hidden rounded-[1.2rem]">
            <CardContent className="p-4">
              <p className="text-[9px] font-black text-black/40 mb-1 uppercase tracking-widest">
                {overspentAmount > 0 ? t.overspent : t.remaining}
              </p>
              <p className={`text-xl font-headline font-black leading-tight ${overspentAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ₹{(overspentAmount > 0 ? overspentAmount : remaining).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
