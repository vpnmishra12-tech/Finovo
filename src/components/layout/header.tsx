
"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages, LogOut, Settings, Wallet, LogIn, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { user, logout, login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'SmartKharcha AI',
      text: 'Check out my smart expense tracker!',
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (error) {
      // Fallback: Copy to clipboard if sharing fails or isn't supported
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "App link copied to clipboard. Share it with your friends!",
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
          <div className="bg-primary p-1.5 rounded-lg shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.appName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9" title="Share App">
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.settings}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={login} className="rounded-xl gap-2 h-9 border-primary/20 hover:bg-primary/5">
              <LogIn className="w-4 h-4" />
              <span className="hidden xs:inline">{t.loginWithGoogle}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
