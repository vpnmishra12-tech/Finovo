"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  Wallet, History, Calculator, Users, LayoutGrid, Home as HomeIcon, ArrowRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Dynamic imports for heavy UI components
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

  // Auth UI - REPRODUCING THE IMAGE 100%
  if (!user) {
    return (
      <div className="h-[100dvh] bg-[#FDFBF7] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-10 animate-in fade-in duration-500 flex flex-col items-center">
          
          {/* Top Blue Icon Circle */}
          <div className="bg-[#2563EB] p-8 rounded-full shadow-2xl flex items-center justify-center -mt-10">
            <Wallet className="w-14 h-14 text-white fill-white" />
          </div>

          {/* Headings */}
          <div className="flex flex-col items-center text-center space-y-2 w-full pt-4">
            <h1 className="text-6xl font-headline font-black text-black tracking-tight uppercase">FINOVO</h1>
            <p className="text-[12px] font-black uppercase text-gray-400 tracking-[0.4em] pt-2">
              {isLoginView ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-8 w-full pt-4">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-gray-400 ml-6 tracking-widest">EMAIL ADDRESS</Label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-20 bg-white border-gray-100 rounded-[2.5rem] px-10 font-bold text-xl text-black shadow-sm focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-gray-400 ml-6 tracking-widest">PASSWORD</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="h-20 bg-white border-gray-100 rounded-[2.5rem] px-10 font-bold text-xl text-black shadow-sm focus-visible:ring-primary"
              />
            </div>
            
            {/* Action Button */}
            <Button 
              onClick={() => isLoginView ? login(email, password) : signup(email, password)}
              className="w-full h-24 rounded-[4rem] font-black uppercase tracking-widest text-xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] gap-4 bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <ArrowRight className="w-7 h-7" /> {isLoginView ? 'LOGIN NOW' : 'SIGN UP NOW'}
            </Button>

            {/* Toggle View */}
            <div className="text-center pt-6">
              <button 
                onClick={() => setIsLoginView(!isLoginView)} 
                className="text-[12px] font-black uppercase text-primary tracking-widest hover:underline"
              >
                {isLoginView ? 'NEW HERE? CREATE ACCOUNT' : 'ALREADY HAVE AN ACCOUNT? LOGIN'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Item Card - Compact "Patla" like Spent cards
  const GridCard = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => (
    <Card 
      className="border-none shadow-sm active:scale-95 transition-all cursor-pointer rounded-2xl overflow-hidden bg-white h-24 flex items-center"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3 w-full">
        <div className={cn("p-2.5 rounded-xl shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-headline font-black text-[11px] uppercase tracking-tighter text-black leading-tight flex-1">{label}</span>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[100dvh] bg-[#FDFBF7] flex flex-col overflow-hidden text-black">
      <Header />
      
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full flex flex-col max-w-6xl mx-auto p-5 space-y-4">
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300 h-full">
              
              {/* Profile Header - TOP LEFT */}
              <div className="flex items-center gap-3 shrink-0">
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                  <AvatarFallback className="bg-black text-white text-xl font-black uppercase">
                    {user.email?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">OVERVIEW</span>
                  <h2 className="text-2xl font-headline font-black uppercase text-black leading-none tracking-tight">DASHBOARD</h2>
                </div>
              </div>

              {/* Budget Summary Section (Top) */}
              <div className="shrink-0">
                <BudgetSummary 
                  userId={user.uid} 
                  totalSpent={expenses?.reduce((sum, e) => sum + e.amount, 0) || 0} 
                  month={new Date().getMonth()+1} 
                  year={new Date().getFullYear()} 
                />
              </div>

              {/* Feature Grid Section (Middle - Compact like Spent cards) */}
              <div className="flex-1 grid grid-cols-2 gap-3 content-start">
                <GridCard 
                  icon={LayoutGrid} 
                  label="DASHBOARD" 
                  color="text-blue-600 bg-blue-50" 
                  onClick={() => setActiveTab('dashboard')} 
                />
                <GridCard 
                  icon={History} 
                  label="RECENT HISTORY" 
                  color="text-orange-600 bg-orange-50" 
                  onClick={() => setActiveTab('history')} 
                />
                <GridCard 
                  icon={Calculator} 
                  label="SPLIT YOUR BILL" 
                  color="text-purple-600 bg-purple-50" 
                  onClick={() => setActiveTab('splitter')} 
                />
                <GridCard 
                  icon={Users} 
                  label="GROUPS" 
                  color="text-green-600 bg-green-50" 
                  onClick={() => setActiveTab('groups')} 
                />
              </div>

              {/* Ad Space Section (Bottom - Compact & Properly Repositioned) */}
              <div className="shrink-0 mt-auto pb-4">
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
      </main>

      {/* Bottom Navigation */}
      <div className="h-20 bg-white border-t flex items-center justify-around px-4 pb-4 shadow-inner shrink-0">
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1", activeTab === 'dashboard' ? "text-primary" : "text-gray-400")}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">HOME</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-primary" : "text-gray-400")}>
          <History className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">BILLS</span>
        </button>
        <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1", activeTab === 'splitter' ? "text-primary" : "text-gray-400")}>
          <Calculator className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">SPLIT</span>
        </button>
        <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1", activeTab === 'groups' ? "text-primary" : "text-gray-400")}>
          <Users className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">GROUPS</span>
        </button>
      </div>
    </div>
  );
}
