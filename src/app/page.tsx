
"use client";

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  History, Calculator, Users, ArrowRight, AlertTriangle, Wallet, CheckCircle2, AlertCircle, ShieldCheck, Home as HomeIcon
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { Expense, MonthlyBudget } from '@/lib/expenses';
import { Group } from '@/lib/groups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports for sub-modules to keep main bundle light
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-3xl" /> });
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-3xl" /> });
const GroupModule = dynamic(() => import('@/components/groups/group-module').then(mod => mod.GroupModule), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-3xl" /> });
const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), { ssr: false });
const AgentModule = dynamic(() => import('@/components/agent/agent-module').then(mod => mod.AgentModule), { ssr: false, loading: () => <Skeleton className="h-[500px] w-full rounded-3xl" /> });

type NavTab = 'dashboard' | 'history' | 'splitter' | 'groups' | 'agent';

export default function Home() {
  const { user, loading, login, signup, resetPassword } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasAuthHint, setHasAuthHint] = useState(false);

  useEffect(() => {
    // Check for auth hint immediately on mount
    const hint = localStorage.getItem('finovo_auth_hint');
    if (hint === 'true') setHasAuthHint(true);
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const budgetId = `${currentYear}-${currentMonth}`;

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'monthlyBudgets', budgetId);
  }, [firestore, user?.uid, budgetId]);

  const { data: budgetData, isLoading: isBudgetLoading } = useDoc<MonthlyBudget>(budgetRef);
  
  // Logic: Show 0 (with skeleton) while loading to avoid the 5000 flicker.
  // The default 5000 is only assigned if loading is DONE and no data exists.
  const isBudgetActuallyLoading = isBudgetLoading || !user?.uid;
  const budget = budgetData?.budgetAmount ?? (isBudgetActuallyLoading ? 0 : 5000);
  const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'groups'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: userGroups } = useCollection<Group>(groupsQuery);
  const [hasUnreadGroups, setHasUnreadGroups] = useState(false);

  useEffect(() => {
    if (!userGroups) return;
    const checkUnread = () => {
      const anyUnread = userGroups.some(group => {
        if (!group.lastActivityAt) return false;
        const lastSeen = localStorage.getItem(`group_seen_${group.id}`);
        if (!lastSeen) return true;
        return group.lastActivityAt.toMillis() > parseInt(lastSeen);
      });
      setHasUnreadGroups(anyUnread);
    };
    checkUnread();
  }, [userGroups, activeTab]);

  // Shell Loading: Only show full page loader if we have NO auth hint.
  // If we have a hint, we show the app layout immediately to feel faster.
  if (loading && !hasAuthHint) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[200]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping scale-150" />
          <Wallet className="w-10 h-10 text-primary animate-pulse relative z-10" />
        </div>
        <p className="mt-8 text-[10px] font-headline font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">
          INITIALIZING CORE
        </p>
      </div>
    );
  }

  const GridCard = ({ icon: Icon, label, color, onClick, hasDot }: { icon: any, label: string, color: string, onClick: () => void, hasDot?: boolean }) => (
    <Card 
      className="border-none shadow-sm active:scale-95 transition-all cursor-pointer rounded-[1rem] bg-card h-24 flex items-center overflow-hidden relative"
      onClick={onClick}
    >
      <CardContent className="p-3.5 flex items-center gap-3.5 w-full">
        <div className={cn("p-2.5 rounded-xl shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-headline text-[11px] uppercase tracking-wider text-black font-normal leading-tight flex-1">
          {label}
        </span>
        {hasDot && (
          <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-card" />
        )}
      </CardContent>
    </Card>
  );

  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
  let alertBar = null;

  if (!isBudgetActuallyLoading || budgetData) {
    if (percentUsed >= 100 && budget > 0) {
      alertBar = (
        <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#FFF1F1] text-[#D32F2F] border-[#FFE4E4] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
            {t.alerts.exhausted}
          </AlertDescription>
        </Alert>
      );
    } else if (percentUsed >= 80 && budget > 0) {
      alertBar = (
        <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#FFF8F1] text-[#F57C00] border-[#FFEBD6] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
            {t.alerts.critical}
          </AlertDescription>
        </Alert>
      );
    } else if (percentUsed >= 50 && budget > 0) {
      alertBar = (
        <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#F1FFF1] text-[#2E7D32] border-[#E4FFE4] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
            {t.alerts.halfway}
          </AlertDescription>
        </Alert>
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden text-black font-body select-none">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        {(!user && !loading) ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-background animate-in fade-in duration-500">
            <div className="w-full max-sm flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-card p-4 rounded-full shadow-lg border border-border/50">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-headline font-black text-black tracking-tight uppercase leading-none">FINOVO</h1>
                  <p className="text-[9px] uppercase text-gray-400 font-normal tracking-[0.4em] pt-1">
                    {isLoginView ? 'Welcome Back' : 'Create Account'}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-card border border-border rounded-full px-8 text-black shadow-sm focus-visible:ring-primary font-normal"
                  />
                  <div className="space-y-1">
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-card border border-border rounded-full px-8 text-black shadow-sm focus-visible:ring-primary font-normal"
                    />
                    {isLoginView && (
                      <div className="text-right pr-4">
                        <button 
                          onClick={() => resetPassword(email)}
                          className="text-[9px] uppercase text-gray-400 tracking-widest hover:text-primary transition-colors font-normal"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => isLoginView ? login(email, password) : signup(email, password)}
                  className="w-full h-12 rounded-full uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 gap-3 font-normal"
                >
                  {isLoginView ? 'Login Now' : 'Sign Up Now'} <ArrowRight className="w-3 h-3" />
                </Button>

                <div className="text-center pt-2">
                  <button 
                    onClick={() => setIsLoginView(!isLoginView)} 
                    className="text-[9px] uppercase text-primary tracking-widest hover:underline font-normal"
                  >
                    {isLoginView ? 'New here? Create Account' : 'Already have an account? Login'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-6xl mx-auto pt-2 pb-0 overflow-hidden animate-in fade-in duration-300">
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'dashboard' ? (
                <div className="h-full overflow-y-auto no-scrollbar px-5 space-y-2 pb-2">
                  <BudgetSummary 
                    userId={user?.uid || ""} 
                    totalSpent={totalSpent} 
                    month={currentMonth} 
                    year={currentYear} 
                  />

                  {alertBar && (
                    <div className="mb-0">
                      {alertBar}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <GridCard 
                      icon={History} 
                      label="Recent History" 
                      color="text-orange-600 bg-orange-50" 
                      onClick={() => setActiveTab('history')} 
                    />
                    <GridCard 
                      icon={ShieldCheck} 
                      label="Your AI Agent" 
                      color="text-red-600 bg-red-50" 
                      onClick={() => setActiveTab('agent')} 
                    />
                    <GridCard 
                      icon={Calculator} 
                      label="Split Your Bill" 
                      color="text-purple-600 bg-purple-50" 
                      onClick={() => setActiveTab('splitter')} 
                    />
                    <GridCard 
                      icon={Users} 
                      label="Groups" 
                      color="text-green-600 bg-green-50" 
                      onClick={() => setActiveTab('groups')} 
                      hasDot={hasUnreadGroups}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto no-scrollbar pb-2 px-5">
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <div className="max-w-md mx-auto w-full">
                        <SpendingChart expenses={expenses || []} />
                      </div>
                      <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
                    </div>
                  )}
                  {activeTab === 'splitter' && <BillSplitTool />}
                  {activeTab === 'groups' && <GroupModule />}
                  {activeTab === 'agent' && <AgentModule />}
                </div>
              )}
            </div>

            <div className="mt-auto shrink-0 w-full px-0 mb-0">
              <AdBanner />
            </div>
          </div>
        )}
      </main>

      {(user || (loading && hasAuthHint)) && (
        <div className="h-16 bg-primary border-t border-white/10 flex items-center justify-around px-4 shadow-inner shrink-0 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-white" : "text-white/50")}>
            <HomeIcon className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Home</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-white" : "text-white/50")}>
            <History className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Bills</span>
          </button>
          <button onClick={() => setActiveTab('agent')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'agent' ? "text-white" : "text-white/50")}>
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Agent</span>
          </button>
          <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'splitter' ? "text-white" : "text-white/50")}>
            <Calculator className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Split</span>
          </button>
          <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1 transition-colors relative", activeTab === 'groups' ? "text-white" : "text-white/50")}>
            <Users className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Groups</span>
            {hasUnreadGroups && (
              <div className="absolute top-0 right-1 w-2 h-2 bg-red-600 rounded-full border border-primary" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
