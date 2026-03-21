"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  Wallet, LayoutDashboard, History, Calculator, Users, Plus, LayoutGrid, Home as HomeIcon, ReceiptText, CreditCard
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Dynamic imports for heavy UI components
const AddExpenseDrawer = dynamic(() => import('@/components/expenses/add-expense-drawer').then(mod => mod.AddExpenseDrawer), { ssr: false });
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { ssr: false });
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { ssr: false });
const GroupModule = dynamic(() => import('@/components/groups/group-module').then(mod => mod.GroupModule), { ssr: false });

type NavTab = 'dashboard' | 'history' | 'splitter' | 'groups';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <Wallet className="w-10 h-10 text-primary animate-bounce" />
      </div>
    );
  }

  if (!user) return null; // Auth handled by provider/redirect

  const GridCard = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => (
    <Card 
      className="border border-gray-100 shadow-sm active:scale-95 transition-all cursor-pointer rounded-[1.8rem] overflow-hidden bg-white"
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("p-2 rounded-xl", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="font-headline font-black text-[11px] uppercase tracking-widest text-black leading-none">{label}</span>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden text-black">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 flex flex-col space-y-6">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-[6px] border-white shadow-lg">
                  <AvatarFallback className="bg-black text-white text-2xl font-black">
                    {user.email?.charAt(0).toUpperCase() || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">OVERVIEW</span>
                  <h2 className="text-3xl font-headline font-black uppercase text-black leading-none tracking-tight">DASHBOARD</h2>
                </div>
              </div>

              {/* Budget Summary Section */}
              <BudgetSummary 
                userId={user.uid} 
                totalSpent={expenses?.reduce((sum, e) => sum + e.amount, 0) || 6808} 
                month={new Date().getMonth()+1} 
                year={new Date().getFullYear()} 
              />

              {/* Feature Grid Section */}
              <div className="grid grid-cols-2 gap-4">
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

              {/* Ad Space Section */}
              <div className="relative">
                <AdBanner />
                {/* Floating Plus Button - positioned relative to content in image */}
                <div className="absolute right-0 bottom-[-20px] z-20">
                  <AddExpenseDrawer />
                </div>
              </div>
              
              <div className="h-20" /> {/* Bottom spacing */}
            </div>
          )}

          {activeTab === 'history' && <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />}
          {activeTab === 'splitter' && <BillSplitTool />}
          {activeTab === 'groups' && <GroupModule />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="h-20 bg-white border-t flex items-center justify-around px-4 pb-2 shadow-inner">
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1.5", activeTab === 'dashboard' ? "text-primary" : "text-gray-400")}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">HOME</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1.5", activeTab === 'history' ? "text-primary" : "text-gray-400")}>
          <History className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">BILLS</span>
        </button>
        <button onClick={() => setActiveTab('splitter')} className={cn("flex flex-col items-center gap-1.5", activeTab === 'splitter' ? "text-primary" : "text-gray-400")}>
          <Calculator className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">SPLIT</span>
        </button>
        <button onClick={() => setActiveTab('groups')} className={cn("flex flex-col items-center gap-1.5", activeTab === 'groups' ? "text-primary" : "text-gray-400")}>
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">GROUPS</span>
        </button>
      </div>
    </div>
  );
}
