"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { subscribeToExpenses, Expense } from '@/lib/expenses';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Button } from '@/components/ui/button';
import { LogIn, Wallet } from 'lucide-react';
import { useFirestore } from '@/firebase';

export default function Home() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const db = useFirestore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user && db) {
      const unsubscribe = subscribeToExpenses(db, user.uid, (data) => {
        setExpenses(data);
        setFetching(false);
      });
      return unsubscribe;
    }
  }, [user, db]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="relative inline-block">
             <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
             <div className="relative w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3">
               <Wallet className="w-12 h-12 text-white" />
             </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold tracking-tight">SmartKharcha AI</h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto">
              Smart expense tracking for smart Indian users.
            </p>
          </div>
          <div className="grid gap-4 pt-8">
            <Button size="lg" className="h-14 rounded-2xl gap-3 text-lg font-medium shadow-xl shadow-primary/20" onClick={login}>
              <LogIn className="w-5 h-5" />
              {t.loginWithGoogle}
            </Button>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
              <span className="h-px bg-border flex-1" />
              <span>Available in Hindi & English</span>
              <span className="h-px bg-border flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-2">
          <p className="text-muted-foreground font-medium">{t.welcome}, {user.displayName?.split(' ')[0]} 👋</p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary userId={user.uid} totalSpent={totalSpent} />

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-1">
          <SpendingChart expenses={expenses} />
        </div>

        <ExpenseList expenses={expenses} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
