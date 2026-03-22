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
    <header className="sticky top-0 z-[100] w-full bg-primary shrink-0 border-none">
      <div className="container relative flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white/20 shadow-sm">
            <AvatarFallback className="bg-white text-primary text-[10px] uppercase">
              {user?.email?.charAt(0) || 'V'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Centered Dashboard Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="font-headline font-black text-lg text-white tracking-tight uppercase leading-none">
            DASHBOARD
          </h1>
        </div>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-7 w-7 bg-white text-primary hover:bg-white/90 rounded-full border border-white/20 shadow-sm p-0 flex items-center justify-center"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1rem] p-2 mt-2 shadow-2xl">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-0.5">Account</span>
                <span className="text-xs truncate text-primary">{user?.email || "Guest User"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleAppShare} className="rounded-lg h-10 gap-3 cursor-pointer">
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">Share App</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="rounded-lg h-10 gap-3 cursor-pointer">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">Notifications</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              {user && (
                <DropdownMenuItem onClick={logout} className="rounded-lg h-10 gap-3 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs">Logout</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}