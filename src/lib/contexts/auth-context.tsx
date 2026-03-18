
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
  const [googleProvider] = useState(() => new GoogleAuthProvider());

  const login = async () => {
    try {
      // We trigger the popup immediately to ensure it's seen as a direct user action
      const loginPromise = signInWithPopup(auth, googleProvider);
      
      toast({
        title: "Login Started",
        description: "Please complete the sign-in in the new window.",
      });

      await loginPromise;
      
      toast({
        title: "Login Successful",
        description: "Welcome to SmartKharcha AI!",
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred during login.";
      let errorTitle = "Login Failed";
      
      // Map Firebase auth errors to helpful user messages
      if (error.code === 'auth/unauthorized-domain') {
        errorTitle = "Domain Not Authorized";
        errorMessage = "Go to Firebase Console > Auth > Settings > Authorized Domains and add this domain. See README.md for details.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorTitle = "Window Closed";
        errorMessage = "The login window was closed. Please ensure you finish the sign-in process in the popup.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorMessage = "Browser blocked the login window. Look for the 'Blocked Popup' icon in your address bar (top right) and select 'Always allow'.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        return; // Ignore multiple clicks
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
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      // Silently handle logout errors
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
