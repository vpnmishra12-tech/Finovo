
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { MonthlyHistory } from '@/components/dashboard/monthly-history';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Sparkles, Wallet, ShieldCheck, Mail, Lock, UserPlus, LogIn, Info, Download } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const { user, loading, login, signup } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Month Switcher State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // Memoized query for expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsAuthLoading(true);
    await login(email, password);
    setIsAuthLoading(false);
  };

  const handleSignup = async () => {
    if (!email || !password) return;
    setIsAuthLoading(true);
    await signup(email, password);
    setIsAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl mx-auto">
          <div className="p-4 bg-primary/10 rounded-3xl mb-4">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight">
              Control your money with <span className="text-primary">AI</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Create a secure account to track expenses using voice, text, or bill scans.
            </p>
          </div>

          <Alert className="max-w-sm bg-blue-500/10 border-blue-500/20 text-blue-600 rounded-2xl">
            <Download className="w-4 h-4" />
            <AlertTitle className="text-sm font-bold">Install Tip</AlertTitle>
            <AlertDescription className="text-xs">
              Add to Home Screen from your browser menu to use it like a real app!
            </AlertDescription>
          </Alert>

          <Card className="w-full max-w-sm border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-card rounded-none h-full font-bold">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-card rounded-none h-full font-bold">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-8 space-y-4">
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Username / Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted border-none font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted border-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <TabsContent value="login" className="m-0">
                    <Button 
                      onClick={handleLogin}
                      className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                      disabled={isAuthLoading || !email || !password}
                    >
                      {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Login</>}
                    </Button>
                  </TabsContent>

                  <TabsContent value="signup" className="m-0">
                    <Button 
                      onClick={handleSignup}
                      className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                      disabled={isAuthLoading || !email || !password}
                    >
                      {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
                    </Button>
                  </TabsContent>

                  <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" /> Secure login via Firebase Auth
                  </p>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex items-center gap-6 pt-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Filter expenses for selected month/year
  const selectedMonthExpenses = expenses?.filter(exp => {
    const expDate = new Date(exp.transactionDate);
    return (expDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth && expDate.getFullYear().toString() === selectedYear;
  }) || [];

  const totalSpentSelectedMonth = selectedMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              {t.welcome} 👋
            </p>
            <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px] bg-transparent border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.months).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-transparent border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <BudgetSummary 
          userId={user.uid} 
          totalSpent={totalSpentSelectedMonth}
          month={parseInt(selectedMonth)}
          year={parseInt(selectedYear)}
        />

        <MonthlyHistory expenses={expenses || []} />

        <SpendingChart expenses={selectedMonthExpenses} />

        <AdBanner />

        <ExpenseList expenses={selectedMonthExpenses} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
