"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  Wallet, History, Calculator, Users, LayoutGrid, Home as HomeIcon, ArrowRight, Sparkles
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

  // COMPACT "PATLA" GRID CARD - Shared Style
  const GridCard = ({ icon: Icon, label, color, onClick, active }: { icon: any, label: string, color: string, onClick: () => void, active?: boolean }) => (
    <Card 
      className={cn(
        "border-none shadow-sm active:scale-95 transition-all cursor-pointer rounded-2xl overflow-hidden bg-white h-20 flex items-center",
        active && "ring-2 ring-primary ring-inset"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center gap-3 w-full">
        <div className={cn("p-2 rounded-xl shrink-0", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-headline font-black text-[10px] uppercase tracking-tight text-black leading-tight flex-1">
          {label}
        </span>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[100dvh] bg-[#FDFBF7] flex flex-col overflow-hidden text-black">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        {!user ? (
          <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-primary/10 p-5 rounded-[2rem]">
                  <Wallet className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-headline font-black text-black tracking-tight uppercase leading-none">FINOVO</h1>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] pt-2">
                    {isLoginView ? 'Welcome Back' : 'Create Account'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-muted/30 border-none rounded-full px-6 font-bold text-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-muted/30 border-none rounded-full px-6 font-bold text-black"
                  />
                </div>
                
                <Button 
                  onClick={() => isLoginView ? login(email, password) : signup(email, password)}
                  className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 gap-2 mt-4"
                >
                  {isLoginView ? 'Login Now' : 'Sign Up Now'} <ArrowRight className="w-4 h-4" />
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
          <div className="h-full flex flex-col max-w-6xl mx-auto p-5 space-y-4">
            {activeTab === 'dashboard' && (
              <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300 h-full overflow-hidden">
                
                {/* Profile Header */}
                <div className="flex items-center gap-3 shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                    <AvatarFallback className="bg-black text-white text-lg font-black uppercase">
                      {user.email?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Overview</span>
                    <h2 className="text-xl font-headline font-black uppercase text-black leading-none tracking-tight">Dashboard</h2>
                  </div>
                </div>

                {/* Budget Summary Section */}
                <div className="shrink-0">
                  <BudgetSummary 
                    userId={user.uid} 
                    totalSpent={expenses?.reduce((sum, e) => sum + e.amount, 0) || 0} 
                    month={new Date().getMonth()+1} 
                    year={new Date().getFullYear()} 
                  />
                </div>

                {/* Feature Grid - Compact "Patla" Style */}
                <div className="flex-1 grid grid-cols-2 gap-3 content-start">
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

                {/* Ad Space properly adjusted */}
                <div className="shrink-0 mt-auto pb-2">
                  <AdBanner />
                </div>
                
                {/* Floating Plus Button */}
                <div className="absolute right-6 bottom-28 z-50">
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

      {/* Bottom Navigation - Only for logged in users */}
      {user && (
        <div className="h-20 bg-white border-t flex items-center justify-around px-4 pb-4 shadow-inner shrink-0">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1", activeTab === 'dashboard' ? "text-primary" : "text-gray-400")}>
            <HomeIcon className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-primary" : "text-gray-400")}>
            <History className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Bills</span>
          </button>
          <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1", activeTab === 'splitter' ? "text-primary" : "text-gray-400")}>
            <Calculator className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Split</span>
          </button>
          <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1", activeTab === 'groups' ? "text-primary" : "text-gray-400")}>
            <Users className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Groups</span>
          </button>
        </div>
      )}
    </div>
  );
}
