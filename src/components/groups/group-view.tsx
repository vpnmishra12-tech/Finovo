
"use client";

import { useState } from 'react';
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
import { ArrowLeft, MapPin, Calendar, Trash2, Wallet, Users, UserPlus, CheckCircle2, Share2, Copy, Loader2 } from 'lucide-react';
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
      orderBy('createdAt', 'desc')
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

  const handleShareId = async () => {
    const text = `Join my Finovo group '${groupData?.name}'! Use this ID to join: ${groupId}`;
    
    // Attempt Share first if available
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Finovo Group Invite', text });
        return; // Success, exit
      } catch (e) {
        // User cancelled or share failed, proceed to clipboard fallback
        console.log('Share dismissed or failed', e);
      }
    }

    // Fallback: Clipboard API (Requires document focus)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(groupId);
        toast({ title: "Copied!", description: "Group ID copied to clipboard." });
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      // If clipboard also fails (e.g., document not focused), show the ID to user
      toast({ 
        title: "Group ID", 
        description: `ID: ${groupId}. Please copy manually.`,
      });
    }
  };

  const handleAddMember = () => {
    if (!firestore || !groupId || !newMemberName) return;
    addMemberToGroup(firestore, groupId, newMemberName, newMemberMobile);
    setNewMemberName("");
    setNewMemberMobile("");
    toast({ title: "Member Added", description: `${newMemberName} added to the list.` });
  };

  const handleDeleteExpense = (id: string) => {
    if (!firestore || !groupId) return;
    deleteGroupExpense(firestore, groupId, id);
    toast({ title: "Deleted", description: "Expense removed." });
  };

  const handleDeleteGroup = () => {
    if (!firestore || !groupId) return;
    deleteGroup(firestore, groupId);
    toast({ title: "Group Deleted", description: "Group removed." });
    onBack();
  };

  const handleRemoveMember = (memberId: string) => {
    if (!firestore || !groupId) return;
    removeMemberFromGroup(firestore, groupId, memberId);
    toast({ title: "Removed", description: "Member removed." });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 pb-24 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-lg font-headline font-black uppercase tracking-tight truncate max-w-[150px]">{groupData?.name || "Loading..."}</h2>
            {groupData?.createdAt && (
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                Started: {format(groupData.createdAt.toDate(), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleShareId} className="h-8 rounded-xl font-black uppercase text-[9px] gap-2 border-primary/20">
            <Share2 className="w-3 h-3" /> Invite
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl w-[92%]">
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

      <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{t.totalGroupExpense}</span>
            <Wallet className="w-5 h-5 opacity-40" />
          </div>
          <p className="text-4xl font-headline font-black">₹{totalSpent.toLocaleString()}</p>
          
          <div className="pt-4 space-y-2 border-t border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Contributions</p>
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
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-xl p-1 mb-4">
          <TabsTrigger value="expenses" className="rounded-lg gap-2 font-black text-[10px] uppercase">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg gap-2 font-black text-[10px] uppercase">
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 m-0">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
            <AddGroupExpenseDialog groupId={groupId} />
          </div>

          {isExpensesLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : expenses && expenses.length > 0 ? (
            <div className="grid gap-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="border-none shadow-sm rounded-2xl overflow-hidden group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter">
                          {t.categories[expense.category as keyof typeof t.categories] || expense.category}
                        </Badge>
                        <h4 className="font-bold text-base leading-tight">{expense.description || expense.location}</h4>
                      </div>
                      <p className="text-xl font-headline font-black text-primary">₹{expense.amount.toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
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
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                          {expense.paidByName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Paid by</span>
                          <span className="text-[10px] font-black text-primary uppercase">{expense.paidBy === user?.uid ? "Me" : expense.paidByName}</span>
                        </div>
                      </div>
                      
                      {expense.paidBy === user?.uid && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10 text-muted-foreground text-[10px] font-black uppercase">
              No expenses yet. Add one!
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4 m-0">
          <div className="bg-muted/30 p-4 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Manually Add Friend
            </h4>
            <div className="grid gap-2">
              <Input placeholder="Friend's Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="bg-card border-none h-10 rounded-xl font-bold" />
              <Input placeholder="Mobile (Optional)" value={newMemberMobile} onChange={(e) => setNewMemberMobile(e.target.value)} className="bg-card border-none h-10 rounded-xl font-bold" />
              <Button onClick={handleAddMember} disabled={!newMemberName} className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2">
                Add to List
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Members</h4>
            <div className="grid gap-2">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-card rounded-2xl border border-primary/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight">{member.name} {member.userId === user?.uid && "(Me)"}</span>
                      <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">{member.mobile || "ID: " + member.id.substring(0,6)}</span>
                    </div>
                  </div>
                  {member.userId !== groupData?.createdBy && member.userId !== user?.uid && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} className="h-8 w-8 text-muted-foreground/50">
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
