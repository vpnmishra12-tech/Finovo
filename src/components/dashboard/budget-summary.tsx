"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { getBudget, setBudget as setFirebaseBudget } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';
import { useFirestore } from '@/firebase';

export function BudgetSummary({ userId, totalSpent }: { userId: string, totalSpent: number }) {
  const { t } = useLanguage();
  const db = useFirestore();
  const [budget, setBudgetState] = useState(0);
  const [newBudget, setNewBudget] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (db) {
      getBudget(db, userId).then(setBudgetState);
    }
  }, [userId, db]);

  const handleSetBudget = async () => {
    const b = parseFloat(newBudget);
    if (!isNaN(b) && db) {
      await setFirebaseBudget(db, userId, b);
      setBudgetState(b);
      setOpen(false);
    }
  };

  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - totalSpent, 0);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card className="bg-primary text-primary-foreground border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-none">
                  {t.actions.setBudget}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[350px]">
                <DialogHeader>
                  <DialogTitle>{t.actions.setBudget}</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 py-4">
                  <Input 
                    type="number" 
                    placeholder="e.g. 15000" 
                    value={newBudget} 
                    onChange={(e) => setNewBudget(e.target.value)}
                  />
                  <Button onClick={handleSetBudget}>{t.actions.save}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm font-medium opacity-80 mb-1">{t.budget}</p>
          <p className="text-3xl font-headline font-bold">₹{budget.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-accent/20 rounded-lg">
              <PiggyBank className="w-5 h-5 text-accent-foreground" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t.spent}</p>
          <p className="text-2xl font-headline font-bold">₹{totalSpent.toLocaleString()}</p>
          <div className="mt-4 space-y-2">
            <Progress value={percentage} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percentage.toFixed(0)}%</span>
              <span>₹{budget.toLocaleString()} max</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Target className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t.remaining}</p>
          <p className="text-2xl font-headline font-bold text-green-500">₹{remaining.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
