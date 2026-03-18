
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Sparkles, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();

  // Memoized query for expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
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

  // Landing Page for Unauthenticated Users
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-8 max-w-2xl mx-auto">
          <div className="p-4 bg-primary/10 rounded-3xl mb-4">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight">
              Control your money with <span className="text-primary">AI</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track expenses using voice, text, or bill scans. SmartKharcha AI helps you save more by understanding your spending habits instantly.
            </p>
          </div>
          <div className="flex flex-col w-full sm:flex-row gap-4 pt-4">
            <Button size="lg" onClick={login} className="h-14 rounded-2xl text-lg gap-2 shadow-xl shadow-primary/20 flex-1">
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-6 pt-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Bank-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Powered by Gemini AI</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard for Authenticated Users
  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">
            {t.welcome}, {user.displayName?.split(' ')[0]} 👋
          </p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary 
          userId={user.uid} 
          totalSpent={expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0} 
        />

        <SpendingChart expenses={expenses || []} />

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
