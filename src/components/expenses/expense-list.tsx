
"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Expense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Utensils, Bus, Receipt, CreditCard, ChevronRight, Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case 'Food': return <Utensils className={className} />;
    case 'Transport': return <Bus className={className} />;
    case 'Bills': return <Receipt className={className} />;
    case 'EMI': return <CreditCard className={className} />;
    default: return <ShoppingBag className={className} />;
  }
};

const CategoryColor = (category: string) => {
  switch (category) {
    case 'Food': return 'bg-orange-500/10 text-orange-500';
    case 'Transport': return 'bg-blue-500/10 text-blue-500';
    case 'Bills': return 'bg-purple-500/10 text-purple-500';
    case 'EMI': return 'bg-red-500/10 text-red-500';
    default: return 'bg-green-500/10 text-green-500';
  }
};

export function ExpenseList({ expenses, isLoading }: { expenses: Expense[], isLoading: boolean }) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Loading history...</p>
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
          <Card key={expense.id} className="border-none shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-transform group-hover:scale-105 ${CategoryColor(expense.category)}`}>
                <CategoryIcon category={expense.category} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-base truncate">{expense.description}</p>
                  <p className="font-headline font-bold text-lg text-primary">₹{expense.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0">
                    {t.categories[expense.category as keyof typeof t.categories]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">
                    {expense.createdAt ? format(expense.createdAt.toDate(), 'MMM dd • hh:mm a') : 'Just now'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
