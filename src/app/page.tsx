"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { AdBanner } from '@/components/dashboard/ad-banner';
import { 
  Loader2, Wallet, LayoutDashboard, History, Calculator, Users, 
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Optimized dynamic imports
const AddExpenseDrawer = dynamic(() => import('@/components/expenses/add-expense-drawer').then(mod => mod.AddExpenseDrawer), {
  ssr: false,
  loading: () => null
});
const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), { 
  ssr: false,
  loading: () => <div className="h-[120px] w-full bg-muted/20 animate-pulse rounded-2xl" />
});
const BillSplitTool = dynamic(() => import('@/components/bill-split/bill-split-tool').then(mod => mod.BillSplitTool), { 
  ssr: false 
});
const ExpenseList = dynamic(() => import('@/components/expenses/expense-list').then(mod => mod.ExpenseList), { 
  ssr: false 
});
const GroupModule = dynamic(() => import('@/components/groups/group-module').then(mod => mod.GroupModule), { 
  ssr: false 
});

type NavTab = 'dashboard' | 'history' | 'splitter' | 'groups';

export default function Home() {
  const { user, loading, login, signup } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(50)
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
          <div className="bg-primary/10 p-4 rounded-3xl">
            <Wallet className="w-10 h-10 text-primary animate-bounce" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black animate-pulse">Finovo Loading...</p>
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
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Wallet className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-3xl font-headline font-black tracking-tight text-black">Finovo <span className="text-primary">Business</span></h1>
            <p className="text-sm text-black/60 font-medium max-w-xs mx-auto mt-2">Professional Grade Expense Tracking for Everyone.</p>
            
            <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] overflow-hidden bg-card mt-8">
              <CardContent className="p-0">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-card rounded-none h-full font-black text-xs uppercase tracking-widest text-black">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-card rounded-none h-full font-black text-xs uppercase tracking-widest text-black">Sign Up</TabsTrigger>
                  </TabsList>
                  <div className="p-8 space-y-4">
                    <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted border-none font-bold text-black" />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-muted border-none font-bold text-black" />
                    <Button onClick={handleLogin} className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-black text-white hover:bg-black/90">
                      {isAuthLoading ? <Loader2 className="animate-spin" /> : "Proceed"}
                    </Button>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const NavItem = ({ id, icon: Icon, label, active }: { id: NavTab, icon: any, label: string, active?: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all",
        active ? "text-primary scale-110" : "text-black/40"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );

  const GridCard = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => (
    <Card 
      className="border-2 border-primary/5 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer rounded-2xl overflow-hidden group bg-card h-full"
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center gap-3 h-full">
        <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-headline font-black text-[10px] uppercase tracking-widest text-black whitespace-nowrap">{label}</span>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden text-black">
      <Header />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto p-4 flex flex-col space-y-4">
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden">
              {/* Profile - Top Left Initial */}
              <div className="flex items-center gap-3 shrink-0">
                <Avatar className="h-12 w-12 border-4 border-primary/10 shadow-md">
                  <AvatarFallback className="bg-black text-white text-lg font-black">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-black/40 tracking-[0.3em]">Overview</span>
                  <h2 className="text-xl font-headline font-black uppercase text-black leading-none">Dashboard</h2>
                </div>
              </div>

              {/* Budget Summary - TOP (COMPACT) */}
              <div className="shrink-0">
                <BudgetSummary 
                  userId={user.uid} 
                  totalSpent={expenses?.reduce((sum, e) => sum + e.amount, 0) || 0} 
                  month={new Date().getMonth()+1} 
                  year={new Date().getFullYear()} 
                />
              </div>

              {/* Feature Grid - MIDDLE (COMPACT THIN CARDS) */}
              <div className="shrink-0 grid grid-cols-2 gap-3">
                <GridCard 
                  icon={LayoutDashboard} 
                  label={t.dashboard} 
                  color="bg-blue-500/10 text-blue-600" 
                  onClick={() => setActiveTab('dashboard')} 
                />
                <GridCard 
                  icon={History} 
                  label={t.history} 
                  color="bg-orange-500/10 text-orange-600" 
                  onClick={() => setActiveTab('history')} 
                />
                <GridCard 
                  icon={Calculator} 
                  label={t.billSplitter} 
                  color="bg-purple-500/10 text-purple-600" 
                  onClick={() => setActiveTab('splitter')} 
                />
                <GridCard 
                  icon={Users} 
                  label={t.groups} 
                  color="bg-green-500/10 text-green-600" 
                  onClick={() => setActiveTab('groups')} 
                />
              </div>

              {/* Ad Space - BOTTOM (PUSHED UP SLIGHTLY) */}
              <div className="mt-auto pb-4 shrink-0">
                <AdBanner />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
              <SpendingChart expenses={expenses || []} />
              <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
            </div>
          )}

          {activeTab === 'splitter' && (
            <div className="flex-1 overflow-y-auto animate-in slide-in-from-bottom-4 duration-500">
              <BillSplitTool />
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="flex-1 overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
              <GroupModule />
            </div>
          )}
        </div>
      </main>

      {/* Show Add Expense Drawer only on Dashboard */}
      {activeTab === 'dashboard' && <AddExpenseDrawer />}

      {/* Modern Bottom Navigation */}
      <div className="shrink-0 h-18 bg-card border-t z-50 px-8 pb-2 flex items-center justify-between shadow-[0_-12px_32px_rgba(0,0,0,0.08)]">
        <NavItem id="dashboard" icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} />
        <NavItem id="history" icon={History} label="Bills" active={activeTab === 'history'} />
        <NavItem id="splitter" icon={Calculator} label="Split" active={activeTab === 'splitter'} />
        <NavItem id="groups" icon={Users} label="Groups" active={activeTab === 'groups'} />
      </div>
    </div>
  );
}
