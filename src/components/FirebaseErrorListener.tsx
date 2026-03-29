'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Listens for globally emitted 'permission-error' events.
 * Instead of throwing and crashing the app, it now shows a destructive toast
 * and logs the error, allowing the app to stay functional.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log for developer context in console
      console.warn("Firestore Permission Error handled gracefully:", error.message);
      
      // Show a non-crashing toast to the user
      toast({
        variant: "destructive",
        title: "Session Sync Issue",
        description: "Your session might have expired. Please refresh or log in again.",
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
