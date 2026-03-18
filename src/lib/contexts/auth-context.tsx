
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
    const checkRedirect = async () => {
      try {
        // Step 1: Tell the user we are checking the result
        const result = await getRedirectResult(auth);
        
        if (result) {
          toast({
            title: "Success!",
            description: `Logged in as ${result.user.displayName}`,
          });
        } else {
          // If result is null, it means no login was attempted or it's a fresh load
          // We don't show a message here to avoid annoying the user on every refresh
        }
      } catch (error: any) {
        // Step 2: Catch every possible error and show it in a Red Toast
        let errorTitle = "Login Failed";
        let errorDescription = error.message || "An error occurred.";

        if (error.code === 'auth/unauthorized-domain') {
          errorTitle = "Domain Not Authorized";
          errorDescription = "Go to Firebase Console > Auth > Settings > Authorized Domains and add your current workstation URL (without https://).";
        } else if (error.code === 'auth/network-request-failed') {
          errorTitle = "Network Error";
          errorDescription = "Check your internet connection or browser privacy settings.";
        }

        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorDescription,
        });
      }
    };

    checkRedirect();
  }, [auth, toast]);

  const login = async () => {
    try {
      toast({
        title: "Redirecting...",
        description: "Opening Google Sign-in. Please wait...",
      });
      
      // Redirect is the only method that works reliably in Cloud Workstations
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Could not start the login process.",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "Goodbye!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log out.",
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
