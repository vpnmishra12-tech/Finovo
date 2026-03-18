"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Expense } from '@/lib/expenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MonthlyHistory({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();

  const monthlyTotals = expenses.reduce((acc, exp) => {
    const date = parseISO(exp.transactionDate);
    const monthKey = format(date, 'MM'); 
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

  const sortedMonths = Object.values(monthlyTotals).sort((a, b) => {
    return `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`);
  });

  if (sortedMonths.length === 0) return null;

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden flex flex-col h-[180px]">
      <CardHeader className="pb-1 pt-3 shrink-0">
        <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <CalendarDays className="w-3 h-3" />
          {t.monthlyTrends}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-1.5">
            {sortedMonths.map((item) => (
              <div key={`${item.year}-${item.month}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-[10px]">
                    {t.months[item.month as keyof typeof t.months]} {item.year}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-sm">₹{item.total.toLocaleString()}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
