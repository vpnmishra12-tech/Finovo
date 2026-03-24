'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Image as ImageIcon, Loader2, AlertTriangle, CheckCircle2, Search, Info, RefreshCcw, Wallet, ArrowRight } from 'lucide-react';
import { auditBill, type BillAuditOutput } from '@/ai/flows/bill-audit-flow';
import { detectSubscriptions, type SubscriptionDetectorOutput } from '@/ai/flows/subscription-detector-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Fetch recent expenses for subscription audit
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('transactionDate', 'desc'), limit(100));
  }, [firestore, user?.uid]);

  const { data: expenses } = useCollection<Expense>(expensesQuery);

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
      toast({ title: "Audit Complete", description: `Found ${result.subscriptions.length} patterns.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to scan subscriptions.' });
    } finally {
      setIsScanningSubs(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="bg-primary p-6 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight">{t.agent.title}</h1>
          </div>
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Your Personal Financial Guardian</p>
        </div>
      </div>

      <Tabs defaultValue="auditor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-2xl p-1 mb-4">
          <TabsTrigger value="auditor" className="rounded-xl uppercase text-[10px] font-black">Bill Auditor</TabsTrigger>
          <TabsTrigger value="subs" className="rounded-xl uppercase text-[10px] font-black">Sub Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="auditor" className="space-y-4 m-0">
          <Card className="border-none shadow-sm rounded-[1.5rem] bg-card overflow-hidden">
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
                  className="h-16 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/10 bg-primary text-white"
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
              <Card className={cn("border-none shadow-lg rounded-[1.5rem] overflow-hidden", auditResult.isCorrect ? "bg-green-50" : "bg-red-50")}>
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
          <Card className="border-none shadow-sm rounded-[1.5rem] bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.agent.subTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed">
                {t.agent.subDesc}
              </p>
              <Button
                onClick={handleSubAudit}
                disabled={isScanningSubs}
                className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg bg-primary text-white"
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

          {subResult && (
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
                  <Card key={i} className="border-none bg-card shadow-sm rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative">
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
          )}
        </TabsContent>
      </Tabs>

      {/* Trust Banner */}
      <div className="p-4 bg-muted/10 rounded-2xl text-center border border-border/5">
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">
          AI Powered Audit Engine v1.1
        </p>
      </div>
    </div>
  );
}
