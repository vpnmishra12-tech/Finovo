
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Sparkles, Mic, Camera, Keyboard, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

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

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-headline font-bold">Aage Kya Karein? (Steps)</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-none bg-primary/5 shadow-none overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  1. AI Features Test Karein
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-primary/10">
                    <Keyboard className="w-4 h-4 mb-2 text-primary" />
                    <p className="text-[10px] font-bold uppercase">Text Entry</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Neeche '+' dabayein aur likhein: "Dinner 800"</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-primary/10">
                    <Mic className="w-4 h-4 mb-2 text-primary" />
                    <p className="text-[10px] font-bold uppercase">Voice Magic</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Boliye: "Paid 300 for petrol"</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-primary/10">
                    <Camera className="w-4 h-4 mb-2 text-primary" />
                    <p className="text-[10px] font-bold uppercase">Bill Scan</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Kisi bhi bill ya receipt ki photo upload karein.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-accent/10 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-foreground" />
                  2. Real Login Enable Karein
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Abhi aap "Demo Mode" mein hain. Real authentication ke liye:
                </p>
                <ul className="text-[10px] space-y-1 list-disc pl-4 text-muted-foreground">
                  <li>Firebase Console mein jaakar <b>Google Provider</b> enable karein.</li>
                  <li>Apna workstation URL <b>Authorized Domains</b> mein add karein.</li>
                  <li>`src/app/page.tsx` se demo logic hata kar user ko login ke liye force karein.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none bg-secondary/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  3. App Host Karein
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Jab aap app se khush hon, toh ise <b>Firebase App Hosting</b> par deploy karke live kar sakte hain.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
