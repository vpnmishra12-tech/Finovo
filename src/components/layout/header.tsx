"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages, LogOut, Settings, Wallet, Share2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'SmartKharcha AI',
      text: 'Manage your money smartly with SmartKharcha AI! 💸 Neon Orange-Pink Edition.',
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "App link copied to clipboard.",
        });
      } catch (clipError) {
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Could not share or copy the link.",
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Neon Gradient Wallet Icon Container */}
          <div className="bg-gradient-to-br from-[#FF9D00] via-[#E91E63] to-[#7C3AED] p-2 rounded-xl shadow-lg shadow-primary/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline font-black text-lg leading-tight tracking-tight bg-gradient-to-r from-[#FF9D00] to-[#E91E63] bg-clip-text text-transparent uppercase">
              {t.appName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9">
            <Share2 className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="hidden sm:flex h-8"
          >
            <Languages className="w-4 h-4 mr-2" />
            {language === 'en' ? 'हिन्दी' : 'English'}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black leading-none uppercase">{user.email?.split('@')[0] || 'User'}</p>
                    <p className="text-[10px] leading-none text-muted-foreground font-bold">ID: {user.uid.substring(0, 8).toUpperCase()}...</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="font-black text-[10px] uppercase">
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="font-black text-[10px] uppercase">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.settings}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground font-black text-[10px] uppercase">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}