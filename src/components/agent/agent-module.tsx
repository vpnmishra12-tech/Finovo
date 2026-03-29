"use client";

import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Search, Info, RefreshCcw, Wallet, Loader2, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Sparkles, ReceiptText, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { showRewardedAd } from '@/lib/ad-manager';

export function AgentModule() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanningSubs, setIsScanningSubs] = useState(false);
  const [subResult, setSubResult] = useState<any>(null);

  const [isWatchingAd, setIsWatchingAd] = useState(false);

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
    if (process.env.NEXT_PUBLIC_IS_EXPORT === 'true') {
      toast({ title: "AI Offline", description: "AI Audit is disabled in APK mode.", variant: "destructive" });
      return;
    }

    setIsWatchingAd(true);
    const granted = await showRewardedAd();
    setIsWatchingAd(false);

    if (!granted) {
      toast({ variant: 'destructive', title: 'Ad Not Finished', description: 'Please watch the full ad to use AI Audit.' });
      return;
    }

    setIsAuditing(true);
    setAuditResult(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      try {
        const actions = await import('@/ai/server-actions');
        if (!actions || !actions.auditBill) throw new Error("AI Offline");

        const result = await actions.auditBill({ billPhotoDataUri: dataUri });
        setAuditResult(result);
        toast({ title: result.isCorrect ? "Bill looks clean!" : "Errors found!" });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Offline Mode', description: 'AI features are restricted in APK builds.' });
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
    if (process.env.NEXT_PUBLIC_IS_EXPORT === 'true') {
      toast({ title: "AI Offline", description: "Subscription Scan is restricted in APK mode.", variant: "destructive" });
      return;
    }

    if (!expenses || expenses.length === 0) {
      toast({ title: "No Data", description: "Add expenses first." });
      return;
    }

    setIsWatchingAd(true);
    const granted = await showRewardedAd();
    setIsWatchingAd(false);

    if (!granted) {
      toast({ variant: 'destructive', title: 'Ad Not Finished', description: 'Please watch the full ad for free scan.' });
      return;
    }

    setIsScanningSubs(true);
    setSubResult(null);
    try {
      const actions = await import('@/ai/server-actions');
      if (!actions || !actions.detectSubscriptions) throw new Error("AI Offline");

      const result = await actions.detectSubscriptions({ 
        expenses: expenses.map(e => ({ 
          description: e.description, 
          amount: e.amount, 
          transactionDate: e.transactionDate,
          category: e.category 
        }))
      });
      setSubResult(result);
      toast({ title: "Audit Complete", description: result.subscriptions.length > 0 ? `Found ${result.subscriptions.length} leaks.` : "No leaks found." });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Offline Mode', description: 'AI features are restricted in APK builds.' });
    } finally {
      setIsScanningSubs(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-24 pt-1 px-1 min-h-full">
      <div className="bg-primary p-5 rounded-[1.5rem] text-white relative overflow-hidden shadow-lg shrink-0 h-28 flex items-center">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight leading-none">{t.agent.title}</h1>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.4em] font-bold mt-1.5">Guardian Engine v1.2</p>
          </div>
        </div>
      </div>

      {isWatchingAd && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
           <PlayCircle className="w-16 h-16 text-white animate-pulse mb-6" />
           <p className="text-white font-headline font-black text-xl uppercase tracking-widest text-center">Loading Video Ad...</p>
           <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] mt-2 text-center">Please wait for reward</p>
        </div>
      )}

      <Card className="border-none shadow-sm rounded-[1.5rem] bg-card overflow-hidden shrink-0 h-24 flex items-center">
        <CardContent className="p-5 w-full">
          {monthlyInsight ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t.agent.biggestCategory} ({monthlyInsight.monthName})</span>
                <h4 className="font-headline font-black text-xl uppercase leading-none text-primary">
                  {t.categories[monthlyInsight.category as keyof typeof t.categories] || monthlyInsight.category}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-2xl font-headline font-black text-black leading-none">₹{monthlyInsight.total.toLocaleString()}</p>
                <p className="text-[8px] font-black uppercase text-red-600 tracking-widest mt-1.5 flex items-center justify-end gap-1">
                  <TrendingUp className="w-2.5 h-2.5" /> {monthlyInsight.count} {t.agent.times}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1 justify-center opacity-30">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Awaiting spending patterns</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="auditor" className="flex flex-col gap-2">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-11 rounded-xl p-1 shrink-0">
          <TabsTrigger value="auditor" className="rounded-lg uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            {t.agent.auditorTitle}
          </TabsTrigger>
          <TabsTrigger value="subs" className="rounded-lg uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm">
            {t.agent.subTitle}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="m-0 flex flex-col gap-2 bg-transparent">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card">
            <CardContent className="p-5 py-10 space-y-4 flex flex-col items-center justify-center">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center">
                <ReceiptText className="w-7 h-7 text-primary opacity-30" />
              </div>
              <div className="w-full space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuditing || isWatchingAd}
                  className="w-full h-14 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-lg bg-primary text-white"
                >
                  {isAuditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-5 h-5" /> {t.agent.scanButton}</>}
                </Button>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center opacity-60">
                  {isAuditing ? t.agent.detecting : t.agent.auditorDesc}
                </p>
              </div>
            </CardContent>
          </Card>
          {auditResult && (
            <div className={cn("p-4 rounded-xl shadow-md animate-in fade-in zoom-in-95 flex flex-col justify-center shrink-0 mb-1", auditResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                   {auditResult.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                   {auditResult.isCorrect ? t.agent.isCorrect : t.agent.hasErrors}
                 </span>
                 <span className="font-headline font-black text-lg text-black">₹{auditResult.detectedTotal}</span>
               </div>
               <p className="text-[9px] leading-tight text-black mt-1 font-medium line-clamp-2">{auditResult.summary}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="m-0 flex flex-col gap-2 bg-transparent">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card">
            <CardContent className="p-5 py-10 space-y-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary opacity-30" />
              </div>
              <div className="w-full space-y-3">
                <div className="bg-muted/30 p-3 rounded-xl flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-tight leading-tight font-bold">
                    {t.agent.subDesc}
                  </p>
                </div>
                <Button
                  onClick={handleSubAudit}
                  disabled={isScanningSubs || isWatchingAd}
                  className="w-full h-14 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-lg bg-primary text-white"
                >
                  {isScanningSubs ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCcw className="w-5 h-5" /> {t.agent.subButton}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
          {subResult && (
            <div className="p-4 bg-primary text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in zoom-in-95 shrink-0 mb-1">
               <div>
                 <p className="text-[8px] uppercase font-black text-white/40 tracking-widest mb-1">{t.agent.foundSubs}</p>
                 <p className="text-xl font-headline font-black leading-none">{subResult.subscriptions.length}</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] uppercase font-black text-white/40 tracking-widest mb-1">{t.agent.totalDrain}</p>
                 <p className="text-xl font-headline font-black leading-none">₹{subResult.totalAnnualDrain.toLocaleString()}</p>
               </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
