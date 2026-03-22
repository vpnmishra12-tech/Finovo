"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Expense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart, Cell } from 'recharts';

export function SpendingChart({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();

  const data = Object.entries(
    expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name: t.categories[name as keyof typeof t.categories], 
    value,
    originalName: name
  }));

  const COLORS = {
    Food: 'hsl(var(--chart-1))',
    Transport: 'hsl(var(--chart-2))',
    Bills: 'hsl(var(--chart-3))',
    Shopping: 'hsl(var(--chart-4))',
    EMI: 'hsl(var(--chart-5))',
    Recharge: 'hsl(190, 90%, 50%)',
    Miscellaneous: 'hsl(330, 90%, 60%)',
  };

  const config: ChartConfig = {
    value: { label: "Amount" }
  };

  return (
    <Card className="border-none bg-card shadow-sm overflow-hidden h-[180px] flex flex-col">
      <CardContent className="flex-1 p-0 overflow-hidden">
        {data.length > 0 ? (
          <ChartContainer config={config} className="h-full w-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.originalName as keyof typeof COLORS] || 'hsl(var(--primary))'} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] italic">
            {t.noExpenses}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
