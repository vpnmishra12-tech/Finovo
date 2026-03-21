
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
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

  const overspentAmount = Math.max(totalSpent - budget, 0);

  return (
    <div className="space-y-3">
      {/* 100% IMAGE MATCH BUDGET CARD */}
      <Card className="bg-primary text-primary-foreground border-none shadow-2xl rounded-[2rem] overflow-hidden relative transition-transform active:scale-[0.98]">
        <CardContent className="p-8 py-10">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-black opacity-80 uppercase tracking-[0.2em]">MONTHLY BUDGET</p>
              <p className="text-6xl font-headline font-black leading-none tracking-tight">₹{budget.toLocaleString()}</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/10 hover:bg-white/20 p-0 rounded-full">
                  <Pencil className="w-5 h-5 text-white" />
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
        </CardContent>
      </Card>

      {/* 100% IMAGE MATCH SPENT/OVERSPENT CARDS - SLIM STYLE */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm rounded-[1.2rem] overflow-hidden relative h-20 flex items-center">
          <CardContent className="p-4 w-full">
            <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">SPENT</p>
            <p className="text-xl font-headline font-black leading-tight text-black">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-2 w-full h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${Math.min((totalSpent/budget)*100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-[1.2rem] overflow-hidden h-20 flex items-center">
          <CardContent className="p-4 w-full">
            <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">OVERSPENT BY</p>
            <p className="text-xl font-headline font-black leading-tight text-red-500">₹{overspentAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
