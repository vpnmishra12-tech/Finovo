
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Trash2, Calculator, CheckCircle2, ArrowRightLeft, AlertCircle, TrendingUp, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  name: string;
  paid: number;   // Amount paid at venue (used in Custom mode)
  share: number;  // Consumption portion (used in Custom mode)
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
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Me', paid: 0, share: 0 },
    { id: '2', name: 'Friend 1', paid: 0, share: 0 }
  ]);
  const [payerId, setPayerId] = useState<string>('1');

  const billValue = parseFloat(totalBill) || 0;

  // Calculate equal share
  const calculatedEqualShare = billValue > 0 ? parseFloat((billValue / participants.length).toFixed(2)) : 0;

  const addPerson = () => {
    const newId = Date.now().toString();
    setParticipants([...participants, { id: newId, name: `Friend ${participants.length}`, paid: 0, share: 0 }]);
  };

  const removePerson = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter(p => p.id !== id));
    if (payerId === id) setPayerId(participants[0].id);
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string | number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: typeof value === 'string' ? (field === 'name' ? value : (parseFloat(value) || 0)) : value };
      }
      return p;
    }));
  };

  // Advanced calculation for Custom Mode
  const customSettlements = useMemo(() => {
    if (splitType !== 'custom' || billValue <= 0) return [];
    
    const totalPaid = participants.reduce((sum, p) => sum + p.paid, 0);
    const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
    
    if (Math.abs(totalPaid - billValue) > 1 || Math.abs(totalShares - billValue) > 1) return [];

    let balances = participants.map((p) => ({
      name: p.name.trim() || "Someone",
      balance: p.paid - p.share
    }));

    const results: Settlement[] = [];
    let debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    let creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    let dIdx = 0, cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      if (amount > 0.01) {
        results.push({ from: debtor.name, to: creditor.name, amount: parseFloat(amount.toFixed(2)) });
      }
      debtor.balance += amount;
      creditor.balance -= amount;
      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }
    return results;
  }, [participants, billValue, splitType]);

  // Simple calculation for Equal Mode
  const equalSettlements = useMemo(() => {
    if (splitType !== 'equal' || billValue <= 0) return [];
    const payer = participants.find(p => p.id === payerId);
    if (!payer) return [];

    return participants
      .filter(p => p.id !== payerId)
      .map(p => ({
        from: p.name.trim() || "Someone",
        to: payer.name.trim() || "Payer",
        amount: calculatedEqualShare
      }));
  }, [participants, billValue, splitType, payerId, calculatedEqualShare]);

  const finalSettlements = splitType === 'equal' ? equalSettlements : customSettlements;

  const handleSaveMyShare = () => {
    if (!firestore || !user?.uid) return;
    const myShare = splitType === 'equal' ? calculatedEqualShare : (participants.find(p => p.id === '1')?.share || 0);

    if (myShare <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Your share must be greater than 0" });
      return;
    }

    saveExpense(firestore, user.uid, {
      amount: myShare,
      category: 'Food',
      description: `Bill Split: ${totalBill}`,
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

        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-xl p-1 mb-6">
            <TabsTrigger value="equal" className="rounded-lg gap-2 font-bold">
              <Users className="w-4 h-4" /> {t.splitEqual}
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg gap-2 font-bold">
              <Coins className="w-4 h-4" /> {t.splitCustom}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-6 m-0">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">{t.whoPaid}</Label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger className="h-12 bg-muted border-none rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Participants</Label>
              <div className="grid gap-3">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Input 
                      value={p.name} 
                      onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                      placeholder="Name"
                      className="h-10 bg-muted/50 border-none rounded-xl font-bold px-4 flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removePerson(p.id)}
                      className="h-10 w-10 text-muted-foreground"
                      disabled={participants.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 m-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {participants.map((p) => (
                <div key={p.id} className="flex flex-col gap-3 bg-muted/30 p-4 rounded-2xl border border-primary/5">
                  <div className="flex items-center gap-3">
                    <Input 
                      value={p.name} 
                      onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                      placeholder="Name"
                      className="h-10 bg-card border-none rounded-xl font-bold px-4 flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removePerson(p.id)}
                      className="text-muted-foreground h-10 w-10 shrink-0"
                      disabled={participants.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t.personShare}</Label>
                      <Input 
                        type="number"
                        value={p.share || ""}
                        onChange={(e) => updateParticipant(p.id, 'share', e.target.value)}
                        placeholder="Share"
                        className="h-10 rounded-xl bg-card border-none font-bold text-sm text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Paid at Venue</Label>
                      <Input 
                        type="number"
                        value={p.paid || ""}
                        onChange={(e) => updateParticipant(p.id, 'paid', e.target.value)}
                        placeholder="Paid"
                        className="h-10 rounded-xl bg-card border-none font-bold text-sm text-green-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          variant="outline" 
          onClick={addPerson} 
          className="w-full h-12 rounded-2xl border-dashed border-2 gap-2 hover:bg-primary/5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          {t.addPerson}
        </Button>

        {billValue > 0 && (
          <div className="space-y-4 pt-4 border-t border-dashed">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              {t.settlement}
            </h4>
            <div className="bg-primary/5 rounded-3xl p-5 space-y-3 border border-primary/10 shadow-inner">
              {finalSettlements.length > 0 ? (
                finalSettlements.map((s, idx) => (
                  <div key={`settle-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-primary/5 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">
                      <span className="font-bold text-primary">{s.from}</span>
                      <span className="mx-1.5 text-muted-foreground font-normal">{t.owes}</span>
                      <span className="font-headline font-black text-primary mx-1">₹{s.amount.toLocaleString()}</span>
                      <span className="mx-1.5 text-muted-foreground font-normal">{t.to}</span>
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
              <span className="text-3xl font-headline font-black">₹{calculatedEqualShare.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleSaveMyShare} 
              disabled={billValue <= 0}
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
