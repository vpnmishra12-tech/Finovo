"use client";

import React, { createContext, useContext, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { useAuth as useFirebaseServiceAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseServiceAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [googleProvider] = useState(() => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  });

  const login = async () => {
    try {
      // CRITICAL: We trigger the popup as the VERY FIRST ACTION.
      // Any delay (like state updates or toasts) before this can cause 
      // mobile browsers to block the popup even if "allowed" in settings.
      const loginPromise = signInWithPopup(auth, googleProvider);
      
      // Now we can show a hint to the user
      toast({
        title: "Sign-in Started",
        description: "Please complete the login in the new window.",
      });

      await loginPromise;
      
      toast({
        title: "Success",
        description: "Welcome back!",
      });
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      let errorTitle = "Authentication Error";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorTitle = "Domain Not Authorized";
        errorMessage = "You must whitelist this domain in Firebase Console > Auth > Settings > Authorized Domains.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorTitle = "Login Cancelled";
        errorMessage = "The login window was closed. On mobile, look for a small 'Pop-up blocked' bar at the BOTTOM and click 'Always show'.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorMessage = "Your browser blocked the login window. Please allow popups for this site.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        return; 
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "See you soon!",
      });
    } catch (error) {
      // Silently handle
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading: isUserLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
