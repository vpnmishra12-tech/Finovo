
"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  Wallet, History, Calculator, Users, LayoutGrid, Home as HomeIcon, ArrowRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Dynamic imports for performance
const AddExpenseDrawer = dynamic(() => import('@/components/expenses/add-expense-drawer').then(mod => mod.AddExpenseDrawer), { ssr: false });
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { ssr: false });
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { ssr: false });
const GroupModule = dynamic(() => import('@/components/groups/group-module').then(mod => mod.GroupModule), { ssr: false });

type NavTab = 'dashboard' | 'history' | 'splitter' | 'groups';

export default function Home() {
  const { user, loading, login, signup } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  
  // Auth Form State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#FDFBF7]">
        <Wallet className="w-10 h-10 text-primary animate-bounce" />
      </div>
    );
  }

  // 100% IMAGE MATCH GRID CARD - COMPACT STYLE
  const GridCard = ({ icon: Icon, label, color, onClick, active }: { icon: any, label: string, color: string, onClick: () => void, active?: boolean }) => (
    <Card 
      className={cn(
        "border-none shadow-sm active:scale-95 transition-all cursor-pointer rounded-[1.5rem] bg-white h-20 flex items-center overflow-hidden",
        active && "ring-2 ring-primary ring-inset"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4 w-full">
        <div className={cn("p-2.5 rounded-xl shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-headline font-black text-[11px] uppercase tracking-wider text-black leading-tight flex-1">
          {label}
        </span>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[100dvh] bg-[#FDFBF7] flex flex-col overflow-hidden text-black font-body">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#FDFBF7] animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center space-y-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="bg-primary p-6 rounded-full shadow-2xl shadow-primary/30">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-headline font-black text-black tracking-tight uppercase leading-none">FINOVO</h1>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] pt-3">
                    {isLoginView ? 'Welcome Back' : 'Create Account'}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-4">
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-16 bg-white border border-gray-100 rounded-full px-8 font-bold text-black shadow-sm focus-visible:ring-primary"
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-16 bg-white border border-gray-100 rounded-full px-8 font-bold text-black shadow-sm focus-visible:ring-primary"
                  />
                </div>
                
                <Button 
                  onClick={() => isLoginView ? login(email, password) : signup(email, password)}
                  className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 gap-3 mt-4"
                >
                  {isLoginView ? 'Login Now' : 'Sign Up Now'} <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="text-center pt-2">
                  <button 
                    onClick={() => setIsLoginView(!isLoginView)} 
                    className="text-[11px] font-black uppercase text-primary tracking-widest hover:underline"
                  >
                    {isLoginView ? 'New here? Create Account' : 'Already have an account? Login'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-6xl mx-auto px-5 py-4 space-y-4 overflow-hidden">
            {activeTab === 'dashboard' && (
              <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden">
                
                {/* Profile Header - 100% IMAGE MATCH */}
                <div className="flex items-center gap-4 shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-xl">
                    <AvatarFallback className="bg-black text-white text-2xl font-black uppercase">
                      {user.email?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Overview</span>
                    <h2 className="text-3xl font-headline font-black uppercase text-black leading-none tracking-tight">Dashboard</h2>
                  </div>
                </div>

                {/* Alert Bar - 100% IMAGE MATCH */}
                <Alert className="py-3 px-5 rounded-2xl border bg-red-50 text-red-700 border-red-100 flex items-center gap-3 shrink-0">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <AlertDescription className="text-[11px] font-black uppercase tracking-wider leading-tight">
                    ALERT: 100% BUDGET REACHED. YOU ARE OVERSPENDING!
                  </AlertDescription>
                </Alert>

                {/* Budget Summary & Feature Grid - 100% IMAGE MATCH */}
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <BudgetSummary 
                    userId={user.uid} 
                    totalSpent={expenses?.reduce((sum, e) => sum + e.amount, 0) || 0} 
                    month={new Date().getMonth()+1} 
                    year={new Date().getFullYear()} 
                  />

                  {/* Feature Grid - IMAGE MATCH BUTTONS */}
                  <div className="grid grid-cols-2 gap-4 shrink-0">
                    <GridCard 
                      icon={LayoutGrid} 
                      label="Dashboard" 
                      color="text-blue-600 bg-blue-50" 
                      onClick={() => setActiveTab('dashboard')} 
                      active={activeTab === 'dashboard'}
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
                  
                  <div className="flex-1 flex flex-col justify-end">
                    <AdBanner />
                  </div>
                </div>
                
                {/* Floating Plus Button - 100% IMAGE MATCH POSITION */}
                <div className="absolute right-6 bottom-24 z-[60]">
                  <AddExpenseDrawer />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'history' && <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />}
              {activeTab === 'splitter' && <BillSplitTool />}
              {activeTab === 'groups' && <GroupModule />}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation - 100% IMAGE MATCH */}
      {user && (
        <div className="h-20 bg-white border-t flex items-center justify-around px-4 pb-4 shadow-inner shrink-0 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1.5 transition-colors", activeTab === 'dashboard' ? "text-primary" : "text-gray-400")}>
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1.5 transition-colors", activeTab === 'history' ? "text-primary" : "text-gray-400")}>
            <History className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Bills</span>
          </button>
          <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1.5 transition-colors", activeTab === 'splitter' ? "text-primary" : "text-gray-400")}>
            <Calculator className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Split</span>
          </button>
          <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1.5 transition-colors", activeTab === 'groups' ? "text-primary" : "text-gray-400")}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Groups</span>
          </button>
        </div>
      )}
    </div>
  );
}
