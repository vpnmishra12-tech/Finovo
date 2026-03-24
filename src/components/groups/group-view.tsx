"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { Group, GroupExpense, deleteGroupExpense, GroupMember, removeMemberFromGroup, deleteGroup, addMemberToGroup } from '@/lib/groups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Calendar, Trash2, Wallet, UserPlus, Share2, Loader2, MessageSquareShare, ArrowRightLeft } from 'lucide-react';
import { AddGroupExpenseDialog } from './add-group-expense-dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export function GroupView({ groupId, onBack }: { groupId: string, onBack: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newMemberName, setNewMemberName] = useState("");
  const [showSettlements, setShowSettlements] = useState(false);

  const groupRef = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return doc(firestore, 'groups', groupId);
  }, [firestore, groupId]);

  const { data: groupData } = useDoc<Group>(groupRef);

  useEffect(() => {
    if (groupData?.lastActivityAt) {
      localStorage.setItem(`group_seen_${groupId}`, groupData.lastActivityAt.toMillis().toString());
    }
  }, [groupData, groupId]);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return query(
      collection(firestore, 'groups', groupId, 'expenses'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, groupId]);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return collection(firestore, 'groups', groupId, 'members');
  }, [firestore, groupId]);

  const { data: allExpenses, isLoading: isExpensesLoading } = useCollection<GroupExpense>(expensesQuery);
  const { data: members, isLoading: isMembersLoading } = useCollection<GroupMember>(membersQuery);

  const totalSpent = allExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const memberTotals = allExpenses?.reduce((acc, exp) => {
    acc[exp.paidBy] = {
      name: exp.paidByName,
      total: (acc[exp.paidBy]?.total || 0) + exp.amount
    };
    return acc;
  }, {} as Record<string, {name: string, total: number}>) || {};

  const settlements = useMemo(() => {
    if (!members || !allExpenses || allExpenses.length === 0 || totalSpent <= 0) return [];

    const numMembers = members.length;
    if (numMembers === 0) return [];
    
    const averageShare = totalSpent / numMembers;

    const paidByMemberMap: Record<string, number> = {};
    members.forEach(m => {
      paidByMemberMap[m.id] = 0;
    });

    allExpenses.forEach(exp => {
      const member = members.find(m => m.userId === exp.paidBy || m.id === exp.paidBy);
      if (member) {
        paidByMemberMap[member.id] += exp.amount;
      }
    });

    let balances = members.map(m => ({
      name: m.name,
      balance: (paidByMemberMap[m.id] || 0) - averageShare
    }));

    const results: { from: string, to: string, amount: number }[] = [];
    let debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    let creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    let dIdx = 0, cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      if (amount > 0.01) {
        results.push({ 
          from: debtor.name, 
          to: creditor.name, 
          amount: parseFloat(amount.toFixed(2)) 
        });
      }
      
      debtor.balance += amount;
      creditor.balance -= amount;
      
      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }

    return results;
  }, [members, allExpenses, totalSpent]);

  const handleShareId = async () => {
    const textToCopy = groupId;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      }
    } catch (err) {}
    if (copied) toast({ title: "ID Copied!" });
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Finovo Group Invite',
          text: `Join my Finovo group '${groupData?.name || 'Finance'}'! Use this ID: ${groupId}`,
          url: window.location.origin
        });
      } catch (err) {}
    }
  };

  const handleShareExpense = async (expense: GroupExpense) => {
    const message = `${t.shareMessage}${groupData?.name || 'our group'}. ${t.shareLinkText}${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Finovo Expense Update',
          text: message,
          url: window.location.origin
        });
      } catch (err) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleDeleteGroup = () => {
    if (!firestore || !groupId) return;
    deleteGroup(firestore, groupId);
    toast({ title: "Group Deleted" });
    onBack();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 pb-24 px-1">
      <div className="flex flex-col gap-3">
        <div className="relative flex items-center justify-center min-h-[40px]">
          <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-0 rounded-full h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-headline font-black uppercase tracking-tight truncate max-w-[200px] text-center px-8">
            {groupData?.name || "Loading..."}
          </h2>
          <div className="absolute right-0 flex gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl w-[92%] bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                  <AlertDialogDescription>This will remove the group for everyone. Action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground rounded-xl">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-nowrap overflow-hidden">
          <Button variant="outline" size="sm" onClick={handleShareId} className="h-7 px-3 rounded-xl uppercase text-[8px] gap-1.5 border-border shrink-0 bg-card">
            <Share2 className="w-2.5 h-2.5" /> Invite Friend
          </Button>
        </div>
      </div>

      <Card className="bg-card text-black border border-border/50 shadow-sm rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.totalGroupExpense}
            </span>
            <Wallet className="w-5 h-5 text-black opacity-20" />
          </div>
          <p className="text-4xl font-headline font-black text-black">₹{totalSpent.toLocaleString()}</p>
          
          <div className="pt-4 space-y-2 border-t border-muted/20">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Contributions</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(memberTotals).length > 0 ? Object.values(memberTotals).map((m, i) => (
                <div key={i} className="bg-muted/50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-border/30">
                  <span className="text-[10px] text-muted-foreground">{m.name}:</span>
                  <span className="text-[10px] font-black text-black">₹{m.total.toLocaleString()}</span>
                </div>
              )) : <span className="text-[10px] text-muted-foreground italic opacity-50">No contributions yet</span>}
            </div>
          </div>

          {settlements.length > 0 && (
            <div className="pt-4 border-t border-dashed border-muted/50">
              {!showSettlements ? (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSettlements(true)}
                  className="w-full h-10 rounded-xl text-[10px] uppercase font-black tracking-widest gap-2 text-primary/60 hover:text-primary"
                >
                  <ArrowRightLeft className="w-4 h-4" /> {t.viewSettlement}
                </Button>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase text-muted-foreground font-black tracking-widest flex items-center gap-2">
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Final Settlement
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSettlements(false)}
                      className="h-8 px-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t.hideSettlement}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {settlements.map((s, idx) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-xl flex items-center justify-between shadow-sm border border-border/10">
                        <p className="text-[11px] leading-tight">
                          <span className="font-bold uppercase">{s.from}</span>
                          <span className="mx-2 text-muted-foreground">pay to</span>
                          <span className="font-bold uppercase">{s.to}</span>
                        </p>
                        <span className="font-headline font-black text-sm">₹{s.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-xl p-1 mb-4">
          <TabsTrigger value="expenses" className="rounded-lg gap-2 uppercase text-[10px]">Expenses</TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg gap-2 uppercase text-[10px]">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 m-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Group Activity</h3>
            <AddGroupExpenseDialog groupId={groupId} groupName={groupData?.name || "Group"} />
          </div>

          {isExpensesLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-black opacity-30" /></div>
          ) : allExpenses && allExpenses.length > 0 ? (
            <div className="grid gap-3">
              {allExpenses.map((expense) => (
                <Card key={expense.id} className="border-none shadow-sm rounded-2xl overflow-hidden group bg-card border border-border/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">
                          {t.categories[expense.category as keyof typeof t.categories] || expense.category}
                        </Badge>
                        <h4 className="font-bold text-base leading-tight">{expense.description || expense.location}</h4>
                      </div>
                      <p className="text-xl font-headline font-black text-black">₹{expense.amount.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-muted-foreground uppercase tracking-tight">
                      <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 shrink-0" /> {expense.location}</div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3 h-3 shrink-0" /> 
                        {expense.transactionDate instanceof Timestamp 
                          ? format(expense.transactionDate.toDate(), 'dd MMM, HH:mm')
                          : format(new Date(expense.transactionDate as string), 'dd MMM, HH:mm')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-black text-black">
                          {expense.paidByName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest opacity-60">Paid by</span>
                          <span className="text-[10px] text-black uppercase font-bold">{expense.paidBy === user?.uid ? "Me" : expense.paidByName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/40 hover:text-primary" onClick={() => handleShareExpense(expense)}>
                          <MessageSquareShare className="w-4 h-4" />
                        </Button>
                        {expense.paidBy === user?.uid && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteGroupExpense(firestore!, groupId, expense.id)}>
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
            <div className="text-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10 text-muted-foreground text-[10px] uppercase">
              No expenses recorded yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4 m-0">
          <div className="bg-muted/30 p-4 rounded-3xl space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-black opacity-40" /> Manually Add Friend
            </h4>
            <div className="grid gap-2">
              <Input placeholder="Friend's Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="bg-card border-none h-10 rounded-xl" />
              <Button onClick={() => { if (firestore) addMemberToGroup(firestore, groupId, newMemberName); setNewMemberName(""); }} disabled={!newMemberName} className="h-10 rounded-xl uppercase tracking-widest text-[10px] gap-2 bg-primary text-primary-foreground">
                Add to List
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Current Members</h4>
            <div className="grid gap-2">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-card rounded-2xl border border-border/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-black font-bold text-xs">{member.name.charAt(0)}</div>
                    <div className="flex flex-col">
                      <span className="text-sm leading-tight">{member.name} {member.userId === user?.uid && "(Me)"}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-widest">ID: {member.id.substring(0,6)}</span>
                    </div>
                  </div>
                  {member.userId !== groupData?.createdBy && member.userId !== user?.uid && (
                    <Button variant="ghost" size="icon" onClick={() => { if (firestore) removeMemberFromGroup(firestore, groupId, member.id) }} className="h-8 w-8 text-muted-foreground/50"><Trash2 className="w-4 h-4" /></Button>
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