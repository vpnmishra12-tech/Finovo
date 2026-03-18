
"use client";

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useFirestore } from '@/firebase';
import { saveExpense } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Trash2, Calculator, CheckCircle2, ArrowRightLeft, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  name: string;
  share: number; // What they should pay (consumption)
  paid: number;  // What they actually paid at the venue
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function BillSplitTool() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [totalBill, setTotalBill] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Me', share: 0, paid: 0 },
    { id: '2', name: 'Friend 1', share: 0, paid: 0 }
  ]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  const billValue = parseFloat(totalBill) || 0;

  // Calculate equal share if in equal mode
  const equalShare = useMemo(() => {
    return billValue > 0 ? parseFloat((billValue / participants.length).toFixed(2)) : 0;
  }, [billValue, participants.length]);

  const addPerson = () => {
    const newId = Date.now().toString();
    setParticipants([...participants, { id: newId, name: `Friend ${participants.length}`, share: 0, paid: 0 }]);
  };

  const removePerson = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string | number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: typeof value === 'string' ? (parseFloat(value) || 0) : value };
      }
      return p;
    }));
  };

  // Logic to calculate who pays whom
  const settlements = useMemo(() => {
    if (billValue <= 0) return [];

    // 1. Determine actual shares for everyone
    const currentParticipants = participants.map(p => ({
      ...p,
      actualShare: splitMode === 'equal' ? equalShare : p.share
    }));

    // 2. Calculate Balance (Paid - Share)
    // Positive means they are owed money, Negative means they owe money
    let balances = currentParticipants.map(p => ({
      name: p.name,
      balance: p.paid - p.actualShare
    }));

    const results: Settlement[] = [];
    let debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    let creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      if (amount > 0) {
        results.push({
          from: debtor.name,
          to: creditor.name,
          amount: parseFloat(amount.toFixed(2))
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }

    return results;
  }, [participants, billValue, splitMode, equalShare]);

  const totalPaidAtVenue = participants.reduce((sum, p) => sum + p.paid, 0);
  const totalAssignedShare = splitMode === 'equal' ? billValue : participants.reduce((sum, p) => sum + p.share, 0);
  
  const isPaidValid = Math.abs(totalPaidAtVenue - billValue) < 0.1;
  const isShareValid = Math.abs(totalAssignedShare - billValue) < 0.1;

  const handleSaveShare = () => {
    if (!firestore || !user?.uid) return;
    
    const myParticipant = participants.find(p => p.id === '1');
    const myShare = splitMode === 'equal' ? equalShare : (myParticipant?.share || 0);

    if (myShare <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Share must be greater than 0" });
      return;
    }

    saveExpense(firestore, user.uid, {
      amount: myShare,
      category: 'Food',
      description: description || `Bill Split: ${totalBill}`,
      transactionDate: new Date().toISOString().split('T')[0],
      captureMethod: 'Text',
    });

    toast({ title: "Success", description: "Your share saved to expenses!" });
  };

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden rounded-3xl">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-xl font-headline font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          {t.splitTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">{t.totalAmount}</Label>
          <Input 
            type="number" 
            placeholder="0.00" 
            value={totalBill} 
            onChange={(e) => setTotalBill(e.target.value)}
            className="h-14 rounded-2xl bg-muted border-none font-headline font-bold text-2xl text-primary"
          />
        </div>

        <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl p-1 h-12 mb-6">
            <TabsTrigger value="equal" className="rounded-lg font-bold">{t.splitEqual}</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg font-bold">{t.splitCustom}</TabsTrigger>
          </TabsList>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.map((p, idx) => (
              <div key={p.id} className="flex flex-col gap-4 bg-muted/30 p-5 rounded-3xl border border-transparent hover:border-primary/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <Input 
                    value={p.name} 
                    onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                    placeholder="Name"
                    className="h-8 bg-transparent border-none font-bold p-0 focus-visible:ring-0 text-base"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removePerson(p.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 ml-auto"
                    disabled={participants.length <= 2}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> {t.personShare}
                    </Label>
                    {splitMode === 'custom' ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                        <Input 
                          type="number"
                          value={p.share || ""}
                          onChange={(e) => updateParticipant(p.id, 'share', e.target.value)}
                          placeholder="0"
                          className="h-10 pl-7 rounded-xl bg-card border-none font-bold text-sm"
                        />
                      </div>
                    ) : (
                      <div className="h-10 flex items-center font-bold text-primary px-1">
                        ₹{equalShare.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" /> {t.modes.camera === "Camera" ? "Paid at Venue" : "वहाँ दिया"}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                      <Input 
                        type="number"
                        value={p.paid || ""}
                        onChange={(e) => updateParticipant(p.id, 'paid', e.target.value)}
                        placeholder="0"
                        className="h-10 pl-7 rounded-xl bg-card border-none font-bold text-sm text-green-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addPerson} 
            className="w-full mt-6 h-12 rounded-2xl border-dashed border-2 gap-2 hover:bg-primary/5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {t.addPerson}
          </Button>

          {/* Validation Messages */}
          <div className="mt-6 space-y-2">
            {!isPaidValid && billValue > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] font-bold text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Payments (₹{totalPaidAtVenue}) must match Bill (₹{billValue})
              </div>
            )}
            {!isShareValid && splitMode === 'custom' && billValue > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-[11px] font-bold text-destructive">
                <AlertCircle className="w-4 h-4" />
                Shares (₹{totalAssignedShare}) must match Bill (₹{billValue})
              </div>
            )}
          </div>
        </Tabs>

        {/* Settlement Summary Section */}
        {billValue > 0 && isPaidValid && isShareValid && (
          <div className="space-y-4 pt-4 border-t border-dashed">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              {t.settlement}
            </h4>
            <div className="bg-primary/5 rounded-3xl p-5 space-y-3 border border-primary/10 shadow-inner">
              {settlements.length > 0 ? (
                settlements.map((s, idx) => (
                  <div key={`settle-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-primary/5 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">
                      <span className="font-bold text-primary">{s.from}</span>
                      <span className="mx-1.5 text-muted-foreground lowercase">{t.owes}</span>
                      <span className="font-headline font-black text-primary mx-1">₹{s.amount.toLocaleString()}</span>
                      <span className="mx-1.5 text-muted-foreground lowercase">{t.to}</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{s.to}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm font-medium">{t.noPayment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-6">
          <div className="flex items-center justify-between p-6 bg-primary rounded-[2rem] text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.yourShare}</span>
              <span className="text-3xl font-headline font-black">
                ₹{(splitMode === 'equal' ? equalShare : (participants.find(p => p.id === '1')?.share || 0)).toLocaleString()}
              </span>
            </div>
            <Button 
              onClick={handleSaveShare} 
              disabled={billValue <= 0 || !isPaidValid || !isShareValid}
              className="rounded-2xl h-14 px-8 bg-white text-primary hover:bg-white/90 font-black gap-2 shadow-xl relative z-10"
            >
              <CheckCircle2 className="w-5 h-5" />
              {t.saveMyShare}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
