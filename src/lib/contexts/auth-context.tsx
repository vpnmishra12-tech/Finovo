
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
      // Show an initial feedback toast so user knows something started
      toast({
        title: "Starting Login...",
        description: "A Google login popup should appear. Please allow popups if blocked.",
      });

      await signInWithPopup(auth, googleProvider);
      
      toast({
        title: "Login Successful",
        description: "Welcome to SmartKharcha AI!",
      });
    } catch (error: any) {
      // Handle errors gracefully without triggering the red console error screen
      let errorMessage = "An unexpected error occurred during login.";
      let errorTitle = "Login Failed";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorTitle = "Domain Not Authorized";
        errorMessage = "CRITICAL: This domain is not in your Firebase 'Authorized Domains' list. Go to Firebase Console > Auth > Settings and add this URL.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorTitle = "Login Window Closed";
        errorMessage = "The login popup was closed before completion. This usually happens if popups are blocked or the domain isn't authorized. Check the README for the fix.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-In is not enabled in your Firebase Console.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorMessage = "Your browser blocked the login popup. Please click the 'Lock' icon in the address bar to allow popups.";
      } else if (error.message?.includes('cross-origin')) {
        errorTitle = "Browser Restriction";
        errorMessage = "Cross-origin issue detected. Ensure you are using the correct production URL and popups are enabled.";
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
