
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Group } from '@/lib/groups';
import { Card, CardContent } from '@/components/ui/card';
import { CreateGroupDialog } from './create-group-dialog';
import { GroupView } from './group-view';
import { Users, ChevronRight } from 'lucide-react';

export function GroupModule() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Simplified query: Removed orderBy to avoid index-related permission issues
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: groups, isLoading } = useCollection<Group>(groupsQuery);

  if (selectedGroupId) {
    return <GroupView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-headline font-black uppercase tracking-tight">{t.groups}</h2>
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
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl overflow-hidden active:scale-[0.98]"
              onClick={() => setSelectedGroupId(group.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                      {group.memberIds.length} {t.addMember}s
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-muted/20 rounded-3xl border-2 border-dashed border-muted/50">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-muted-foreground/50 w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl mb-2">{t.noGroups}</h3>
          <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed mb-6">
            {t.groupDesc}
          </p>
          <CreateGroupDialog />
        </div>
      )}
    </div>
  );
}
