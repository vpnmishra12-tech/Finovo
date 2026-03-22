"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  History, Calculator, Users, LayoutGrid, Home as HomeIcon, ArrowRight, AlertTriangle, Wallet, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Expense, MonthlyBudget } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Dynamic imports for components
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { ssr: false });
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { ssr: false });
const GroupModule = dynamic(() => import('@/components/groups/group-module').then(mod => mod.GroupModule), { ssr: false });
const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), { ssr: false });
const MonthlyHistory = dynamic(() => import('@/components/dashboard/monthly-history').then(mod => mod.MonthlyHistory), { ssr: false });

type NavTab = 'dashboard' | 'history' | 'splitter' | 'groups';

export default function Home() {
  const { user, loading, login, signup, resetPassword } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const budgetId = `${currentYear}-${currentMonth}`;

  // Fetching expenses for totals
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  // Fetching budget to compare with totals
  const budgetRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'monthlyBudgets', budgetId);
  }, [firestore, user?.uid, budgetId]);

  const { data: budgetData } = useDoc<MonthlyBudget>(budgetRef);
  const budget = budgetData?.budgetAmount || 5000;
  const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FDFBF7]">
        <Wallet className="w-10 h-10 text-primary animate-bounce" />
      </div>
    );
  }

  const GridCard = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => (
    <Card 
      className="border-none shadow-sm active:scale-95 transition-all cursor-pointer rounded-[1rem] bg-white h-24 flex items-center overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-3.5 flex items-center gap-3.5 w-full">
        <div className={cn("p-2.5 rounded-xl shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-headline text-[11px] uppercase tracking-wider text-black font-normal leading-tight flex-1">
          {label}
        </span>
      </CardContent>
    </Card>
  );

  // Alert bar logic
  const percentUsed = (totalSpent / budget) * 100;
  let alertBar = null;

  if (percentUsed >= 100) {
    alertBar = (
      <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#FFF1F1] text-[#D32F2F] border-[#FFE4E4] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
          {t.alerts.exhausted}
        </AlertDescription>
      </Alert>
    );
  } else if (percentUsed >= 80) {
    alertBar = (
      <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#FFF8F1] text-[#F57C00] border-[#FFEBD6] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
          {t.alerts.critical}
        </AlertDescription>
      </Alert>
    );
  } else if (percentUsed >= 50) {
    alertBar = (
      <Alert className="py-[0.97rem] px-3 rounded-[0.8rem] border bg-[#F1FFF1] text-[#2E7D32] border-[#E4FFE4] flex flex-row items-center gap-2 shrink-0 overflow-hidden min-h-[40px] [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg~*]:pl-0">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <AlertDescription className="text-[8px] uppercase tracking-tight font-normal leading-none">
          {t.alerts.halfway}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col overflow-hidden text-black font-body select-none">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#FDFBF7]">
            <div className="w-full max-w-sm flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Changed icon container from bg-primary to bg-white/off-white */}
                <div className="bg-white p-4 rounded-full shadow-lg border border-border/50">
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
                    className="h-12 bg-white border border-gray-100 rounded-full px-8 text-black shadow-sm focus-visible:ring-primary font-normal"
                  />
                  <div className="space-y-1">
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-white border border-gray-100 rounded-full px-8 text-black shadow-sm focus-visible:ring-primary font-normal"
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
          <div className="h-full flex flex-col max-w-6xl mx-auto pt-2 pb-0 overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'dashboard' ? (
                <div className="h-full overflow-y-auto no-scrollbar px-5 space-y-2 pb-2">
                  <BudgetSummary 
                    userId={user.uid} 
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
                      icon={LayoutGrid} 
                      label="Dashboard" 
                      color="text-blue-600 bg-blue-50" 
                      onClick={() => setActiveTab('dashboard')} 
                    />
                    <GridCard 
                      icon={History} 
                      label="Recent History" 
                      color="text-orange-600 bg-orange-50" 
                      onClick={() => setActiveTab('history')} 
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
                </div>
              )}
            </div>

            <div className="mt-auto shrink-0 w-full px-0 mb-0">
              <AdBanner />
            </div>
          </div>
        )}
      </main>

      {user && (
        <div className="h-16 bg-primary border-t border-white/10 flex items-center justify-around px-4 shadow-inner shrink-0 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-white" : "text-white/50")}>
            <HomeIcon className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Home</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-white" : "text-white/50")}>
            <History className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Bills</span>
          </button>
          <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'splitter' ? "text-white" : "text-white/50")}>
            <Calculator className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Split</span>
          </button>
          <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'groups' ? "text-white" : "text-white/50")}>
            <Users className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-widest font-normal">Groups</span>
          </button>
        </div>
      )}
    </div>
  );
}
