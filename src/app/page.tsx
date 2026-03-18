
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Sparkles, Mic, Camera, Keyboard } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';

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

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{t.welcome}, {effectiveUserName} 👋</p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary userId={effectiveUserId} totalSpent={expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0} />

        <SpendingChart expenses={expenses || []} />

        {(!expenses || expenses.length === 0) && (
          <section className="space-y-4">
            <h3 className="text-lg font-headline font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Start Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-none bg-primary/5 shadow-none">
                <CardContent className="p-4 space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Keyboard className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">Try Text</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Type "Dinner 1200" in the text box.</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-primary/5 shadow-none">
                <CardContent className="p-4 space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">Try Voice</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Speak "Paid 500 for taxi".</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-primary/5 shadow-none">
                <CardContent className="p-4 space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">Try Scan</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Upload a photo of any bill/receipt.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
