"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Group, joinGroup } from '@/lib/groups';
import { Card, CardContent } from '@/components/ui/card';
import { CreateGroupDialog } from './create-group-dialog';
import { GroupView } from './group-view';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function GroupModule() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: groups, isLoading } = useCollection<Group>(groupsQuery);

  const handleJoin = async () => {
    if (!firestore || !user?.uid || !joinId) return;
    setIsJoining(true);
    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Friend";
      await joinGroup(firestore, joinId, user.uid, userName);
      toast({ title: "Joined!", description: "You are now part of the group." });
      setIsJoinDialogOpen(false);
      setJoinId("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Join Failed", description: "Invalid Group ID or permission denied." });
    } finally {
      setIsJoining(false);
    }
  };

  if (selectedGroupId) {
    return <GroupView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return (
    <div className="space-y-4 pb-20 px-1">
      {/* Changed top boxes from blue to white/off-white */}
      <div className="grid grid-cols-3 gap-1.5 w-full mb-4">
        {/* Uniform White Box for Groups Title */}
        <div className="h-9 bg-white text-black flex items-center justify-center rounded-xl uppercase tracking-widest text-[9px] shadow-sm text-center px-1 border border-border/50">
          {t.groups}
        </div>
        
        {/* Uniform White Box for Join Group Button */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 w-full bg-white text-black hover:bg-muted rounded-xl uppercase tracking-widest text-[9px] shadow-sm border border-border/50 px-1">
              {t.joinGroup}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[92%] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline font-black uppercase">Join a Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-[10px] text-muted-foreground uppercase">Enter the Group ID shared by your friend</p>
              <Input 
                placeholder="Paste ID here..." 
                value={joinId} 
                onChange={(e) => setJoinId(e.target.value)}
                className="h-12 rounded-xl bg-muted border-none"
              />
              <Button onClick={handleJoin} disabled={!joinId || isJoining} className="w-full h-12 rounded-xl uppercase tracking-widest text-[11px]">
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Now"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Group Dialog Trigger (White) */}
        <CreateGroupDialog />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl overflow-hidden active:scale-[0.98] bg-white"
              onClick={() => setSelectedGroupId(group.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {group.memberIds.length} {t.membersList}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-muted-foreground/50 w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl mb-2">{t.noGroups}</h3>
          <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed mb-6">
            Create a group or ask a friend for their Group ID to join.
          </p>
          <CreateGroupDialog />
        </div>
      )}
    </div>
  );
}
