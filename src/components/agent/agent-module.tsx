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
    <div className="flex flex-col gap-4 pb-1 pt-1 px-1 h-full">
      {/* Mini Hero */}
      <div className="bg-primary p-4 rounded-[1.5rem] text-white relative overflow-hidden shadow-lg shrink-0 h-24 flex items-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-black uppercase tracking-tight leading-none">{t.agent.title}</h1>
            <p className="text-[7px] text-white/30 uppercase tracking-[0.4em] font-bold mt-1">Guardian Engine v1.2</p>
          </div>
        </div>
      </div>

      {/* Mini Insight Card */}
      <Card className="border-none shadow-sm rounded-[1.5rem] bg-card overflow-hidden shrink-0 h-20 flex items-center">
        <CardContent className="p-4 w-full">
          {monthlyInsight ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{t.agent.biggestCategory} ({monthlyInsight.monthName})</span>
                <h4 className="font-headline font-black text-lg uppercase leading-none text-primary">
                  {t.categories[monthlyInsight.category as keyof typeof t.categories] || monthlyInsight.category}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-xl font-headline font-black text-black leading-none">₹{monthlyInsight.total.toLocaleString()}</p>
                <p className="text-[7px] font-black uppercase text-red-600 tracking-widest mt-1 flex items-center justify-end gap-1">
                  <TrendingUp className="w-2 h-2" /> {monthlyInsight.count} {t.agent.times}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1 justify-center opacity-30">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Awaiting spending patterns</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact Action Tabs */}
      <Tabs defaultValue="auditor" className="flex-1 flex flex-col gap-2 min-h-0">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-10 rounded-xl p-1 shrink-0">
          <TabsTrigger value="auditor" className="rounded-lg uppercase text-[9px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            {t.agent.auditorTitle}
          </TabsTrigger>
          <TabsTrigger value="subs" className="rounded-lg uppercase text-[9px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            {t.agent.subTitle}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="flex-1 m-0 flex flex-col gap-2 bg-transparent">
          <Card className="flex-1 border-none shadow-sm rounded-[2rem] bg-card flex flex-col justify-center">
            <CardContent className="p-4 space-y-4 flex flex-col items-center justify-center h-full">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              
              <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                <ReceiptText className="w-6 h-6 text-primary opacity-30" />
              </div>

              <div className="w-full space-y-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuditing}
                  className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 shadow-lg bg-primary text-white"
                >
                  {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" /> {t.agent.scanButton}</>}
                </Button>
                
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground text-center opacity-60">
                  {isAuditing ? t.agent.detecting : t.agent.auditorDesc}
                </p>
              </div>
            </CardContent>
          </Card>

          {auditResult && (
            <div className={cn("p-3 rounded-xl shadow-md animate-in fade-in zoom-in-95 h-16 flex flex-col justify-center shrink-0 mb-0", auditResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
               <div className="flex items-center justify-between">
                 <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5">
                   {auditResult.isCorrect ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-red-600" />}
                   {auditResult.isCorrect ? t.agent.isCorrect : t.agent.hasErrors}
                 </span>
                 <span className="font-headline font-black text-base text-black">₹{auditResult.detectedTotal}</span>
               </div>
               <p className="text-[8px] leading-tight text-black mt-1 font-medium line-clamp-1">{auditResult.summary}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="flex-1 m-0 flex flex-col gap-2 bg-transparent">
          <Card className="flex-1 border-none shadow-sm rounded-[2rem] bg-card flex flex-col justify-center">
            <CardContent className="p-4 space-y-4 flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary opacity-30" />
              </div>

              <div className="w-full space-y-3">
                <div className="bg-muted/30 p-2.5 rounded-xl flex gap-2 items-center">
                  <AlertCircle className="w-3 h-3 text-primary shrink-0" />
                  <p className="text-[8px] text-muted-foreground uppercase tracking-tight leading-tight font-bold">
                    {t.agent.subDesc}
                  </p>
                </div>
                <Button
                  onClick={handleSubAudit}
                  disabled={isScanningSubs}
                  className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 shadow-lg bg-primary text-white"
                >
                  {isScanningSubs ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCcw className="w-4 h-4" /> {t.agent.subButton}</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {subResult && (
            <div className="p-3 bg-primary text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in zoom-in-95 h-16 shrink-0 mb-0">
               <div>
                 <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-0.5">{t.agent.foundSubs}</p>
                 <p className="text-lg font-headline font-black leading-none">{subResult.subscriptions.length}</p>
               </div>
               <div className="text-right">
                 <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-0.5">{t.agent.totalDrain}</p>
                 <p className="text-lg font-headline font-black leading-none">₹{subResult.totalAnnualDrain.toLocaleString()}</p>
               </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust Banner - Perfectly touching ads line */}
      <div className="pb-0 pt-0 text-center shrink-0">
        <p className="text-[7px] font-black text-primary opacity-10 uppercase tracking-[0.5em]">
          FINOVO AI CORE v1.2
        </p>
      </div>
    </div>
  );
}
