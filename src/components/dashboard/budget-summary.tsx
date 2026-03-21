"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Edit2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function BudgetSummary({ userId, totalSpent, month, year }: { userId: string, totalSpent: number, month: number, year: number }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newBudget, setNewBudget] = useState("");
  const [open, setOpen] = useState(false);

  const budgetId = `${year}-${month}`;
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId, 'monthlyBudgets', budgetId);
  }, [firestore, userId, budgetId]);

  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);
  const budget = budgetData?.budgetAmount || 5000;

  const handleSetBudget = async () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && firestore) {
      const res = await updateMonthlyBudget(firestore, userId, val, month, year);
      if (res.success) {
        setOpen(false);
        setNewBudget("");
        toast({ title: "Budget updated!" });
      }
    }
  };

  const remaining = budget - totalSpent;
  const overspentAmount = Math.max(totalSpent - budget, 0);

  return (
    <div className="space-y-4">
      <Alert className="py-2.5 px-4 rounded-[1.2rem] border bg-red-50 text-red-700 border-red-100 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <AlertDescription className="text-[10px] font-black uppercase tracking-widest leading-none">
          ALERT: 100% BUDGET REACHED. YOU ARE OVERSPENDING!
        </AlertDescription>
      </Alert>

      <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2.5rem] overflow-hidden relative">
        <CardContent className="p-8 py-10">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11px] font-black opacity-70 uppercase tracking-[0.2em]">{t.budget}</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 p-0 rounded-full">
                  <Edit2 className="w-4 h-4 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[350px] rounded-[2rem]">
                <DialogHeader><DialogTitle className="font-headline uppercase font-black">{t.actions.setBudget}</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input type="number" placeholder="Enter amount" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-12 rounded-xl font-bold" />
                  <Button onClick={handleSetBudget} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Update</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-5xl font-headline font-black leading-none tracking-tight">₹{budget.toLocaleString()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden relative">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t.spent}</p>
            <p className="text-2xl font-headline font-black leading-tight text-black">₹{totalSpent.toLocaleString()}</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10">
              <div className="bg-primary h-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
              OVERSPENT BY
            </p>
            <p className="text-2xl font-headline font-black leading-tight text-red-500">
              ₹{overspentAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
