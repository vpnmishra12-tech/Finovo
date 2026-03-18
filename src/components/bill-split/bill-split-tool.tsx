
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
import { Users, UserPlus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  name: string;
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
    { id: '1', name: 'Me', amount: 0 },
    { id: '2', name: 'Friend 1', amount: 0 }
  ]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  const addPerson = () => {
    const newId = (participants.length + 1).toString();
    setParticipants([...participants, { id: newId, name: `Friend ${participants.length}`, amount: 0 }]);
  };

  const removePerson = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateName = (id: string, name: string) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, name } : p));
  };

  const updateAmount = (id: string, amount: string) => {
    const val = parseFloat(amount) || 0;
    setParticipants(participants.map(p => p.id === id ? { ...p, amount: val } : p));
  };

  const calculateEqualSplit = () => {
    const bill = parseFloat(totalBill) || 0;
    if (bill === 0) return 0;
    return (bill / participants.length).toFixed(2);
  };

  const getCustomTotal = () => {
    return participants.reduce((sum, p) => sum + p.amount, 0);
  };

  const handleSaveShare = () => {
    if (!firestore || !user?.uid) return;
    
    let myShare = 0;
    if (splitMode === 'equal') {
      myShare = parseFloat(calculateEqualSplit() as string);
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

  const isCustomValid = splitMode === 'custom' && Math.abs(getCustomTotal() - (parseFloat(totalBill) || 0)) < 1;

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden rounded-3xl">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-xl font-headline font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          {t.splitTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label className="text-xs font-bold uppercase text-muted-foreground">Reason / Description</Label>
            <Input 
              placeholder="Trip to Manali, Dinner..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl bg-muted border-none"
            />
          </div>
        </div>

        <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl p-1 h-12 mb-6">
            <TabsTrigger value="equal" className="rounded-lg font-bold">{t.splitEqual}</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg font-bold">{t.splitCustom}</TabsTrigger>
          </TabsList>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl group">
                <div className="flex-1 flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <Input 
                    value={p.name} 
                    onChange={(e) => updateName(p.id, e.target.value)}
                    placeholder="Name"
                    className="h-10 bg-transparent border-none font-medium p-0 focus-visible:ring-0"
                  />
                </div>
                
                {splitMode === 'custom' ? (
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                    <Input 
                      type="number"
                      value={p.amount || ""}
                      onChange={(e) => updateAmount(p.id, e.target.value)}
                      className="h-10 pl-5 rounded-lg bg-card border-none text-right font-bold"
                    />
                  </div>
                ) : (
                  <div className="text-right font-headline font-bold text-primary">
                    ₹{calculateEqualSplit()}
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removePerson(p.id)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  disabled={participants.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addPerson} 
            className="w-full mt-4 h-12 rounded-xl border-dashed border-2 gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {t.addPerson}
          </Button>

          {splitMode === 'custom' && (
            <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex justify-between items-center">
              <span className="text-sm font-medium">Total Assigned:</span>
              <span className={`font-headline font-bold ${isCustomValid ? 'text-green-500' : 'text-destructive'}`}>
                ₹{getCustomTotal()} / ₹{totalBill || 0}
              </span>
            </div>
          )}
        </Tabs>

        <div className="pt-4 border-t flex flex-col gap-3">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase">{t.yourShare}</span>
              <span className="text-2xl font-headline font-bold text-primary">
                ₹{splitMode === 'equal' ? calculateEqualSplit() : (participants.find(p => p.id === '1')?.amount || 0)}
              </span>
            </div>
            <Button 
              onClick={handleSaveShare} 
              disabled={!totalBill || (splitMode === 'custom' && !isCustomValid)}
              className="rounded-xl h-12 gap-2 shadow-lg shadow-primary/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t.saveMyShare}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
