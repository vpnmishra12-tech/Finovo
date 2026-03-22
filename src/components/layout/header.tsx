"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleAppShare = async () => {
    const textToCopy = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: "Link Copied!", description: "App link saved to clipboard." });
      if (navigator.share) {
        await navigator.share({
          title: 'Finovo',
          text: 'Check out Finovo Expense Tracker!',
          url: textToCopy
        });
      }
    } catch (err) {}
  };
  
  return (
    <header className="sticky top-0 z-[100] w-full bg-[#1D4ED8] shrink-0 border-none">
      <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Change 1: Avatar icon replacing Wallet icon next to FINOVO */}
          <Avatar className="h-8 w-8 border border-white/20 shadow-sm">
            <AvatarFallback className="bg-white text-primary text-[10px] font-black uppercase">
              {user?.email?.charAt(0) || 'V'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1">
            <h1 className="font-headline font-black text-lg text-white tracking-tight uppercase leading-none">
              FINOVO
            </h1>
            <span className="text-white/40 text-[8px] font-medium lowercase self-end mb-0.5">business</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/10 rounded-full bg-white/5 border border-white/10" 
            onClick={handleAppShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
            <Bell className="w-3.5 h-3.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-[1rem] p-2 mt-2 shadow-2xl">
              <DropdownMenuLabel className="px-3 py-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Account</span>
                <span className="text-xs font-bold truncate text-primary">{user?.email || "Guest"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user && (
                <DropdownMenuItem onClick={logout} className="rounded-lg h-9 gap-2.5 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">Logout</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
