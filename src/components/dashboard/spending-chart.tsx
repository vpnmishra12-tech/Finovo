
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

  // Vibrant, distinct colors for multi-colour look
  const COLORS = {
    Food: 'hsl(354, 100%, 70%)',        // Vibrant Coral
    Transport: 'hsl(200, 80%, 57%)',   // Bright Sky Blue
    Bills: 'hsl(45, 100%, 67%)',       // Sunny Gold
    Shopping: 'hsl(180, 50%, 52%)',    // Fresh Teal
    EMI: 'hsl(260, 100%, 70%)',        // Electric Purple
    Recharge: 'hsl(30, 100%, 62%)',     // Energetic Orange
    Miscellaneous: 'hsl(0, 0%, 65%)',   // Neutral Slate
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
                innerRadius={58}
                outerRadius={82}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.originalName as keyof typeof COLORS] || 'hsl(var(--primary))'} 
                    stroke="none"
                  />
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
