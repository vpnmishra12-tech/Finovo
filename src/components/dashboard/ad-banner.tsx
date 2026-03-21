"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

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
        <div className="flex items-center justify-between mb-0.5 px-1">
          <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
            <Info className="w-2 h-2" />
            {t.sponsored}
          </span>
        </div>
        
        {/* Compact height to fit without scroll */}
        <div className="h-[70px] w-full bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-dashed border-muted/50 flex flex-col items-center justify-center text-center px-4 relative">
          <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest mb-0.5">
            Ad Space
          </p>
          <p className="text-[7px] font-bold text-muted-foreground/40 uppercase">
            AdSense Managed Slot
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
