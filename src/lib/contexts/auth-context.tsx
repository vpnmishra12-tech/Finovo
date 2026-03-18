
"use client";

import React, { createContext, useContext, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
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
    if (!auth) return;

    try {
      // Directly initiate popup
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        toast({
          title: "Login Successful!",
          description: `Welcome, ${result.user.displayName}`,
        });
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let errorTitle = "Login Failed";
      let errorDescription = error.message || "An unknown error occurred.";

      // Specific error handling for common mobile issues
      if (error.code === 'auth/popup-closed-by-user') {
        errorTitle = "Login Window Closed";
        errorDescription = "Ensure you finish the Google sign-in. If it closed automatically, check if 'Third-party cookies' are ALLOWED in your browser settings.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorTitle = "Domain Not Authorized";
        errorDescription = "Add this domain to Firebase Console (without https://). Check README for steps.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorDescription = "Please click the icon in your address bar to allow popups for this site.";
      }

      toast({
        variant: "destructive",
        duration: 10000,
        title: errorTitle,
        description: errorDescription,
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "An error occurred while signing out.",
      });
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
