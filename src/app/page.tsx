"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();

  // Demo ID for previewing without login
  const effectiveUserId = user?.uid || "demo-user-id";
  const effectiveUserName = user?.displayName?.split(' ')[0] || "Guest";

  // Memoized query for expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users', effectiveUserId, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, effectiveUserId]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Login check bypassed as requested for preview
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{t.welcome}, {effectiveUserName} 👋</p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary userId={effectiveUserId} totalSpent={expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0} />

        <SpendingChart expenses={expenses || []} />

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
