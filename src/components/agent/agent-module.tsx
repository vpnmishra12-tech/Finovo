'use client';

import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Search, Info, RefreshCcw, Wallet, Loader2, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col gap-2 pb-24 px-1 max-h-screen overflow-hidden">
      {/* Mini Hero */}
      <div className="bg-primary p-4 rounded-3xl text-white relative overflow-hidden shadow-lg shrink-0 h-20 flex items-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
        <div className="relative z-10 flex items-center gap-3 w-full">
          <div className="p-2 bg-white/20 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-black uppercase tracking-tight leading-none">{t.agent.title}</h1>
            <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Financial Guardian v1.2</p>
          </div>
        </div>
      </div>

      {/* Compact Insight Row */}
      <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden shrink-0">
        <CardContent className="p-4">
          {monthlyInsight ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Biggest Spend ({monthlyInsight.monthName})</span>
                <h4 className="font-headline font-black text-lg uppercase leading-none text-primary">
                  {t.categories[monthlyInsight.category as keyof typeof t.categories] || monthlyInsight.category}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-2xl font-headline font-black text-black leading-none">₹{monthlyInsight.total.toLocaleString()}</p>
                <p className="text-[8px] font-black uppercase text-red-600 tracking-widest mt-0.5">
                  Used {monthlyInsight.count} Times
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground/30" />
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">No data for last month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Tabs - Compact */}
      <Tabs defaultValue="auditor" className="w-full shrink-0">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-10 rounded-2xl p-1 mb-2">
          <TabsTrigger value="auditor" className="rounded-xl uppercase text-[9px] font-black data-[state=active]:bg-white data-[state=active]:text-primary">
            Bill Auditor
          </TabsTrigger>
          <TabsTrigger value="subs" className="rounded-xl uppercase text-[9px] font-black data-[state=active]:bg-white data-[state=active]:text-primary">
            Sub Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="space-y-2 m-0">
          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuditing}
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-xl bg-primary text-white"
                >
                  {isAuditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-5 h-5" /> {t.agent.scanButton}</>}
                </Button>
                
                {isAuditing && (
                   <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Receipt...</p>
                )}
                
                {!isAuditing && !auditResult && (
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50 text-center leading-tight">
                    Scan any bill to find math errors or hidden charges automatically
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {auditResult && (
            <div className={cn("p-4 rounded-3xl shadow-lg animate-in fade-in zoom-in-95", auditResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                   {auditResult.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                   {auditResult.isCorrect ? "Accurate" : "Issues Found"}
                 </span>
                 <span className="font-headline font-black text-black">₹{auditResult.detectedTotal}</span>
               </div>
               <p className="text-[10px] leading-tight text-black opacity-80 line-clamp-2">{auditResult.summary}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="space-y-2 m-0">
          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="bg-muted/30 p-3 rounded-2xl flex gap-3 items-center">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[8px] text-muted-foreground uppercase tracking-tight leading-tight font-medium">
                  AI scans your patterns to find hidden monthly subscription leaks.
                </p>
              </div>
              <Button
                onClick={handleSubAudit}
                disabled={isScanningSubs}
                className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg bg-primary text-white"
              >
                {isScanningSubs ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCcw className="w-5 h-5" /> {t.agent.subButton}</>}
              </Button>
            </CardContent>
          </Card>

          {subResult && (
            <div className="p-4 bg-primary text-white rounded-3xl flex items-center justify-between shadow-lg animate-in fade-in zoom-in-95">
               <div>
                 <p className="text-[8px] uppercase font-black text-white/50 tracking-widest mb-1">Leaks Detected</p>
                 <p className="text-xl font-headline font-black leading-none">{subResult.subscriptions.length} Found</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] uppercase font-black text-white/50 tracking-widest mb-1">Annual Drain</p>
                 <p className="text-xl font-headline font-black leading-none">₹{subResult.totalAnnualDrain.toLocaleString()}</p>
               </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust Banner - Compact */}
      <div className="py-4 text-center opacity-20 shrink-0">
        <p className="text-[7px] font-black text-primary uppercase tracking-[0.5em]">
          FINOVO AI CORE ENGINE v1.2
        </p>
      </div>
    </div>
  );
}
