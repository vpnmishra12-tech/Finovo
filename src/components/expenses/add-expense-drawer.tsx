"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { saveExpense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Send, Keyboard, Mic, Camera, Loader2, Sparkles } from 'lucide-react';
import { extractTextExpense } from '@/ai/flows/extract-text-expense';
import { VoiceInput } from './capture-modes/voice-input';
import { CameraInput } from './capture-modes/camera-input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';

export function AddExpenseDrawer() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Shopping");
  const [description, setDescription] = useState("");
  const [textInput, setTextInput] = useState("");

  const mainCategories = ['Food', 'Transport', 'Bills', 'Recharge', 'Shopping', 'EMI', 'Miscellaneous'];

  const resetForm = () => {
    setAmount("");
    setCategory("Shopping");
    setDescription("");
    setTextInput("");
    setIsProcessing(false);
  };

  const handleSave = () => {
    if (!firestore || !user?.uid) return;
    saveExpense(firestore, user.uid, {
      amount: parseFloat(amount),
      category: category as any,
      description,
      transactionDate: new Date().toISOString().split('T')[0],
      captureMethod: 'Text',
    });
    toast({ title: "Expense recorded!" });
    setOpen(false);
    resetForm();
  };

  const handleAiTextSubmit = async () => {
    if (!textInput) return;
    setIsProcessing(true);
    try {
      const result = await extractTextExpense({ textInput });
      setAmount(result.amount.toString());
      setCategory(result.category);
      setDescription(result.description);
    } catch (err) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiResult = (result: any) => {
    setAmount(result.amount.toString());
    setCategory(result.category);
    setDescription(result.description || result.merchant || "Expense from capture");
  };

  return (
    <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 bg-white/10 hover:bg-white/20 p-0 rounded-full border border-white/20"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[3rem] p-0 border-none shadow-2xl h-[85vh] focus:outline-none bg-white overflow-hidden">
        <SheetHeader className="p-6 px-8 bg-primary text-primary-foreground shrink-0 rounded-t-[3rem]">
          <SheetTitle className="font-headline text-2xl flex items-center gap-3 text-white">
            <Sparkles className="w-6 h-6" />
            {t.addExpense}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full">
          <div className="p-8 space-y-6 pb-24">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted h-12 rounded-2xl p-1 mb-6">
                <TabsTrigger value="text" className="rounded-xl gap-2 text-[11px] font-black uppercase">
                  <Keyboard className="w-4 h-4" /> {t.modes.text}
                </TabsTrigger>
                <TabsTrigger value="voice" className="rounded-xl gap-2 text-[11px] font-black uppercase">
                  <Mic className="w-4 h-4" /> {t.modes.voice}
                </TabsTrigger>
                <TabsTrigger value="camera" className="rounded-xl gap-2 text-[11px] font-black uppercase">
                  <Camera className="w-4 h-4" /> {t.modes.camera}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-0">
                <div className="flex gap-3">
                  <Input 
                    placeholder={t.captions.text} 
                    value={textInput} 
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiTextSubmit()}
                    className="bg-muted border-none rounded-2xl h-14 text-sm font-bold px-6"
                  />
                  <Button size="icon" className="h-14 w-14 rounded-2xl shrink-0" onClick={handleAiTextSubmit} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="mt-0">
                <VoiceInput onExtracted={handleAiResult} />
              </TabsContent>

              <TabsContent value="camera" className="mt-0">
                <CameraInput onExtracted={handleAiResult} />
              </TabsContent>
            </Tabs>

            <div className="space-y-6 pt-6 border-t border-muted/50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Amount (₹)</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-muted border-none font-headline font-black text-2xl rounded-2xl h-14 px-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-muted border-none rounded-2xl h-14 font-bold text-base px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-base font-bold">
                          {t.categories[cat as keyof typeof t.categories] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Description</Label>
                <Input 
                  placeholder="What was this for?" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted border-none rounded-2xl h-14 font-bold text-base px-6"
                />
              </div>

              <div className="pt-4">
                <Button className="w-full rounded-[2rem] h-16 text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3" onClick={handleSave} disabled={!amount || !description}>
                  <Plus className="w-6 h-6" /> Save Expense
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}