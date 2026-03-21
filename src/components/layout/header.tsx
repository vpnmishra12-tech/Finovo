
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Wallet, Share2, Bell, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
    const textToCopy = window.location.origin;
    const shareData = {
      title: 'Finovo - Expense Tracker',
      text: 'Check out Finovo, the professional AI expense tracker!',
      url: textToCopy
    };

    let copied = false;
    
    // Attempt standard clipboard API
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      }
    } catch (err) {}

    // Fallback for older browsers or non-secure contexts
    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {}
    }

    if (copied) {
      toast({ title: "Link Copied!", description: "App link saved to clipboard." });
    }

    // Trigger native share if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    }
  };
  
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 mt-2">
              <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logged in as</span>
                <span className="text-sm font-bold truncate text-primary">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAppShare} className="rounded-xl h-11 gap-3 cursor-pointer">
                <Share2 className="w-4 h-4" />
                <span className="font-bold text-sm">Share App</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="rounded-xl h-11 gap-3 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                <span className="font-bold text-sm">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
