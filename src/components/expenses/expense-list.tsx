"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Expense, deleteExpense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Utensils, Bus, Receipt, CreditCard, Loader2, PlusCircle, Trash2, Smartphone, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case 'Food': return <Utensils className={className} />;
    case 'Transport': return <Bus className={className} />;
    case 'Bills': return <Receipt className={className} />;
    case 'EMI': return <CreditCard className={className} />;
    case 'Recharge': return <Smartphone className={className} />;
    case 'Miscellaneous': return <MoreHorizontal className={className} />;
    default: return <ShoppingBag className={className} />;
  }
};

const CategoryColor = (category: string) => {
  switch (category) {
    case 'Food': return 'bg-orange-500/10 text-orange-500';
    case 'Transport': return 'bg-blue-500/10 text-blue-500';
    case 'Bills': return 'bg-purple-500/10 text-purple-500';
    case 'EMI': return 'bg-red-500/10 text-red-500';
    case 'Recharge': return 'bg-cyan-500/10 text-cyan-500';
    case 'Miscellaneous': return 'bg-pink-500/10 text-pink-500';
    default: return 'bg-green-500/10 text-green-500';
  }
};

export function ExpenseList({ expenses, isLoading }: { expenses: Expense[], isLoading: boolean }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const firestore = useFirestore();

  const handleDelete = (id: string) => {
    if (firestore && user?.uid) {
      deleteExpense(firestore, user.uid, id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading history...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-muted/20 rounded-3xl border-2 border-dashed border-muted/50">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="text-muted-foreground/50 w-8 h-8" />
        </div>
        <h3 className="font-headline font-bold text-xl mb-2">{t.noExpenses}</h3>
        <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
          Your expense history will appear here. Try adding one using the magic button below!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-headline font-bold text-xl">{t.history}</h3>
      </div>
      <div className="grid gap-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="border-none shadow-sm hover:shadow-md transition-all group rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-transform group-hover:scale-105 ${CategoryColor(expense.category)}`}>
                <CategoryIcon category={expense.category} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-base truncate">{expense.description}</p>
                  <p className="font-headline font-black text-lg text-primary">₹{expense.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter px-2 py-0">
                    {t.categories[expense.category as keyof typeof t.categories]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {expense.createdAt ? format(expense.createdAt.toDate(), 'MMM dd • hh:mm a') : 'Just now'}
                  </span>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.actions.delete}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.confirmDelete}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">{t.actions.cancel}</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(expense.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      {t.actions.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}