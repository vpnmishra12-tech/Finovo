
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
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Login Successful",
        description: "Welcome to SmartKharcha AI!",
      });
    } catch (error: any) {
      // Log the error for developer reference
      console.error("Login failed:", error.code, error.message);
      
      let errorMessage = "An unexpected error occurred during login.";
      let errorTitle = "Login Error";
      
      // Specific handling for common environment issues
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain not authorized! Please go to Firebase Console > Auth > Settings > Authorized Domains and add your current URL.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorTitle = "Login Cancelled";
        errorMessage = "The login window was closed. Please try again and ensure popups are allowed in your browser settings.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-In is not enabled in your Firebase Console.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorMessage = "Your browser blocked the login popup. Please allow popups for this site and try again.";
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
      console.error("Logout failed", error);
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
