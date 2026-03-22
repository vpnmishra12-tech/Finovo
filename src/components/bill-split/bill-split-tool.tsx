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
import { UserPlus, Trash2, CheckCircle2, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Participant {
  id: string;
  name: string;
  paid: number;   
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

  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'group'>('equal');

  // Equal split
  const [equalTotalBill, setEqualTotalBill] = useState<string>("");
  const [equalNumPeople, setEqualNumPeople] = useState<string>("2");

  // Custom and Group
  const [customTotalBill, setCustomTotalBill] = useState<string>("");
  const [customParticipants, setCustomParticipants] = useState<Participant[]>([
    { id: 'c1', name: '', paid: 0 },
    { id: 'c2', name: '', paid: 0 }
  ]);

  const [groupParticipants, setGroupParticipants] = useState<Participant[]>([
    { id: 'g1', name: '', paid: 0 },
    { id: 'g2', name: '', paid: 0 }
  ]);

  // Derived values for Equal Split
  const equalBillVal = parseFloat(equalTotalBill) || 0;
  const equalPeopleCount = parseInt(equalNumPeople) || 1;
  const equalShare = equalBillVal > 0 ? parseFloat((equalBillVal / equalPeopleCount).toFixed(2)) : 0;

  // Derived values for Custom Split
  const customBillVal = parseFloat(customTotalBill) || 0;
  const customShare = customBillVal > 0 ? parseFloat((customBillVal / customParticipants.length).toFixed(2)) : 0;
  const customNamesEntered = customParticipants.every(p => p.name.trim().length > 0);
  const customTotalPaid = customParticipants.reduce((sum, p) => sum + p.paid, 0);
  const isCustomMismatch = splitType === 'custom' && customBillVal > 0 && Math.abs(customTotalPaid - customBillVal) > 0.01;

  const customSettlements = useMemo(() => {
    if (splitType !== 'custom' || customBillVal <= 0 || isCustomMismatch || !customNamesEntered) return [];
    
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
  }, [customParticipants, customBillVal, splitType, customShare, isCustomMismatch, customNamesEntered]);

  // Derived values for Group Trip
  const groupTotalPaid = groupParticipants.reduce((sum, p) => sum + p.paid, 0);
  const groupShare = groupParticipants.length > 0 ? parseFloat((groupTotalPaid / groupParticipants.length).toFixed(2)) : 0;
  const groupNamesEntered = groupParticipants.every(p => p.name.trim().length > 0);

  const groupSettlements = useMemo(() => {
    if (splitType !== 'group' || groupTotalPaid <= 0 || !groupNamesEntered) return [];
    
    let balances = groupParticipants.map((p) => ({
      name: p.name.trim(),
      balance: p.paid - groupShare
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
  }, [groupParticipants, groupTotalPaid, splitType, groupShare, groupNamesEntered]);

  const addCustomPerson = () => setCustomParticipants([...customParticipants, { id: Date.now().toString(), name: '', paid: 0 }]);
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

  const addGroupPerson = () => setGroupParticipants([...groupParticipants, { id: Date.now().toString(), name: '', paid: 0 }]);
  const removeGroupPerson = (id: string) => {
    if (groupParticipants.length <= 2) return;
    setGroupParticipants(groupParticipants.filter(p => p.id !== id));
  };
  const updateGroupParticipant = (id: string, field: keyof Participant, value: string | number) => {
    setGroupParticipants(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: typeof value === 'string' ? (field === 'name' ? value : (parseFloat(value) || 0)) : value };
      }
      return p;
    }));
  };

  const handleSaveMyShare = () => {
    if (!firestore || !user?.uid) return;
    let shareToSave = 0;
    let billDesc = "";
    let canSave = false;

    if (splitType === 'equal') {
      shareToSave = equalShare;
      billDesc = `Equal Split: ${equalTotalBill} / ${equalPeopleCount}`;
      canSave = equalBillVal > 0 && equalPeopleCount > 0;
    } else if (splitType === 'custom') {
      shareToSave = customShare;
      billDesc = `Custom Split: ${customTotalBill}`;
      canSave = customBillVal > 0 && customNamesEntered && !isCustomMismatch;
    } else {
      shareToSave = groupShare;
      billDesc = `Group Trip: ${groupTotalPaid}`;
      canSave = groupTotalPaid > 0 && groupNamesEntered;
    }

    if (shareToSave <= 0 || !canSave) {
      toast({ variant: "destructive", title: "Error", description: "Please complete the details correctly." });
      return;
    }

    saveExpense(firestore, user.uid, {
      amount: shareToSave,
      category: 'Food',
      description: billDesc,
      transactionDate: new Date().toISOString().split('T')[0],
      captureMethod: 'Text',
    });

    toast({ title: "Success", description: "Your share saved to expenses!" });
  };

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden rounded-3xl">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-xl font-headline font-black uppercase tracking-tight text-center">
          {t.splitTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted h-12 rounded-xl p-1 mb-6">
            <TabsTrigger value="equal" className="rounded-lg uppercase text-[10px]">
              {t.splitEqual}
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg uppercase text-[10px]">
              {t.splitCustom}
            </TabsTrigger>
            <TabsTrigger value="group" className="rounded-lg uppercase text-[10px]">
              {t.splitGroup}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-6 m-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">{t.totalAmount}</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={equalTotalBill} 
                  onChange={(e) => setEqualTotalBill(e.target.value)}
                  className="h-14 rounded-2xl bg-muted border-none font-headline font-black text-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">{t.numPeople}</Label>
                <Input 
                  type="number" 
                  placeholder="2" 
                  value={equalNumPeople} 
                  onChange={(e) => setEqualNumPeople(e.target.value)}
                  className="h-12 bg-muted/50 border-none rounded-xl px-4"
                  min="1"
                />
              </div>
            </div>
            {equalBillVal > 0 && (
              <div className="bg-muted/50 rounded-3xl p-6 text-center border border-border/50">
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">{t.personShare}</p>
                <p className="text-4xl font-headline font-black text-black">₹{equalShare.toLocaleString()}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6 m-0">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">{t.totalAmount}</Label>
              <Input type="number" placeholder="0.00" value={customTotalBill} onChange={(e) => setCustomTotalBill(e.target.value)} className="h-14 rounded-2xl bg-muted border-none font-headline font-black text-2xl" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Share per person: ₹{customShare.toLocaleString()}</p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {customParticipants.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 bg-muted/30 p-4 rounded-2xl border border-border/30">
                  <div className="flex items-center gap-2">
                    <Input value={p.name} onChange={(e) => updateCustomParticipant(p.id, 'name', e.target.value)} placeholder="Enter Name" className="h-10 bg-card border-none rounded-xl flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeCustomPerson(p.id)} disabled={customParticipants.length <= 2}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <Input type="number" value={p.paid || ""} onChange={(e) => updateCustomParticipant(p.id, 'paid', e.target.value)} placeholder="Paid at Venue" className="h-10 rounded-xl bg-card border-none text-sm text-black" />
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addCustomPerson} className="w-full h-12 rounded-2xl border-dashed border-2 gap-2 text-[10px] uppercase"><UserPlus className="w-4 h-4" /> {t.addPerson}</Button>
            {isCustomMismatch && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs uppercase tracking-tighter">Mismatch: Total Paid does not match Bill</AlertDescription>
              </Alert>
            )}
            {customNamesEntered && customBillVal > 0 && !isCustomMismatch && (
              <div className="bg-muted/30 rounded-3xl p-5 space-y-3">
                {customSettlements.map((s, idx) => (
                  <div key={`custom-s-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-border/30">
                    <p className="text-[11px]">
                      <span className="text-black font-bold uppercase tracking-widest">{s.from}</span>
                      <span className="mx-1 text-muted-foreground">{t.owes}</span>
                      <span className="font-headline font-black text-black mx-1 text-sm">₹{s.amount.toLocaleString()}</span>
                      <span className="mx-1 text-muted-foreground">{t.to}</span>
                      <span className="text-black font-bold uppercase tracking-widest">{s.to}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-6 m-0">
            <div className="bg-muted/50 p-4 rounded-2xl space-y-1 border border-border/50">
              <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t.totalGroupExpense}</p>
              <p className="text-3xl font-headline font-black text-black">₹{groupTotalPaid.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground uppercase">{t.groupDesc}</p>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {groupParticipants.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 bg-muted/30 p-4 rounded-2xl border border-border/30">
                  <div className="flex items-center gap-2">
                    <Input value={p.name} onChange={(e) => updateGroupParticipant(p.id, 'name', e.target.value)} placeholder="Enter Name" className="h-10 bg-card border-none rounded-xl flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeGroupPerson(p.id)} disabled={groupParticipants.length <= 2}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase text-muted-foreground ml-1">He/She Paid</Label>
                    <Input type="number" value={p.paid || ""} onChange={(e) => updateGroupParticipant(p.id, 'paid', e.target.value)} placeholder="0.00" className="h-10 rounded-xl bg-card border-none text-sm text-black" />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addGroupPerson} className="w-full h-12 rounded-2xl border-dashed border-2 gap-2 text-[10px] uppercase"><UserPlus className="w-4 h-4" /> {t.addPerson}</Button>
            {groupNamesEntered && groupTotalPaid > 0 && (
              <div className="space-y-4 pt-4 border-t border-dashed">
                <h4 className="text-[10px] uppercase text-muted-foreground flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> {t.settlement}</h4>
                <div className="bg-muted/30 rounded-3xl p-5 space-y-3">
                  {groupSettlements.map((s, idx) => (
                    <div key={`group-s-${idx}`} className="flex items-center gap-2 p-4 bg-card rounded-2xl shadow-sm border border-border/30">
                      <p className="text-[11px]">
                        <span className="text-black font-bold uppercase tracking-widest">{s.from}</span>
                        <span className="mx-1 text-muted-foreground">{t.owes}</span>
                        <span className="font-headline font-black text-black mx-1 text-sm">₹{s.amount.toLocaleString()}</span>
                        <span className="mx-1 text-muted-foreground">{t.to}</span>
                        <span className="text-black font-bold uppercase tracking-widest">{s.to}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-6">
          <div className="flex items-center justify-between p-6 bg-card border border-border/50 rounded-[2rem] text-black shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted/30 rounded-full -mr-16 -mt-16" />
            <div className="flex flex-col relative z-10">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{t.yourShare}</span>
              <span className="text-3xl font-headline font-black text-black">₹{(splitType === 'equal' ? equalShare : splitType === 'custom' ? customShare : groupShare).toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleSaveMyShare} 
              disabled={
                splitType === 'equal' ? (equalBillVal <= 0 || equalPeopleCount <= 0) : 
                splitType === 'custom' ? (customBillVal <= 0 || !customNamesEntered || isCustomMismatch) : 
                (groupTotalPaid <= 0 || !groupNamesEntered)
              } 
              className="rounded-2xl h-14 px-8 bg-black text-white hover:bg-black/90 uppercase tracking-widest text-[10px] gap-2 shadow-xl relative z-10"
            >
              <CheckCircle2 className="w-5 h-5" /> {t.saveMyShare}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
