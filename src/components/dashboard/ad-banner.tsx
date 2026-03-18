"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Info } from 'lucide-react';

export function AdBanner() {
  const { t } = useLanguage();

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <Card className="border-none bg-muted/30 shadow-none overflow-hidden rounded-xl">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
            <Info className="w-2.5 h-2.5" />
            {t.sponsored}
          </span>
        </div>
        
        <div className="h-[40px] w-full bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-dashed border-muted/50 flex items-center justify-center text-center px-4 relative">
          <p className="text-[10px] font-bold text-muted-foreground/80">
            Professional Ad Space Available • AdSense
          </p>
          {/* 
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          */}
        </div>
      </CardContent>
    </Card>
  );
}
