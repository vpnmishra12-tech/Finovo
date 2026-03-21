
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { saveExpense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  
  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Shopping");
  const [description, setDescription] = useState("");
  const [textInput, setTextInput] = useState("");

  // Filtered categories for display (only main ones)
  const mainCategories = ['Food', 'Transport', 'Bills', 'Recharge', 'Shopping', 'EMI', 'Miscellaneous'];

  const resetForm = () => {
    setAmount("");
    setCategory("Shopping");
    setDescription("");
    setTextInput("");
    setIsProcessing(false);
  };

  const handleSave = () => {
    if (!firestore || !user?.uid) {
      toast({ title: "Error", description: "You must be logged in to save expenses.", variant: "destructive" });
      return;
    }
    
    saveExpense(firestore, user.uid, {
      amount: parseFloat(amount),
      category: category as any,
      description,
      transactionDate: new Date().toISOString().split('T')[0],
      captureMethod: 'Text',
    });

    toast({ title: "Success", description: "Expense recorded!" });
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
      toast({ title: "AI Error", description: "Couldn't parse that. Try manual entry.", variant: "destructive" });
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
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-[100px] right-6 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-2xl z-[60] hover:scale-105 transition-transform active:scale-95 bg-primary text-primary-foreground border-4 border-background"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] max-h-[85vh] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-[100] flex flex-col top-[42%] translate-y-[-50%]">
        <DialogHeader className="p-4 px-6 bg-primary text-primary-foreground shrink-0">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t.addExpense}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted h-10 rounded-xl p-1 mb-4">
                <TabsTrigger value="text" className="rounded-lg gap-2 text-[10px] font-black uppercase">
                  <Keyboard className="w-3.5 h-3.5" /> {t.modes.text}
                </TabsTrigger>
                <TabsTrigger value="voice" className="rounded-lg gap-2 text-[10px] font-black uppercase">
                  <Mic className="w-3.5 h-3.5" /> {t.modes.voice}
                </TabsTrigger>
                <TabsTrigger value="camera" className="rounded-lg gap-2 text-[10px] font-black uppercase">
                  <Camera className="w-3.5 h-3.5" /> {t.modes.camera}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-0">
                <div className="flex gap-2">
                  <Input 
                    placeholder={t.captions.text} 
                    value={textInput} 
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiTextSubmit()}
                    className="bg-muted border-none rounded-xl h-11 text-xs font-bold"
                  />
                  <Button size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={handleAiTextSubmit} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
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

            <div className="space-y-4 pt-4 border-t border-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1 tracking-widest">{t.spent} (₹)</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-muted border-none font-headline font-black text-xl rounded-xl h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1 tracking-widest">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-muted border-none rounded-xl h-12 font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[110]">
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-sm font-bold">
                          {t.categories[cat as keyof typeof t.categories] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1 tracking-widest">Description</Label>
                <Input 
                  placeholder="What was this for?" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted border-none rounded-xl h-12 font-bold text-sm"
                />
              </div>

              <div className="pt-2">
                <Button className="w-full rounded-2xl h-14 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2" onClick={handleSave} disabled={!amount || !description}>
                  <Plus className="w-5 h-5" /> {t.actions.save}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
