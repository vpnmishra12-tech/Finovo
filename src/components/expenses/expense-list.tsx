"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Expense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Utensils, Bus, Receipt, CreditCard, ChevronRight } from 'lucide-react';
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

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-3xl border-2 border-dashed border-muted">
        <p>{t.noExpenses}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-headline font-semibold text-lg">{t.history}</h3>
      </div>
      {expenses.map((expense) => (
        <Card key={expense.id} className="border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer group rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${CategoryColor(expense.category)}`}>
              <CategoryIcon category={expense.category} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-base truncate pr-2">{expense.description}</p>
                <p className="font-headline font-bold text-lg whitespace-nowrap">₹{expense.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-medium uppercase py-0 px-2 rounded-md border-muted">
                  {t.categories[expense.category as keyof typeof t.categories]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(expense.date.toDate(), 'MMM dd, h:mm a')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}