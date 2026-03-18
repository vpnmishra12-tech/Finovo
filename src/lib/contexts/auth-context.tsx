
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
        // Attempt to get the result of the redirect
        const result = await getRedirectResult(auth);
        
        if (result) {
          toast({
            title: "Login Successful!",
            description: `Welcome, ${result.user.displayName}`,
          });
        }
      } catch (error: any) {
        console.error("Redirect Error:", error);
        
        let errorTitle = "Login Error";
        let errorDescription = error.message || "An unknown error occurred.";

        if (error.code === 'auth/unauthorized-domain') {
          errorTitle = "Domain Not Authorized";
          errorDescription = "Ensure your workstation URL is added to 'Authorized Domains' in Firebase Console Settings.";
        } else if (error.code === 'auth/network-request-failed') {
          errorTitle = "Network/Cookie Issue";
          errorDescription = "Please ensure 'Third-Party Cookies' are ALLOWED in your browser settings.";
        }

        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorDescription,
        });
      }
    };

    if (auth) {
      checkRedirect();
    }
  }, [auth, toast]);

  const login = async () => {
    try {
      toast({
        title: "Starting Login...",
        description: "Redirecting you to Google Account selection.",
      });
      
      // Redirect is essential for reliable operation in restricted environments
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Trigger Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed to Start",
        description: error.message || "Could not initiate redirect.",
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
