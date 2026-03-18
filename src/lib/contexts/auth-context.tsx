
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
      console.error("Login failed:", error.code, error.message);
      
      let errorMessage = "An unexpected error occurred during login.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized in Firebase Console. Please follow the steps in README.md.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login popup was closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Another login request is already in progress.";
      }

      toast({
        title: "Login Error",
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
