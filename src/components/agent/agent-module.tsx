
'use client';

import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Fetch recent expenses for analysis
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('transactionDate', 'desc'), limit(100));
  }, [firestore, user?.uid]);

  const { data: expenses } = useCollection<Expense>(expensesQuery);

  // Calculate Monthly Insight (Biggest category expense from last month)
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
          if (!categoryStats[exp.category]) {
            categoryStats[exp.category] = { total: 0, count: 0 };
          }
          categoryStats[exp.category].total += exp.amount;
          categoryStats[exp.category].count += 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    const categories = Object.keys(categoryStats);
    if (categories.length === 0) return null;

    let biggestCat = categories[0];
    categories.forEach(cat => {
      if (categoryStats[cat].total > categoryStats[biggestCat].total) {
        biggestCat = cat;
      }
    });

    return {
      category: biggestCat,
      total: categoryStats[biggestCat].total,
      count: categoryStats[biggestCat].count,
      monthName: format(lastMonth, 'MMMM')
    };
  }, [expenses]);

  const handleProcessImage = async (file: File) => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        try {
          const result = await auditBill({ billPhotoDataUri: dataUri });
          setAuditResult(result);
          toast({ title: result.isCorrect ? "Bill looks clean!" : "Errors found in bill!" });
        } catch (err) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to audit bill.' });
        } finally {
          setIsAuditing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsAuditing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImage(file);
  };

  const handleSubAudit = async () => {
    if (!expenses || expenses.length === 0) {
      toast({ title: "No Data", description: "Add some expenses first to scan patterns." });
      return;
    }

    setIsScanningSubs(true);
    setSubResult(null);
    try {
      const result = await detectSubscriptions({ 
        expenses: expenses.map(e => ({
          description: e.description,
          amount: e.amount,
          transactionDate: e.transactionDate
        }))
      });
      setSubResult(result);
      if (result.subscriptions.length === 0) {
        toast({ title: "Audit Complete", description: "No subscription leaks detected yet." });
      } else {
        toast({ title: "Audit Complete", description: `Found ${result.subscriptions.length} recurring leaks.` });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to scan subscriptions.' });
    } finally {
      setIsScanningSubs(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar h-full">
      {/* Hero Section */}
      <div className="bg-primary p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight leading-none">{t.agent.title}</h1>
          </div>
          <p className="text-[9px] text-white/50 uppercase tracking-[0.3em] font-bold">Your Ultimate Financial Guardian</p>
        </div>
      </div>

      {/* Monthly Insight Section - ALWAYS VISIBLE */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden animate-in zoom-in-95 duration-500">
        <CardHeader className="pb-2 pt-5 px-6">
          <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> {t.agent.biggestExpenseTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {monthlyInsight ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t.agent.biggestCategory}</p>
                  <h4 className="font-headline font-black text-2xl uppercase leading-tight text-primary">
                    {t.categories[monthlyInsight.category as keyof typeof t.categories] || monthlyInsight.category}
                  </h4>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mt-1 tracking-tight">Period: {monthlyInsight.monthName}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-headline font-black text-black leading-none">₹{monthlyInsight.total.toLocaleString()}</p>
                  <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mt-1">
                    Used {monthlyInsight.count} {t.agent.times}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  Tip: You visited this category {monthlyInsight.count} times. Breaking it down might save you more!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.agent.noExpensesLastMonth}</p>
                <p className="text-[9px] text-muted-foreground max-w-[200px] leading-relaxed">
                  Add some expenses for last month so I can analyze your spending habits!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="auditor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-2xl p-1 mb-4">
          <TabsTrigger value="auditor" className="rounded-xl uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary">
            Bill Auditor
          </TabsTrigger>
          <TabsTrigger value="subs" className="rounded-xl uppercase text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-primary">
            Sub Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="space-y-4 m-0">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.agent.auditorTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={onFileChange}
              />
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuditing}
                  className="h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/10 bg-primary text-white"
                >
                  {isAuditing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <><Camera className="w-6 h-6" /> {t.agent.scanButton}</>
                  )}
                </Button>
              </div>

              {isAuditing && (
                <div className="flex flex-col items-center justify-center py-4 gap-2 animate-pulse">
                  <Search className="w-8 h-8 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agent.detecting}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {auditResult && (
            <div className="animate-in zoom-in-95 duration-300">
              <Card className={cn("border-none shadow-lg rounded-[2rem] overflow-hidden", auditResult.isCorrect ? "bg-green-50" : "bg-red-50")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    {auditResult.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                    )}
                    {auditResult.isCorrect ? t.agent.isCorrect : t.agent.hasErrors}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/80 p-4 rounded-2xl border border-border/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-dashed border-border pb-2">
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Calculated Total</span>
                      <span className="text-xl font-headline font-black text-black">₹{auditResult.detectedTotal}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <Info className="w-3 h-3" /> {t.agent.summary}
                      </p>
                      <p className="text-[11px] leading-relaxed text-black font-medium">{auditResult.summary}</p>
                    </div>
                  </div>
                  {!auditResult.isCorrect && (
                    <div className="p-4 bg-primary text-white rounded-2xl space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{t.agent.advice}</p>
                      <p className="text-[11px] font-bold italic leading-tight">"{auditResult.suggestedAction}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="space-y-4 m-0">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.agent.subTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed font-medium">
                  {t.agent.howItWorks}
                </p>
              </div>
              <Button
                onClick={handleSubAudit}
                disabled={isScanningSubs}
                className="w-full h-14 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg bg-primary text-white"
              >
                {isScanningSubs ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><RefreshCcw className="w-5 h-5" /> {t.agent.subButton}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {isScanningSubs && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Search className="w-10 h-10 text-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agent.scanning}</p>
            </div>
          )}

          {subResult && subResult.subscriptions.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-red-50 border-none rounded-2xl p-4">
                  <p className="text-[8px] uppercase font-black text-red-600 tracking-widest mb-1">{t.agent.foundSubs}</p>
                  <p className="text-2xl font-headline font-black text-black">{subResult.subscriptions.length}</p>
                </Card>
                <Card className="bg-primary p-4 border-none rounded-2xl">
                  <p className="text-[8px] uppercase font-black text-white/60 tracking-widest mb-1">{t.agent.totalDrain}</p>
                  <p className="text-xl font-headline font-black text-white">₹{subResult.totalAnnualDrain.toLocaleString()}</p>
                </Card>
              </div>

              <div className="space-y-2">
                {subResult.subscriptions.map((sub, i) => (
                  <Card key={i} className="border-none bg-card shadow-sm rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative border border-border/10">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-tight">{sub.name}</h4>
                        <p className="text-[9px] text-muted-foreground uppercase">{sub.frequency} • {sub.reason}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="font-headline font-black text-lg">₹{sub.amount}</p>
                      <p className="text-[8px] text-red-500 uppercase font-black">Auto Drain</p>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="border-none bg-muted/30 p-4 rounded-2xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Agent Advice</p>
                    <p className="text-[11px] leading-tight text-black font-medium">{subResult.summary}</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : subResult && (
             <div className="text-center py-10 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.agent.noSubs}</p>
             </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust Banner */}
      <div className="py-4 text-center opacity-30">
        <p className="text-[8px] font-black text-primary uppercase tracking-[0.5em]">
          FINOVO AI CORE ENGINE v1.2
        </p>
      </div>
    </div>
  );
}
