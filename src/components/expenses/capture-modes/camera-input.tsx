"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/language-context';
import { extractBillPhotoExpense } from '@/ai/flows/extract-bill-photo-expense';

export function CameraInput({ onExtracted }: { onExtracted: (data: any) => void }) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const result = await extractBillPhotoExpense({ billPhotoDataUri: dataUri });
        onExtracted({
          ...result,
          description: `Bill from ${result.merchant}`
        });
        setIsProcessing(false);
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
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={onFileChange}
      />
      
      <div className="grid grid-cols-1 gap-4 w-full px-8">
        <Button
          size="lg"
          className="h-16 gap-3 font-medium text-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6" />
              Capture Bill
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16 gap-3"
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
          <ImageIcon className="w-6 h-6" />
          Upload from Gallery
        </Button>
      </div>
      
      <p className="text-sm text-center text-muted-foreground px-8">
        {isProcessing ? t.actions.extracting : t.captions.camera}
      </p>
    </div>
  );
}