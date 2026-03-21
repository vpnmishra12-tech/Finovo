
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
import { Plus, MapPin, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AddGroupExpenseDialog({ groupId }: { groupId: string }) {
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

  const handleAdd = async () => {
    if (!firestore || !user?.uid || !amount || !location) return;

    setIsSubmitting(true);
    try {
      addGroupExpense(firestore, groupId, {
        groupId,
        amount: parseFloat(amount),
        category: category as any,
        location,
        description,
        paidBy: user.uid,
        paidByName: user.displayName || user.email?.split('@')[0] || "User",
        transactionDate: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Expense added to group!" });
      setOpen(false);
      setAmount("");
      setLocation("");
      setDescription("");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add expense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary/20">
          <Plus className="w-3 h-3" /> {t.addExpense}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <DialogTitle className="font-headline font-black uppercase">{t.addExpense}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
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
              <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.language === 'en' ? 'Category' : 'श्रेणी'}</Label>
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
            <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.language === 'en' ? 'Description' : 'विवरण'}</Label>
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
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 mt-4"
          >
            {isSubmitting ? "Saving..." : <><CheckCircle2 className="w-5 h-5" /> {t.save}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
