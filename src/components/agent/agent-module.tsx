'use client';

import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Search, Info, RefreshCcw, Wallet, Loader2, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Sparkles, ReceiptText } from 'lucide-react';
import { auditBill, type BillAuditOutput } from '@/ai/flows/bill-audit-flow';
import { detectSubscriptions, type SubscriptionDetectorOutput } from '@/ai/flows/subscription-detector-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function AgentModule() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<BillAuditOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanningSubs, setIsScanningSubs] = useState(false);
  const [subResult, setSubResult] = useState<SubscriptionDetectorOutput | null>(null);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('transactionDate', 'desc'), limit(100));
  }, [firestore, user?.uid]);

  const { data: expenses } = useCollection<Expense>(expensesQuery);

  const monthlyInsight = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    const categoryStats: Record<string, { total: number; count: number }> = {};
    expenses.forEach(exp => {
      try {
        const expDate = parseISO(exp.transactionDate);
        if (isWithinInterval(expDate, { start: lastMonthStart, end: lastMonthEnd })) {
          if (!categoryStats[exp.category]) categoryStats[exp.category] = { total: 0, count: 0 };
          categoryStats[exp.category].total += exp.amount;
          categoryStats[exp.category].count += 1;
        }
      } catch (e) {}
    });
    const categories = Object.keys(categoryStats);
    if (categories.length === 0) return null;
    let biggestCat = categories[0];
    categories.forEach(cat => {
      if (categoryStats[cat].total > categoryStats[biggestCat].total) biggestCat = cat;
    });
    return {
      category: biggestCat,
      total: categoryStats[biggestCat].total,
      count: categoryStats[biggestCat].count,
      monthName: format(lastMonth, 'MMM')
    };
  }, [expenses]);

  const handleProcessImage = async (file: File) => {
    setIsAuditing(true);
    setAuditResult(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      try {
        const result = await auditBill({ billPhotoDataUri: dataUri });
        setAuditResult(result);
        toast({ title: result.isCorrect ? "Bill looks clean!" : "Errors found!" });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Audit failed.' });
      } finally {
        setIsAuditing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImage(file);
  };

  const handleSubAudit = async () => {
    if (!expenses || expenses.length === 0) {
      toast({ title: "No Data", description: "Add expenses first." });
      return;
    }
    setIsScanningSubs(true);
    setSubResult(null);
    try {
      const result = await detectSubscriptions({ 
        expenses: expenses.map(e => ({ description: e.description, amount: e.amount, transactionDate: e.transactionDate }))
      });
      setSubResult(result);
      toast({ title: "Audit Complete", description: result.subscriptions.length > 0 ? `Found ${result.subscriptions.length} leaks.` : "No leaks found." });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Scan failed.' });
    } finally {
      setIsScanningSubs(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6 px-1 h-full overflow-hidden">
      {/* Dynamic Hero - Larger and Filling */}
      <div className="bg-primary p-6 rounded-[2rem] text-white relative overflow-hidden shadow-xl shrink-0 h-28 flex items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
        <div className="relative z-10 flex items-center gap-4 w-full">
          <div className="p-3 bg-white/20 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight leading-none">{t.agent.title}</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold mt-1.5">Financial Guardian v1.2</p>
          </div>
        </div>
      </div>

      {/* Insight Section - Expanded height */}
      <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden shrink-0 h-32 flex items-center">
        <CardContent className="p-6 w-full">
          {monthlyInsight ? (
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Biggest Spend ({monthlyInsight.monthName})</span>
                <h4 className="font-headline font-black text-2xl uppercase leading-none text-primary">
                  {t.categories[monthlyInsight.category as keyof typeof t.categories] || monthlyInsight.category}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-3xl font-headline font-black text-black leading-none">₹{monthlyInsight.total.toLocaleString()}</p>
                <p className="text-[9px] font-black uppercase text-red-600 tracking-widest mt-1.5 flex items-center justify-end gap-1">
                  <TrendingUp className="w-2.5 h-2.5" /> Used {monthlyInsight.count} Times
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-2 justify-center opacity-40">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">No major patterns found yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Tabs - Filling the remaining space */}
      <Tabs defaultValue="auditor" className="flex-1 flex flex-col gap-3 min-h-0">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-[1.5rem] p-1.5">
          <TabsTrigger value="auditor" className="rounded-xl uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            Bill Auditor
          </TabsTrigger>
          <TabsTrigger value="subs" className="rounded-xl uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            Sub Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="flex-1 m-0 flex flex-col gap-3">
          <Card className="flex-1 border-none shadow-sm rounded-[2rem] bg-card overflow-hidden flex flex-col justify-center">
            <CardContent className="p-8 space-y-6 flex flex-col items-center">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <ReceiptText className="w-10 h-10 text-primary opacity-20" />
              </div>

              <div className="w-full space-y-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuditing}
                  className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-xl bg-primary text-white transition-all active:scale-95"
                >
                  {isAuditing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Camera className="w-6 h-6" /> {t.agent.scanButton}</>}
                </Button>
                
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center leading-relaxed max-w-[200px] mx-auto opacity-60">
                  {isAuditing ? "Scanning mathematical patterns..." : "Find hidden taxes, math errors, or forced service charges."}
                </p>
              </div>
            </CardContent>
          </Card>

          {auditResult && (
            <div className={cn("p-6 rounded-[2rem] shadow-lg animate-in fade-in zoom-in-95 h-24 flex flex-col justify-center", auditResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
               <div className="flex items-center justify-between">
                 <span className="text-xs uppercase font-black tracking-widest flex items-center gap-2">
                   {auditResult.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                   {auditResult.isCorrect ? "Accurate" : "Issues Found"}
                 </span>
                 <span className="font-headline font-black text-xl text-black">₹{auditResult.detectedTotal}</span>
               </div>
               <p className="text-[10px] leading-tight text-black mt-2 font-medium">{auditResult.summary}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="flex-1 m-0 flex flex-col gap-3">
          <Card className="flex-1 border-none shadow-sm rounded-[2rem] bg-card overflow-hidden flex flex-col justify-center">
            <CardContent className="p-8 space-y-6 flex flex-col items-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="w-10 h-10 text-primary opacity-20" />
              </div>

              <div className="w-full space-y-6">
                <div className="bg-muted/30 p-4 rounded-2xl flex gap-3 items-center">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-tight leading-tight font-bold">
                    Scans your descriptions for leaks like Netflix, Spotify, or Gym.
                  </p>
                </div>
                <Button
                  onClick={handleSubAudit}
                  disabled={isScanningSubs}
                  className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-xl bg-primary text-white transition-all active:scale-95"
                >
                  {isScanningSubs ? <Loader2 className="w-6 h-6 animate-spin" /> : <><RefreshCcw className="w-6 h-6" /> {t.agent.subButton}</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {subResult && (
            <div className="p-6 bg-primary text-white rounded-[2rem] flex items-center justify-between shadow-xl animate-in fade-in zoom-in-95 h-24">
               <div>
                 <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1.5">Leaks Detected</p>
                 <p className="text-2xl font-headline font-black leading-none">{subResult.subscriptions.length} Found</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1.5">Annual Drain</p>
                 <p className="text-2xl font-headline font-black leading-none">₹{subResult.totalAnnualDrain.toLocaleString()}</p>
               </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust Banner - Filling bottom space */}
      <div className="py-4 text-center shrink-0">
        <p className="text-[8px] font-black text-primary opacity-10 uppercase tracking-[0.6em]">
          FINOVO AI CORE ENGINE v1.2
        </p>
      </div>
    </div>
  );
}
