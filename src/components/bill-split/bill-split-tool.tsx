
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useFirestore } from '@/firebase';
import { saveExpense } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, UserPlus, Trash2, Calculator, CheckCircle2, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Participant {
  id: string;
  name: string;
  amount: number;
}

export function BillSplitTool() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [totalBill, setTotalBill] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Me', amount: 0 },
    { id: '2', name: 'Friend 1', amount: 0 }
  ]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [paidById, setPaidById] = useState<string>('1');

  const billValue = parseFloat(totalBill) || 0;

  const addPerson = () => {
    const newId = Date.now().toString();
    setParticipants([...participants, { id: newId, name: `Friend ${participants.length}`, amount: 0 }]);
  };

  const removePerson = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter(p => p.id !== id));
    if (paidById === id) setPaidById('1');
  };

  const updateName = (id: string, name: string) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, name } : p));
  };

  const updateAmount = (id: string, amount: string) => {
    const val = parseFloat(amount) || 0;
    setParticipants(participants.map(p => p.id === id ? { ...p, amount: val } : p));
  };

  const getEqualShare = () => {
    if (billValue === 0) return 0;
    return parseFloat((billValue / participants.length).toFixed(2));
  };

  const getCustomTotal = () => {
    return participants.reduce((sum, p) => sum + p.amount, 0);
  };

  const remainingToSplit = billValue - getCustomTotal();
  const isCustomValid = splitMode === 'equal' ? billValue > 0 : (billValue > 0 && Math.abs(remainingToSplit) < 0.01);
  const payer = participants.find(p => p.id === paidById);

  const handleSaveShare = () => {
    if (!firestore || !user?.uid) return;
    
    let myShare = 0;
    if (splitMode === 'equal') {
      myShare = getEqualShare();
    } else {
      myShare = participants.find(p => p.id === '1')?.amount || 0;
    }

    if (myShare <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Share must be greater than 0" });
      return;
    }

    saveExpense(firestore, user.uid, {
      amount: myShare,
      category: 'Food',
      description: description || `Split: ${totalBill}`,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">{t.totalAmount}</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={totalBill} 
              onChange={(e) => setTotalBill(e.target.value)}
              className="h-12 rounded-xl bg-muted border-none font-headline font-bold text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">{t.whoPaid}</Label>
            <Select value={paidById} onValueChange={setPaidById}>
              <SelectTrigger className="h-12 rounded-xl bg-muted border-none font-medium">
                <SelectValue placeholder="Select Payer" />
              </SelectTrigger>
              <SelectContent>
                {participants.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl p-1 h-12 mb-6">
            <TabsTrigger value="equal" className="rounded-lg font-bold">{t.splitEqual}</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg font-bold">{t.splitCustom}</TabsTrigger>
          </TabsList>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.map((p, idx) => (
              <div key={p.id} className="flex flex-col gap-2 bg-muted/30 p-4 rounded-2xl group transition-all hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${paidById === p.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-primary/10 text-primary'}`}>
                    {idx + 1}
                  </div>
                  <Input 
                    value={p.name} 
                    onChange={(e) => updateName(p.id, e.target.value)}
                    placeholder="Name"
                    className="h-10 bg-transparent border-none font-bold p-0 focus-visible:ring-0 text-base"
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
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{t.personShare}</span>
                  {splitMode === 'custom' ? (
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                      <Input 
                        type="number"
                        value={p.amount || ""}
                        onChange={(e) => updateAmount(p.id, e.target.value)}
                        placeholder="0"
                        className="h-10 pl-7 rounded-lg bg-card border-none text-right font-headline font-bold text-lg text-primary"
                      />
                    </div>
                  ) : (
                    <div className="text-right font-headline font-bold text-lg text-primary">
                      ₹{getEqualShare()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addPerson} 
            className="w-full mt-4 h-12 rounded-xl border-dashed border-2 gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {t.addPerson}
          </Button>

          {splitMode === 'custom' && billValue > 0 && (
            <div className={`mt-4 p-4 rounded-2xl flex justify-between items-center transition-colors ${Math.abs(remainingToSplit) < 0.01 ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/5 border border-destructive/10'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.remainingToSplit}</span>
                <span className={`text-sm font-headline font-bold ${Math.abs(remainingToSplit) < 0.01 ? 'text-green-500' : 'text-destructive'}`}>
                  ₹{remainingToSplit.toFixed(2)}
                </span>
              </div>
              {Math.abs(remainingToSplit) >= 0.01 && (
                <div className="flex items-center gap-1 text-destructive animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Total mismatch</span>
                </div>
              )}
            </div>
          )}
        </Tabs>

        {/* Settlement Summary Section - CLEAR SENTENCE FORMAT */}
        {isCustomValid && (
          <div className="space-y-4 pt-4 border-t border-dashed">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              {t.settlement}
            </h4>
            <div className="bg-primary/5 rounded-3xl p-5 space-y-3 border border-primary/10 shadow-inner">
              {participants.map(p => {
                if (p.id === paidById) return null;
                const share = splitMode === 'equal' ? getEqualShare() : p.amount;
                if (share <= 0) return null;
                
                return (
                  <div key={`settle-${p.id}`} className="flex items-center gap-2 p-3 bg-card rounded-xl shadow-sm border border-primary/5">
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">
                      <span className="font-bold text-primary">{p.name}</span>
                      <span className="mx-1.5 text-muted-foreground lowercase">{t.owes}</span>
                      <span className="font-headline font-black text-primary mx-1">₹{share.toLocaleString()}</span>
                      <span className="mx-1.5 text-muted-foreground lowercase">{t.to}</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{payer?.name || 'Payer'}</span>
                    </p>
                  </div>
                );
              })}
              {participants.every(p => p.id === paidById || (splitMode === 'equal' ? getEqualShare() : p.amount) === 0) && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm font-medium">{t.noPayment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-6">
          <div className="flex items-center justify-between p-5 bg-primary rounded-3xl text-primary-foreground shadow-xl shadow-primary/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.yourShare}</span>
              <span className="text-2xl font-headline font-black">
                ₹{splitMode === 'equal' ? getEqualShare().toLocaleString() : (participants.find(p => p.id === '1')?.amount || 0).toLocaleString()}
              </span>
            </div>
            <Button 
              onClick={handleSaveShare} 
              disabled={billValue <= 0 || (splitMode === 'custom' && Math.abs(remainingToSplit) >= 0.01)}
              className="rounded-2xl h-14 px-6 bg-white text-primary hover:bg-white/90 font-bold gap-2 shadow-lg"
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
