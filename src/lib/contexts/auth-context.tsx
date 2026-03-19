"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { useAuth as useFirebaseServiceAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseServiceAuth();
  // Immediate check for current user to reduce loading flicker
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) return;
    
    // High-speed auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (isMounted.current) {
        setUser(firebaseUser);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [auth]);

  const login = async (email: string, password: string) => {
    if (!auth) return;
    try {
      toast({ title: "Logging in...", description: "Please wait" });
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful!", description: "Welcome back!" });
    } catch (error: any) {
      console.error("Login Error:", error);
      let message = "Invalid email or password.";
      if (error.code === 'auth/user-not-found') message = "Account not found. Please sign up.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    }
  };

  const signup = async (email: string, password: string) => {
    if (!auth) return;
    try {
      toast({ title: "Creating Account...", description: "Please wait" });
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Success!", description: "Account created successfully." });
    } catch (error: any) {
      console.error("Signup Error:", error);
      let message = "Could not create account.";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: message,
      });
    }
  };

  const logout = async () => {
    if (!auth) return;
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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