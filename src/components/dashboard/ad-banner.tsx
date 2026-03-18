"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Info } from 'lucide-react';

export function AdBanner() {
  const { t } = useLanguage();

  // STEP 2: AdSense initialization
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ads might be blocked or script not loaded yet
    }
  }, []);

  return (
    <Card className="border-none bg-muted/50 shadow-inner overflow-hidden rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Info className="w-3 h-3" />
            {t.sponsored}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
        </div>
        
        <div className="min-h-[100px] w-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-center p-2">
          {/* STEP 3: Your AdSense Ad Unit Code */}
          {/* Niche diye gaye 'ins' tag mein apni details bharein aur comment hata dein jab asli ads lagane hon */}
          
          {/* 
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          */}

          <div className="py-4">
            <p className="text-sm font-medium text-muted-foreground">
              Your Professional Ad Here
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Insert your AdSense Ad Unit code in this component.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
