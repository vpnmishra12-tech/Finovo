"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export function VoiceInput({ onExtracted }: { onExtracted: (data: any) => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        
        if (process.env.NEXT_PUBLIC_IS_EXPORT === 'true') {
           toast({ title: "AI Offline", description: "AI voice features are not available in APK builds." });
           return;
        }

        setIsProcessing(true);
        try {
          // @ts-ignore - centralized actions isolated for export
          const { extractVoiceExpense } = await import('@/ai/server-actions');
          if (!extractVoiceExpense) throw new Error("AI Offline");
          const result = await extractVoiceExpense({ transcribedText: transcript });
          onExtracted(result);
        } catch (error) {
          console.error("Voice extraction error", error);
          toast({ variant: 'destructive', title: 'Offline Mode', description: 'AI features are restricted in APK builds.' });
        } finally {
          setIsProcessing(false);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [onExtracted, toast]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 gap-4">
      <div className="relative">
        {isListening && (
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        )}
        <Button
          size="icon"
          variant={isListening ? "destructive" : "default"}
          className="w-16 h-16 rounded-full shadow-xl relative z-10 transition-all active:scale-95"
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
      </div>
      <p className="text-[10px] font-bold text-center text-muted-foreground uppercase px-4 tracking-tighter">
        {isProcessing ? t.actions.extracting : isListening ? "Listening..." : t.captions.voice}
      </p>
    </div>
  );
}
