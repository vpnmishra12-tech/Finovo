
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Button } from '@/components/ui/button';
import { LogIn, Wallet, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';

export default function Home() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();

  // Memoized query for expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="relative w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold tracking-tight">SmartKharcha AI</h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto">
              Smart expense tracking for modern Indian users.
            </p>
          </div>
          <Button size="lg" className="h-14 w-full rounded-2xl gap-3 text-lg font-medium shadow-xl" onClick={login}>
            <LogIn className="w-5 h-5" />
            {t.loginWithGoogle}
          </Button>
        </div>
      </div>
    );
  }

  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{t.welcome}, {user.displayName?.split(' ')[0]} 👋</p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary userId={user.uid} totalSpent={totalSpent} />

        <SpendingChart expenses={expenses || []} />

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
