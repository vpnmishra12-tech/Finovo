
"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Wallet, Mail, Lock, UserPlus, LogIn, Info, Smartphone, LayoutDashboard, History, Calculator, Sparkles, Mic, Camera, Keyboard } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Extreme Optimization: Dynamic imports for speed
const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), { 
  ssr: false,
  loading: () => <div className="h-[140px] w-full bg-muted/20 animate-pulse rounded-2xl" />
});
const MonthlyHistory = dynamic(() => import('@/components/dashboard/monthly-history').then(mod => mod.MonthlyHistory), { 
  ssr: false,
  loading: () => <div className="h-[100px] w-full bg-muted/10 animate-pulse rounded-2xl" />
});
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { 
  ssr: false 
});
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { 
  ssr: false 
});

type NavTab = 'dashboard' | 'history' | 'splitter';

export default function Home() {
  const { user, loading, login, signup } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(100)
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
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="bg-primary/10 p-4 rounded-3xl relative z-10">
              <Wallet className="w-10 h-10 text-primary stroke-[2.5px]" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse ml-1">
            Finovo Engine v3.5
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-8 max-w-2xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-primary/10 rounded-3xl mb-4">
              <Wallet className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl font-headline font-black tracking-tight">
                Control your money with <span className="text-primary">AI</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">
                Track expenses using voice, text, or bill scans. Finovo makes it easy.
              </p>
            </div>

            <Alert className="max-w-sm mt-8 bg-blue-500/10 border-blue-500/20 text-blue-600 rounded-2xl text-left shadow-sm">
              <Smartphone className="w-5 h-5 mb-2" />
              <AlertTitle className="text-xs font-black uppercase">App Install Tip</AlertTitle>
              <AlertDescription className="text-[10px] space-y-1 font-bold">
                <p>• <b>iPhone:</b> Tap Share 📤 & <b>'Add to Home Screen'</b></p>
                <p>• <b>Android:</b> Tap 3 dots & <b>'Install App'</b></p>
              </AlertDescription>
            </Alert>

            <Card className="w-full max-w-sm border-none shadow-2xl rounded-3xl overflow-hidden bg-card mt-8">
              <CardContent className="p-0">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-card rounded-none h-full font-black text-xs uppercase tracking-widest">
                      Login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-card rounded-none h-full font-black text-xs uppercase tracking-widest">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-8 space-y-4">
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-muted border-none font-bold text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-muted border-none font-bold text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <TabsContent value="login" className="m-0">
                      <Button 
                        onClick={handleLogin}
                        className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                        disabled={isAuthLoading || !email || !password}
                      >
                        {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Login</>}
                      </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="m-0">
                      <Button 
                        onClick={handleSignup}
                        className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                        disabled={isAuthLoading || !email || !password}
                      >
                        {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Sign Up</>}
                      </Button>
                    </TabsContent>

                    <p className="text-[9px] text-muted-foreground text-center font-bold flex items-center justify-center gap-1 uppercase pt-2">
                      <Info className="w-3 h-3" /> Encrypted & Secure
                    </p>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const selectedMonthExpenses = expenses?.filter(exp => {
    const expDate = new Date(exp.transactionDate);
    return (expDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth && expDate.getFullYear().toString() === selectedYear;
  }) || [];

  const totalSpentSelectedMonth = selectedMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const NavItem = ({ id, icon: Icon, label }: { id: NavTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all",
        activeTab === id 
          ? "bg-primary text-primary-foreground shadow-lg scale-105" 
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex-1 flex flex-col md:flex-row container max-w-6xl mx-auto md:gap-4 px-4 overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="hidden md:flex flex-col gap-1 py-4 w-48 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]",
              activeTab === 'dashboard' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]",
              activeTab === 'history' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <History className="w-4 h-4" />
            {t.history}
          </button>
          <button
            onClick={() => setActiveTab('splitter')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]",
              activeTab === 'splitter' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <Calculator className="w-4 h-4" />
            {t.billSplitter}
          </button>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto py-2 space-y-3 min-w-0 pb-16 md:pb-8 scroll-smooth scrollbar-hide">
          {activeTab === 'dashboard' && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <section className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                    {t.welcome} 👋
                  </p>
                  <h2 className="text-xl font-headline font-black tracking-tight uppercase">{t.dashboard}</h2>
                </div>
                
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[90px] h-7 bg-transparent border-none font-black text-[10px] uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.months).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-[10px] font-bold uppercase">{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[65px] h-7 bg-transparent border-none font-black text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                        <SelectItem key={y} value={y.toString()} className="text-[10px] font-bold">{y}</SelectItem>
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

              {/* Quick Tips for Onboarding */}
              <Card className="bg-primary/5 border-dashed border-primary/20 rounded-3xl overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Magic Quick Start</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-3 bg-card p-3 rounded-2xl shadow-sm">
                      <Mic className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-bold">Tap (+) and <b>Speak</b>: "Spent 200 on Coffee"</p>
                    </div>
                    <div className="flex items-center gap-3 bg-card p-3 rounded-2xl shadow-sm">
                      <Camera className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-bold">Scan your <b>Bills</b> for auto-extraction</p>
                    </div>
                    <div className="flex items-center gap-3 bg-card p-3 rounded-2xl shadow-sm">
                      <Keyboard className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-bold">Type like a pro: <b>"100 for lunch"</b></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <MonthlyHistory expenses={expenses || []} />
              
              <AdBanner />

              <AddExpenseDrawer />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-headline font-black uppercase tracking-tight">{t.history}</h2>
              <SpendingChart expenses={selectedMonthExpenses} />
              <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
            </div>
          )}

          {activeTab === 'splitter' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto pb-12">
              <BillSplitTool />
            </div>
          )}
        </main>
      </div>

      {/* Navigation */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t z-50 px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <NavItem id="dashboard" icon={LayoutDashboard} label={t.dashboard} />
        <NavItem id="history" icon={History} label={t.history} />
        <NavItem id="splitter" icon={Calculator} label={t.billSplitter} />
      </div>
    </div>
  );
}
