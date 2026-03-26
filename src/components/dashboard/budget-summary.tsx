
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { updateMonthlyBudget, MonthlyBudget } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Wallet } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AddExpenseDrawer = dynamic(() => import('@/components/expenses/add-expense-drawer').then(mod => mod.AddExpenseDrawer), { ssr: false });

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

  const { data: budgetData, isLoading: isBudgetLoading } = useDoc<MonthlyBudget>(budgetRef);
  
  // FIX: If we don't have a userId yet or we are still loading, budget is treated as 'null' to avoid 5000 flash
  const isActuallyLoading = isBudgetLoading || !userId;
  const budget = budgetData?.budgetAmount ?? (isActuallyLoading ? 0 : 5000);
  const overspentAmount = Math.max(totalSpent - (budget || 0), 0);

  const handleSetBudget = async () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && firestore) {
      const res = await updateMonthlyBudget(firestore, userId, val, month, year);
      if (res.success) {
        setOpen(false);
        setNewBudget("");
        toast({ title: "Budget updated!" });
      } else {
        toast({ 
          variant: "destructive",
          title: "Limit Reached",
          description: res.message || "You can only update your budget twice a month."
        });
      }
    }
  };

  return (
    <div className="space-y-2">
      <Card className="bg-card text-black border border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden relative h-32 flex items-center">
        <CardContent className="p-5 w-full relative">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-normal">MONTHLY BUDGET</p>
              {isActuallyLoading && !budgetData ? (
                <Skeleton className="h-10 w-32 bg-primary/10 rounded-lg" />
              ) : (
                <p className="text-4xl font-headline font-black leading-none tracking-tight">₹{budget.toLocaleString()}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-end gap-3 group">
                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-60 text-right min-w-[80px] transition-opacity group-hover:opacity-100">
                  Set Budget
                </span>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 bg-muted hover:bg-muted/80 p-0 rounded-full border border-border shrink-0 shadow-sm transition-transform active:scale-90"
                    >
                      <Pencil className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[320px] rounded-[1.5rem] bg-card border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline uppercase font-black text-sm text-black tracking-widest">
                        SET BUDGET
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        value={newBudget} 
                        onChange={(e) => setNewBudget(e.target.value)} 
                        className="h-12 rounded-xl font-bold bg-muted border-none text-center text-xl" 
                      />
                      <Button 
                        onClick={handleSetBudget} 
                        className="w-full h-12 rounded-xl uppercase tracking-widest text-xs font-black bg-primary text-white shadow-lg"
                      >
                        Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-end gap-3 group">
                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-60 text-right min-w-[80px] transition-opacity group-hover:opacity-100">
                  Add Expense
                </span>
                <div className="shrink-0">
                  <AddExpenseDrawer />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-card border-none shadow-sm rounded-[1rem] overflow-hidden h-24 flex items-center">
          <CardContent className="p-3 w-full flex flex-col justify-between h-full">
            <div>
              <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-widest font-normal">SPENT</p>
              <p className="text-xl font-headline font-black text-black">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden shrink-0">
              <div className="bg-primary h-full" style={{ width: `${budget > 0 ? Math.min((totalSpent/budget)*100, 100) : 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-sm rounded-[1rem] overflow-hidden h-24 flex items-center">
          <CardContent className="p-3 w-full flex flex-col justify-between h-full">
            <div>
              <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-widest font-normal">OVERSPENT BY</p>
              <p className="text-xl font-headline font-black text-[#D32F2F]">₹{overspentAmount.toLocaleString()}</p>
            </div>
            <div className="w-full h-1 bg-red-100 rounded-full overflow-hidden shrink-0">
              <div className="bg-[#D32F2F] h-full" style={{ width: `${overspentAmount > 0 ? 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
