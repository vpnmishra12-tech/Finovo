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

  const resetForm = () => {
    setAmount("");
    setCategory("Shopping");
    setDescription("");
    setTextInput("");
    setIsProcessing(false);
  };

  const handleSave = () => {
    if (!firestore) return;
    
    // Use user ID or fallback demo ID for preview
    const userId = user?.uid || "demo-user-id";
    
    saveExpense(firestore, userId, {
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
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-40 hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-8 h-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-primary-foreground relative">
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            {t.addExpense}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted h-12 rounded-xl p-1 mb-6">
              <TabsTrigger value="text" className="rounded-lg gap-2">
                <Keyboard className="w-4 h-4" /> {t.modes.text}
              </TabsTrigger>
              <TabsTrigger value="voice" className="rounded-lg gap-2">
                <Mic className="w-4 h-4" /> {t.modes.voice}
              </TabsTrigger>
              <TabsTrigger value="camera" className="rounded-lg gap-2">
                <Camera className="w-4 h-4" /> {t.modes.camera}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-0">
              <div className="flex gap-2">
                <Input 
                  placeholder={t.captions.text} 
                  value={textInput} 
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiTextSubmit()}
                  className="bg-muted border-none rounded-xl"
                />
                <Button size="icon" onClick={handleAiTextSubmit} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
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

          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">{t.spent} (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-muted border-none font-headline font-bold text-xl rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-muted border-none rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(t.categories).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t.categories[cat as keyof typeof t.categories]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Description</Label>
              <Input 
                placeholder="What was this for?" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-none rounded-xl h-12"
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20" onClick={handleSave} disabled={!amount || !description}>
                {t.actions.save}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
