
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signOut, 
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInAnonymously
} from 'firebase/auth';
import { useAuth as useFirebaseServiceAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  isOtpSent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseServiceAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Initialize Recaptcha
  const setupRecaptcha = (containerId: string) => {
    if (!auth) return null;
    try {
      if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
        return (window as any).recaptchaVerifier;
      }
      
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
      if (typeof window !== 'undefined') {
        (window as any).recaptchaVerifier = verifier;
      }
      return verifier;
    } catch (error) {
      console.error("Recaptcha setup error:", error);
      return null;
    }
  };

  const sendOtp = async (phoneNumber: string) => {
    if (!auth) return;

    // Basic format check
    if (!phoneNumber.startsWith('+')) {
      toast({
        variant: "destructive",
        title: "Format Error",
        description: "Please use +91 format (e.g., +91 9876543210)",
      });
      return;
    }

    try {
      toast({ title: "Sending OTP...", description: `Sending code to ${phoneNumber}` });
      
      const appVerifier = setupRecaptcha('recaptcha-container');
      if (!appVerifier) throw new Error("Recaptcha not initialized");

      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
      
      toast({
        title: "OTP Sent!",
        description: "Please check your messages.",
      });
    } catch (error: any) {
      console.error("OTP Error Details:", error);
      
      let errorMessage = "Something went wrong. Please check your network.";
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "IMPORTANT: Phone Auth is NOT ACTIVE in Firebase Console. Please enable it and SAVE.";
      } else if (error.code === 'auth/billing-not-enabled') {
        errorMessage = "BILLING REQUIRED: Phone Auth needs a 'Blaze Plan'. Please use 'Guest Mode' for now.";
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number. Use +91 followed by 10 digits.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Wait 10 minutes and try again.";
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) return;

    try {
      toast({ title: "Verifying...", description: "Checking your code" });
      const result = await confirmationResult.confirm(otp);
      if (result.user) {
        toast({
          title: "Login Successful!",
          description: "Welcome to SmartKharcha AI",
        });
        setIsOtpSent(false);
        setConfirmationResult(null);
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please check the code and try again.",
      });
    }
  };

  const loginAsGuest = async () => {
    if (!auth) return;
    try {
      toast({ title: "Entering Guest Mode...", description: "Setting up your workspace" });
      await signInAnonymously(auth);
      toast({
        title: "Welcome Guest!",
        description: "You can now track your expenses.",
      });
    } catch (error: any) {
      console.error("Guest Login Error:", error);
      toast({
        variant: "destructive",
        title: "Guest Mode Failed",
        description: "Please check your internet connection.",
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
    <AuthContext.Provider value={{ user, loading: isUserLoading, sendOtp, verifyOtp, loginAsGuest, logout, isOtpSent }}>
      {children}
      <div id="recaptcha-container"></div>
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
