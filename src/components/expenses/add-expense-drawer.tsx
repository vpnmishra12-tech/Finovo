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
  const db = useFirestore();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleManualSave = async () => {
    if (!user || !amount || !description || !db) return;
    setIsSaving(true);
    try {
      await saveExpense(db, {
        userId: user.uid,
        amount: parseFloat(amount),
        category: category as any,
        description,
      });
      toast({ title: "Success", description: "Expense saved successfully!" });
      setOpen(false);
      resetForm();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save expense", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
    setDescription(result.description || result.merchant || "Captured Expense");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-40 group transition-all duration-300 hover:scale-105 active:scale-95">
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            {t.addExpense}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted h-12 rounded-xl p-1">
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
          </div>

          <div className="px-6 py-4">
            <TabsContent value="text" className="mt-0 space-y-4">
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

            <div className="space-y-4 mt-6 border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.spent}</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-muted border-none font-bold text-lg rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.language === 'en' ? 'Category' : 'श्रेणी'}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-muted border-none rounded-xl">
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
                <Label>{t.language === 'en' ? 'Description' : 'विवरण'}</Label>
                <Input 
                  placeholder="e.g. Lunch at Office" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted border-none rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                  {t.actions.cancel}
                </Button>
                <Button className="flex-[2] rounded-xl shadow-lg shadow-primary/20" onClick={handleManualSave} disabled={isSaving || !amount || !description}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.actions.save}
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
