"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export function CameraInput({ onExtracted }: { onExtracted: (data: any) => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (process.env.NEXT_PUBLIC_IS_EXPORT === 'true') {
      toast({ 
        title: "AI Offline", 
        description: "Camera extraction is not available in the APK build. Please type manually.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        try {
          // @ts-ignore - centralized actions isolated for export
          const { extractBillPhotoExpense } = await import('@/ai/server-actions');
          if (!extractBillPhotoExpense) throw new Error("AI Offline");
          
          const result = await extractBillPhotoExpense({ billPhotoDataUri: dataUri });
          onExtracted({
            ...result,
            description: `Bill from ${result.merchant}`
          });
        } catch (err) {
          toast({ variant: 'destructive', title: 'Offline Mode', description: 'AI features are restricted in APK builds.' });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Camera extraction error", error);
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 gap-4">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={onFileChange}
      />
      
      <div className="grid grid-cols-1 gap-3 w-full px-4">
        <Button
          size="lg"
          className="h-12 gap-2 font-black uppercase text-[10px] tracking-widest rounded-xl"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Capture Bill
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 gap-2 font-black uppercase text-[10px] tracking-widest rounded-xl border-primary/20"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) processImage(file);
            };
            input.click();
          }}
          disabled={isProcessing}
        >
          <ImageIcon className="w-4 h-4" />
          Gallery
        </Button>
      </div>
      
      <p className="text-[10px] font-bold text-center text-muted-foreground uppercase px-4 tracking-tighter">
        {isProcessing ? t.actions.extracting : t.captions.camera}
      </p>
    </div>
  );
}
