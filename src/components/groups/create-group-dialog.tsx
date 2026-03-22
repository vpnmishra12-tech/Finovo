"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore } from '@/firebase';
import { createGroup } from '@/lib/groups';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CreateGroupDialog() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<{name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMemberField = () => {
    setMembers([...members, { name: "" }]);
  };

  const removeMemberField = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index].name = value;
    setMembers(newMembers);
  };

  const handleCreate = async () => {
    if (!firestore || !user?.uid || !groupName) return;
    
    setIsSubmitting(true);
    try {
      await createGroup(firestore, user.uid, groupName, members);
      toast({ title: "Group Created!", description: `${groupName} is ready.` });
      setOpen(false);
      setGroupName("");
      setMembers([]);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create group." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-9 bg-card text-black hover:bg-muted rounded-xl font-black uppercase tracking-widest text-[9px] shadow-sm border border-border/50 px-1">
          {t.createGroup}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95%] rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-muted text-foreground border-b border-border/50">
          <DialogTitle className="font-headline font-black uppercase">{t.createGroup}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6 bg-card">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.groupName}</Label>
            <Input 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Goa Trip 2024"
              className="h-12 rounded-xl bg-muted border-none font-bold"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.addMember}s</Label>
              <Button variant="ghost" size="sm" onClick={addMemberField} className="h-8 text-[9px] font-black uppercase text-black opacity-60">
                <UserPlus className="w-3 h-3 mr-1" /> {t.addPerson}
              </Button>
            </div>
            
            {members.map((m, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-2xl border border-border/30">
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder={t.memberName} 
                    value={m.name} 
                    onChange={(e) => updateMember(i, e.target.value)}
                    className="h-10 bg-card border-none rounded-lg text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeMemberField(i)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={!groupName || isSubmitting}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-black text-white hover:bg-black/90"
          >
            {isSubmitting ? "Creating..." : <><CheckCircle2 className="w-5 h-5" /> {t.save}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
