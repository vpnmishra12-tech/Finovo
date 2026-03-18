
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
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

  // Handle the redirect result when the component mounts
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: "Success",
            description: "Welcome back!",
          });
        }
      })
      .catch((error: any) => {
        if (error.code === 'auth/unauthorized-domain') {
          toast({
            title: "Domain Not Authorized",
            description: "Please check your Firebase Console settings for Authorized Domains. See README.md for steps.",
            variant: "destructive",
          });
        } else if (error.code !== 'auth/popup-closed-by-user') {
          // General error handling
          console.error("Auth error:", error);
          toast({
            title: "Login Error",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
      });
  }, [auth, toast]);

  const login = async () => {
    try {
      // Use signInWithRedirect instead of signInWithPopup for maximum reliability on mobile
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: "Could not start sign-in process. Please try again.",
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
