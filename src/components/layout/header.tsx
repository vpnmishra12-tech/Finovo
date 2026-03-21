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
    const textToCopy = window.location.origin;
    const shareData = {
      title: 'Finovo - Expense Tracker',
      text: 'Check out Finovo, the ultimate AI-powered expense tracker!',
      url: textToCopy
    };

    let copied = false;

    // Try Clipboard API
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      }
    } catch (err) {
      console.warn("Clipboard API failed", err);
    }

    // Fallback for non-secure
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

    // Trigger native share if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Silent
      }
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-white/10">
      <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/15 p-1.5 rounded-xl border border-white/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-headline font-black text-xl text-white tracking-tight uppercase">
            FINOVO <span className="text-white/50 text-xs font-bold lowercase tracking-normal">business</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced Share Button */}
          <Button 
            onClick={handleAppShare} 
            variant="outline" 
            className="h-9 px-4 text-white border-white/20 hover:bg-white/10 rounded-xl gap-2 hidden sm:flex"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Share App</span>
          </Button>

          {/* Mobile Share Icon */}
          <Button onClick={handleAppShare} variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 sm:hidden">
            <Share2 className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 mt-2">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Logged in as</span>
                <span className="text-sm font-bold truncate text-primary">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAppShare} className="rounded-xl h-11 gap-3 cursor-pointer">
                <Copy className="w-4 h-4" />
                <span className="font-bold text-sm">Copy App Link</span>
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
