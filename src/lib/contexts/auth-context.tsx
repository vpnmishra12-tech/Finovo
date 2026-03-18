
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
      // Check if we previously initiated a login
      const loginStarted = sessionStorage.getItem('login_initiated');

      try {
        const result = await getRedirectResult(auth);
        
        if (result) {
          sessionStorage.removeItem('login_initiated');
          toast({
            title: "Login Successful!",
            description: `Welcome, ${result.user.displayName}`,
          });
        } else if (loginStarted && !user && !isUserLoading) {
          // This case happens when you are redirected back but the handshake failed
          // Usually due to cookies or unauthorized domain
          toast({
            variant: "destructive",
            duration: 10000,
            title: "CRITICAL: Handshake Failed",
            description: "Redirect returned with NO user. 1. Ensure Third-Party Cookies are ALLOWED (NOT Blocked). 2. Double check Authorized Domains in Firebase Console.",
          });
          sessionStorage.removeItem('login_initiated');
        }
      } catch (error: any) {
        sessionStorage.removeItem('login_initiated');
        console.error("Redirect Error:", error);
        
        let errorTitle = "Login Error";
        let errorDescription = error.message || "An unknown error occurred.";

        if (error.code === 'auth/unauthorized-domain') {
          errorTitle = "Domain Not Authorized";
          errorDescription = "Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add this exact URL.";
        } else if (error.code === 'auth/network-request-failed') {
          errorTitle = "Cookie Blocked";
          errorDescription = "Your browser is blocking the login cookie. Go to Browser Settings -> Privacy -> Third-Party Cookies -> ALLOW ALL.";
        }

        toast({
          variant: "destructive",
          duration: 10000,
          title: errorTitle,
          description: errorDescription,
        });
      }
    };

    if (auth) {
      checkRedirect();
    }
  }, [auth, user, isUserLoading, toast]);

  const login = async () => {
    try {
      toast({
        title: "Redirecting...",
        description: "Taking you to Google Login page.",
      });
      
      // Mark that we started the login process
      sessionStorage.setItem('login_initiated', 'true');
      
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      sessionStorage.removeItem('login_initiated');
      console.error("Login Trigger Error:", error);
      toast({
        variant: "destructive",
        title: "Redirect Failed",
        description: error.message || "Could not initiate login redirect.",
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
