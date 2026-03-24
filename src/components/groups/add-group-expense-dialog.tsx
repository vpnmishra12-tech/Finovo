"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore } from '@/firebase';
import { addGroupExpense } from '@/lib/groups';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, CheckCircle2, MessageSquareShare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AddGroupExpenseDialog({ groupId, groupName }: { groupId: string, groupName: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAddedExpense, setLastAddedExpense] = useState<any>(null);

  const handleAdd = async () => {
    if (!firestore || !user?.uid || !amount || !location) return;

    setIsSubmitting(true);
    try {
      const expenseData = {
        groupId,
        amount: parseFloat(amount),
        category: category as any,
        location,
        description,
        paidBy: user.uid,
        paidByName: user.displayName || user.email?.split('@')[0] || "User",
        transactionDate: new Date().toISOString(),
      };
      
      addGroupExpense(firestore, groupId, expenseData);
      setLastAddedExpense(expenseData);
      
      toast({ title: "Success", description: "Expense added to group!" });
      // We don't close immediately so they can see the Notify button
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add expense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotify = async () => {
    if (!lastAddedExpense) return;
    
    const message = `${t.shareMessage}${lastAddedExpense.amount} ${t.shareAt} ${lastAddedExpense.location} ${t.shareFor} ${lastAddedExpense.description || lastAddedExpense.category} (Group: ${groupName}).`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Finovo Expense Update',
          text: message,
          url: shareUrl
        });
      } catch (err) {
        console.warn("Navigator share failed", err);
      }
    } else {
      // Fallback to WhatsApp Direct Link
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message + " Check at: " + shareUrl)}`;
      window.open(waUrl, '_blank');
    }
    
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount("");
    setLocation("");
    setDescription("");
    setLastAddedExpense(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-muted text-black hover:bg-muted/80 border border-border/50">
          <Plus className="w-3 h-3" /> {t.addExpense}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted text-foreground border-b border-border/50">
          <DialogTitle className="font-headline font-black uppercase">{t.addExpense}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4 bg-card">
          {!lastAddedExpense ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.spent} (₹)</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 rounded-xl bg-muted border-none font-bold text-xl"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.category}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Cab', 'Breakfast', 'Lunch', 'Dinner', 'Other'].map(cat => (
                        <SelectItem key={cat} value={cat}>{t.categories[cat as keyof typeof t.categories] || cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.location}</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where?" 
                    className="h-12 pl-12 rounded-xl bg-muted border-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.description}</Label>
                <Input 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was it for?" 
                  className="h-12 rounded-xl bg-muted border-none font-bold"
                />
              </div>

              <Button 
                onClick={handleAdd} 
                disabled={!amount || !location || isSubmitting}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-lg mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : <><CheckCircle2 className="w-5 h-5" /> {t.save}</>}
              </Button>
            </>
          ) : (
            <div className="space-y-6 py-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-headline font-black text-xl uppercase tracking-tight">{t.shareSuccess}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t.notifyGroup}?</p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleNotify}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-lg bg-primary text-primary-foreground"
                >
                  <MessageSquareShare className="w-5 h-5" /> {t.notifyGroup}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="w-full h-12 text-[10px] uppercase tracking-widest font-black opacity-60"
                >
                  {t.actions.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
