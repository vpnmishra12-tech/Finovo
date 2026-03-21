
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
      {/* Main Budget Card */}
      <Card className="bg-[#1D4ED8] text-primary-foreground border-none shadow-xl rounded-[2rem] overflow-hidden relative h-36 flex items-center">
        <CardContent className="p-6 w-full relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">MONTHLY BUDGET</p>
              <p className="text-5xl font-headline font-black leading-none tracking-tight">₹{budget.toLocaleString()}</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/10 hover:bg-white/20 p-0 rounded-full border border-white/20">
                  <Pencil className="w-4 h-4 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-[2rem]">
                <DialogHeader><DialogTitle className="font-headline uppercase font-black">{t.actions.setBudget}</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <Input type="number" placeholder="Enter amount" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-12 rounded-xl font-bold" />
                  <Button onClick={handleSetBudget} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Update</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Spent & Overspent Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm rounded-[1.5rem] overflow-hidden h-24 flex items-center">
          <CardContent className="p-4 w-full flex flex-col justify-between h-full">
            <div>
              <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">SPENT</p>
              <p className="text-2xl font-headline font-black text-black">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${Math.min((totalSpent/budget)*100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-[1.5rem] overflow-hidden h-24 flex items-center">
          <CardContent className="p-4 w-full">
            <p className="text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">OVERSPENT BY</p>
            <p className="text-2xl font-headline font-black text-[#D32F2F]">₹{overspentAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
