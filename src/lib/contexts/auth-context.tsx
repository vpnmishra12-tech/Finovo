
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
            description: `Logged in as ${result.user.displayName}`,
          });
        }
      })
      .catch((error: any) => {
        console.error("Redirect Result Error:", error.code, error.message);
        
        if (error.code === 'auth/unauthorized-domain') {
          toast({
            title: "Domain Not Authorized",
            description: "CRITICAL: You must add your current URL to the Firebase Authorized Domains list. Check README.md for steps.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Error",
            description: error.message || "An unexpected error occurred during redirection.",
            variant: "destructive",
          });
        }
      });
  }, [auth, toast]);

  const login = async () => {
    try {
      toast({
        title: "Starting Login",
        description: "Redirecting to Google...",
      });
      
      // Redirect is much more reliable on mobile and workstations than popups
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Initiation Error:", error.code, error.message);
      toast({
        title: "Login Error",
        description: "Could not start sign-in process. Check your internet connection.",
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
