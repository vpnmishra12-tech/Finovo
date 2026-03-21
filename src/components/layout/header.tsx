
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Wallet, Share2, Bell } from 'lucide-react';

export function Header() {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-white/10 shadow-md">
      <div className="container flex h-14 items-center justify-between px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-headline font-black text-lg text-white tracking-tight uppercase">
            Finovo <span className="text-white/60 text-xs font-bold lowercase">business</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
