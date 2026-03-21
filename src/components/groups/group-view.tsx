
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { GroupExpense, deleteGroupExpense, updateGroupExpense } from '@/lib/groups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Trash2, Edit2, Wallet, Plus } from 'lucide-react';
import { AddGroupExpenseDialog } from './add-group-expense-dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function GroupView({ groupId, onBack }: { groupId: string, onBack: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return query(
      collection(firestore, 'groups', groupId, 'expenses'),
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, groupId]);

  const { data: expenses, isLoading } = useCollection<GroupExpense>(expensesQuery);

  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const memberTotals = expenses?.reduce((acc, exp) => {
    acc[exp.paidBy] = {
      name: exp.paidByName,
      total: (acc[exp.paidBy]?.total || 0) + exp.amount
    };
    return acc;
  }, {} as Record<string, {name: string, total: number}>);

  const handleDelete = (id: string) => {
    if (!firestore || !groupId) return;
    deleteGroupExpense(firestore, groupId, id);
    toast({ title: "Deleted", description: "Expense removed." });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-headline font-black uppercase tracking-tight">{t.groupTitle}</h2>
      </div>

      <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{t.totalGroupExpense}</span>
            <Wallet className="w-5 h-5 opacity-50" />
          </div>
          <p className="text-4xl font-headline font-black">₹{totalSpent.toLocaleString()}</p>
          
          <div className="pt-4 space-y-2 border-t border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.contribution}s</p>
            <div className="flex flex-wrap gap-2">
              {memberTotals && Object.values(memberTotals).map((m, i) => (
                <div key={i} className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-bold">{m.name}:</span>
                  <span className="text-[10px] font-black">₹{m.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.history}</h3>
        <AddGroupExpenseDialog groupId={groupId} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : expenses && expenses.length > 0 ? (
        <div className="grid gap-3">
          {expenses.map((expense) => (
            <Card key={expense.id} className="border-none shadow-sm group rounded-2xl overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">
                      {t.categories[expense.category as keyof typeof t.categories] || expense.category}
                    </Badge>
                    <h4 className="font-bold text-lg">{expense.amount.toLocaleString()}</h4>
                  </div>
                  <p className="text-2xl font-headline font-black text-primary">₹{expense.amount.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {expense.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> 
                    {expense.transactionDate instanceof Timestamp 
                      ? format(expense.transactionDate.toDate(), 'dd MMM, HH:mm')
                      : format(new Date(expense.transactionDate as string), 'dd MMM, HH:mm')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-muted">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t.paidBy}</span>
                    <span className="text-[10px] font-black text-primary uppercase">{expense.paidBy === user?.uid ? "Me" : expense.paidByName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {expense.isEdited && (
                      <Badge variant="outline" className="text-[8px] uppercase font-black text-amber-500 border-amber-500/20">{t.edited}</Badge>
                    )}
                    {expense.paidBy === user?.uid && (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 italic text-muted-foreground text-xs">
          {t.noExpenses}
        </div>
      )}
    </div>
  );
}
