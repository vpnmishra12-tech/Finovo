
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PiggyBank, Target, TrendingUp, Edit2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function BudgetSummary({ userId, totalSpent }: { userId: string, totalSpent: number }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [newBudget, setNewBudget] = useState("");
  const [open, setOpen] = useState(false);

  const now = new Date();
  const budgetId = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId, 'monthlyBudgets', budgetId);
  }, [firestore, userId, budgetId]);

  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);
  const budget = budgetData?.budgetAmount || 0;

  const handleSetBudget = () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && firestore) {
      updateMonthlyBudget(firestore, userId, val);
      setOpen(false);
      setNewBudget("");
    }
  };

  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - totalSpent, 0);

  return (
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
                  <Edit2 className="w-3 h-3 mr-1" /> {t.actions.setBudget}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[350px]">
                <DialogHeader>
                  <DialogTitle>{t.actions.setBudget}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input 
                    type="number" 
                    placeholder="Enter monthly goal (e.g. 25000)" 
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
            <Progress value={percentage} className="h-1.5" />
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
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Target className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.remaining}</p>
          <p className="text-2xl font-headline font-bold text-green-500">₹{remaining.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
