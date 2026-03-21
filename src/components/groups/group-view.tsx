
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { Group, GroupExpense, deleteGroupExpense, updateGroupExpense, GroupMember, removeMemberFromGroup, deleteGroup, addMemberToGroup } from '@/lib/groups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Calendar, Trash2, Wallet, Users, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { AddGroupExpenseDialog } from './add-group-expense-dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function GroupView({ groupId, onBack }: { groupId: string, onBack: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberMobile, setNewMemberMobile] = useState("");

  const groupRef = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return doc(firestore, 'groups', groupId);
  }, [firestore, groupId]);

  const { data: groupData } = useDoc<Group>(groupRef);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return query(
      collection(firestore, 'groups', groupId, 'expenses'),
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, groupId]);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return collection(firestore, 'groups', groupId, 'members');
  }, [firestore, groupId]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<GroupExpense>(expensesQuery);
  const { data: members, isLoading: isMembersLoading } = useCollection<GroupMember>(membersQuery);

  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const memberTotals = expenses?.reduce((acc, exp) => {
    acc[exp.paidBy] = {
      name: exp.paidByName,
      total: (acc[exp.paidBy]?.total || 0) + exp.amount
    };
    return acc;
  }, {} as Record<string, {name: string, total: number}>);

  const handleAddMember = () => {
    if (!firestore || !groupId || !newMemberName) return;
    addMemberToGroup(firestore, groupId, newMemberName, newMemberMobile);
    setNewMemberName("");
    setNewMemberMobile("");
    toast({ title: "Member Added", description: `${newMemberName} joined the group.` });
  };

  const handleDeleteExpense = (id: string) => {
    if (!firestore || !groupId) return;
    deleteGroupExpense(firestore, groupId, id);
    toast({ title: "Deleted", description: "Expense removed." });
  };

  const handleDeleteGroup = () => {
    if (!firestore || !groupId) return;
    deleteGroup(firestore, groupId);
    toast({ title: "Group Deleted", description: "The group has been removed." });
    onBack();
  };

  const handleRemoveMember = (memberId: string) => {
    if (!firestore || !groupId) return;
    removeMemberFromGroup(firestore, groupId, memberId);
    toast({ title: "Member Removed", description: "Member removed from the list." });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-xl font-headline font-black uppercase tracking-tight">{groupData?.name || t.groupTitle}</h2>
            {groupData?.createdAt && (
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {t.createdOn}: {format(groupData.createdAt.toDate(), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteGroup}?</AlertDialogTitle>
              <AlertDialogDescription>{t.confirmDelete}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">{t.actions.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground rounded-xl">{t.deleteGroup}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-xl p-1 mb-6">
          <TabsTrigger value="expenses" className="rounded-lg gap-2 font-black text-[10px] uppercase">
            <Wallet className="w-3 h-3" /> {t.expenses}
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg gap-2 font-black text-[10px] uppercase">
            <Users className="w-3 h-3" /> {t.membersList}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 m-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.history}</h3>
            <AddGroupExpenseDialog groupId={groupId} />
          </div>

          {isExpensesLoading ? (
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
                        <h4 className="font-bold text-lg">{expense.description || "Group Expense"}</h4>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
        </TabsContent>

        <TabsContent value="members" className="space-y-6 m-0">
          <div className="bg-muted/30 p-4 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> {t.addMember}
            </h4>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Input 
                  placeholder={t.memberName} 
                  value={newMemberName} 
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-card border-none h-12 rounded-xl font-bold"
                />
              </div>
              <div className="space-y-1">
                <Input 
                  placeholder={t.memberMobile} 
                  value={newMemberMobile} 
                  onChange={(e) => setNewMemberMobile(e.target.value)}
                  className="bg-card border-none h-12 rounded-xl font-bold"
                />
              </div>
              <Button onClick={handleAddMember} disabled={!newMemberName} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2">
                <CheckCircle2 className="w-4 h-4" /> {t.save}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.membersList}</h4>
            <div className="grid gap-2">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{member.name}</span>
                      <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">{member.mobile || "No Mobile"}</span>
                    </div>
                  </div>
                  {member.userId !== groupData?.createdBy && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
