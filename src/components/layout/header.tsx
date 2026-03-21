
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Wallet, Share2, Bell, Settings, LogOut, Copy } from 'lucide-react';
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
    const textToCopy = typeof window !== 'undefined' ? window.location.origin : '';
    const shareData = {
      title: 'Finovo - Expense Tracker',
      text: 'Check out Finovo, the ultimate AI-powered expense tracker!',
      url: textToCopy
    };

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      }
    } catch (err) {
      console.warn("Clipboard API failed", err);
    }

    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy failed", err);
      }
    }

    if (copied) {
      toast({ title: "Link Copied!", description: "App link saved to clipboard." });
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    }
  };
  
  return (
    <header className="sticky top-0 z-[100] w-full bg-[#1D4ED8] shrink-0 border-none">
      <div className="container flex h-20 items-center justify-between px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl border border-white/10">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline font-black text-2xl text-white tracking-tight uppercase leading-none">
              FINOVO
            </h1>
            <span className="text-white/60 text-[11px] font-bold lowercase">business</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleAppShare} 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 text-white bg-white/10 rounded-full hover:bg-white/20"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
            <Bell className="w-6 h-6" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 mt-2 shadow-2xl">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Account</span>
                <span className="text-sm font-bold truncate text-primary">{user?.email || "Guest"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAppShare} className="rounded-xl h-11 gap-3 cursor-pointer">
                <Copy className="w-4 h-4" />
                <span className="font-bold text-sm">Copy App Link</span>
              </DropdownMenuItem>
              {user && (
                <DropdownMenuItem onClick={logout} className="rounded-xl h-11 gap-3 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span className="font-bold text-sm">Logout</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
