
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
import { Users, UserPlus, Trash2, Calculator, CheckCircle2, ArrowRightLeft, Coins, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Participant {
  id: string;
  name: string;
  paid: number;   // Amount paid at venue
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

  // Separate states for Equal Split
  const [equalParticipants, setEqualParticipants] = useState<Participant[]>([
    { id: 'e1', name: '', paid: 0 },
    { id: 'e2', name: '', paid: 0 }
  ]);
  const [equalPayerId, setEqualPayerId] = useState<string>('e1');

  // Separate states for Custom Split
  const [customParticipants, setCustomParticipants] = useState<Participant[]>([
    { id: 'c1', name: '', paid: 0 },
    { id: 'c2', name: '', paid: 0 }
  ]);

  const billValue = parseFloat(totalBill) || 0;

  // Equal Mode Logic
  const equalShare = billValue > 0 ? parseFloat((billValue / equalParticipants.length).toFixed(2)) : 0;
  const equalNamesEntered = equalParticipants.every(p => p.name.trim().length > 0);
  
  const equalSettlements = useMemo(() => {
    if (splitType !== 'equal' || billValue <= 0 || !equalNamesEntered) return [];
    const mainPayer = equalParticipants.find(p => p.id === equalPayerId);
    if (!mainPayer || !mainPayer.name.trim()) return [];

    return equalParticipants
      .filter(p => p.id !== equalPayerId)
      .map(p => ({
        from: p.name.trim(),
        to: mainPayer.name.trim(),
        amount: equalShare
      }));
  }, [equalParticipants, billValue, splitType, equalPayerId, equalShare, equalNamesEntered]);

  // Custom Mode Logic
  const customShare = billValue > 0 ? parseFloat((billValue / customParticipants.length).toFixed(2)) : 0;
  const customNamesEntered = customParticipants.every(p => p.name.trim().length > 0);
  const customTotalPaid = customParticipants.reduce((sum, p) => sum + p.paid, 0);
  const isCustomMismatch = splitType === 'custom' && billValue > 0 && Math.abs(customTotalPaid - billValue) > 0.01;

  const customSettlements = useMemo(() => {
    if (splitType !== 'custom' || billValue <= 0 || isCustomMismatch || !customNamesEntered) return [];
    
    // Each person's debt is (Their Share - Their Paid)
    // Share is equal for everyone in Custom mode as per requirement
    let balances = customParticipants.map((p) => ({
      name: p.name.trim(),
      balance: p.paid - customShare
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
  }, [customParticipants, billValue, splitType, customShare, isCustomMismatch, customNamesEntered]);

  // Helper functions for Equal Mode
  const addEqualPerson = () => {
    setEqualParticipants([...equalParticipants, { id: Date.now().toString(), name: '', paid: 0 }]);
  };
  const removeEqualPerson = (id: string) => {
    if (equalParticipants.length <= 2) return;
    setEqualParticipants(equalParticipants.filter(p => p.id !== id));
    if (equalPayerId === id) setEqualPayerId(equalParticipants[0].id);
  };
  const updateEqualName = (id: string, name: string) => {
    setEqualParticipants(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  // Helper functions for Custom Mode
  const addCustomPerson = () => {
    setCustomParticipants([...customParticipants, { id: Date.now().toString(), name: '', paid: 0 }]);
  };
  const removeCustomPerson = (id: string) => {
    if (customParticipants.length <= 2) return;
    setCustomParticipants(customParticipants.filter(p => p.id !== id));
  };
  const updateCustomParticipant = (id: string, field: keyof Participant, value: string | number) => {
    setCustomParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: typeof value === 'string' ? (field === 'name' ? value : (parseFloat(value) || 0)) : value };
      }
      return p;
    }));
  };

  const handleSaveMyShare = () => {
    if (!firestore || !user?.uid) return;
    const shareToSave = splitType === 'equal' ? equalShare : customShare;
    const namesReady = splitType === 'equal' ? equalNamesEntered : customNamesEntered;
    const mismatch = splitType === 'custom' && isCustomMismatch;

    if (shareToSave <= 0 || mismatch || !namesReady) {
      toast({ variant: "destructive", title: "Error", description: !namesReady ? t.enterNames : "Check bill details" });
      return;
    }

    saveExpense(firestore, user.uid, {
      amount: shareToSave,
      category: 'Food',
      description: `Split Bill: ${totalBill}`,
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
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Names</Label>
              <div className="grid gap-3">
                {equalParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Input 
                      value={p.name} 
                      onChange={(e) => updateEqualName(p.id, e.target.value)}
                      placeholder="Enter Name"
                      className="h-12 bg-muted/50 border-none rounded-xl font-bold px-4 flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeEqualPerson(p.id)}
                      className="h-10 w-10 text-muted-foreground"
                      disabled={equalParticipants.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addEqualPerson} className="w-full h-12 rounded-2xl border-dashed border-2 gap-2">
                <UserPlus className="w-4 h-4" /> {t.addPerson}
              </Button>
            </div>

            {equalNamesEntered && billValue > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">{t.whoPaid}</Label>
                  <Select value={equalPayerId} onValueChange={setEqualPayerId}>
                    <SelectTrigger className="h-12 bg-muted border-none rounded-xl font-bold">
                      <SelectValue placeholder="Select Payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {equalParticipants.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-dashed">
                  <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest mb-3">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    {t.settlement}
                  </h4>
                  <div className="bg-primary/5 rounded-3xl p-5 space-y-3">
                    {equalSettlements.map((s, idx) => (
                      <div key={`equal-s-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-primary/5">
                        <p className="text-sm font-medium">
                          <span className="font-bold text-primary">{s.from}</span>
                          <span className="mx-1.5 text-muted-foreground font-bold">{t.owes}</span>
                          <span className="font-headline font-black text-primary mx-1">₹{s.amount.toLocaleString()}</span>
                          <span className="mx-1.5 text-muted-foreground font-bold">{t.to}</span>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{s.to}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 m-0">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2 italic">
              Each Person's Share: ₹{customShare.toLocaleString()}
            </p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {customParticipants.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 bg-muted/30 p-4 rounded-2xl border border-primary/5">
                  <div className="flex items-center gap-3">
                    <Input 
                      value={p.name} 
                      onChange={(e) => updateCustomParticipant(p.id, 'name', e.target.value)}
                      placeholder="Enter Name"
                      className="h-10 bg-card border-none rounded-xl font-bold px-4 flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCustomPerson(p.id)}
                      className="text-muted-foreground h-10 w-10 shrink-0"
                      disabled={customParticipants.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Paid at Venue</Label>
                    <Input 
                      type="number"
                      value={p.paid || ""}
                      onChange={(e) => updateCustomParticipant(p.id, 'paid', e.target.value)}
                      placeholder="Amount paid"
                      className="h-10 rounded-xl bg-card border-none font-bold text-sm text-green-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addCustomPerson} className="w-full h-12 rounded-2xl border-dashed border-2 gap-2">
              <UserPlus className="w-4 h-4" /> {t.addPerson}
            </Button>

            {isCustomMismatch && (
              <Alert variant="destructive" className="rounded-2xl border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold">
                  Mismatch: Total Paid (₹{customTotalPaid.toLocaleString()}) does not match Bill (₹{billValue.toLocaleString()})
                </AlertDescription>
              </Alert>
            )}

            {customNamesEntered && billValue > 0 && !isCustomMismatch && (
              <div className="space-y-4 pt-4 border-t border-dashed">
                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  {t.settlement}
                </h4>
                <div className="bg-primary/5 rounded-3xl p-5 space-y-3">
                  {customSettlements.length > 0 ? (
                    customSettlements.map((s, idx) => (
                      <div key={`custom-s-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-primary/5">
                        <p className="text-sm font-medium">
                          <span className="font-bold text-primary">{s.from}</span>
                          <span className="mx-1.5 text-muted-foreground font-bold">{t.owes}</span>
                          <span className="font-headline font-black text-primary mx-1">₹{s.amount.toLocaleString()}</span>
                          <span className="mx-1.5 text-muted-foreground font-bold">{t.to}</span>
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
          </TabsContent>
        </Tabs>

        {((splitType === 'equal' && !equalNamesEntered) || (splitType === 'custom' && !customNamesEntered)) && billValue > 0 && (
          <Alert className="rounded-2xl bg-amber-500/10 border-amber-500/20 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-bold">
              {t.enterNames}
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-6">
          <div className="flex items-center justify-between p-6 bg-primary rounded-[2rem] text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.yourShare}</span>
              <span className="text-3xl font-headline font-black">₹{(splitType === 'equal' ? equalShare : customShare).toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleSaveMyShare} 
              disabled={billValue <= 0 || (splitType === 'custom' && isCustomMismatch) || (splitType === 'equal' ? !equalNamesEntered : !customNamesEntered)}
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
