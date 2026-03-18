
"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Expense } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MonthlyHistory({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();

  // Group expenses by month/year
  const monthlyTotals = expenses.reduce((acc, exp) => {
    const date = parseISO(exp.transactionDate);
    const monthKey = format(date, 'MM'); // "01", "02" etc.
    const yearKey = format(date, 'yyyy');
    const fullKey = `${yearKey}-${monthKey}`;

    if (!acc[fullKey]) {
      acc[fullKey] = {
        month: monthKey,
        year: yearKey,
        total: 0
      };
    }
    acc[fullKey].total += exp.amount;
    return acc;
  }, {} as Record<string, { month: string, year: string, total: number }>);

  // Sort by year and month descending
  const sortedMonths = Object.values(monthlyTotals).sort((a, b) => {
    return `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`);
  });

  if (sortedMonths.length === 0) return null;

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden flex flex-col h-[280px]">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {t.monthlyTrends}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-2">
            {sortedMonths.map((item) => (
              <div key={`${item.year}-${item.month}`} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-xs">
                    {t.months[item.month as keyof typeof t.months]} {item.year}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                    {expenses.filter(e => e.transactionDate.startsWith(`${item.year}-${item.month}`)).length} {t.expenses}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-base">₹{item.total.toLocaleString()}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
