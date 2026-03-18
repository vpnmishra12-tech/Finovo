
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
        const result = await getRedirectResult(auth);
        if (result) {
          toast({
            title: "Login Successful",
            description: `Welcome, ${result.user.displayName}!`,
          });
        }
      } catch (error: any) {
        console.error("Auth Redirect Error:", error.code, error.message);
        
        if (error.code === 'auth/unauthorized-domain') {
          toast({
            variant: "destructive",
            title: "Domain Not Authorized",
            description: "Please double check your Firebase Console 'Authorized Domains' list. It must exactly match the URL in your browser without https://.",
          });
        } else if (error.code === 'auth/internal-error') {
          toast({
            variant: "destructive",
            title: "Auth Error",
            description: "Try clearing your browser cache or using a non-private window.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "An error occurred during the login redirect.",
          });
        }
      }
    };

    checkRedirect();
  }, [auth, toast]);

  const login = async () => {
    try {
      toast({
        title: "Starting Login",
        description: "Redirecting to Google. Please wait...",
      });
      
      // Redirect is the most reliable method for workstations and mobile
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Initiation Error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Could not initiate the sign-in process.",
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
      console.error("Logout Error:", error);
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
