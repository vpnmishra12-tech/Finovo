
"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Info } from 'lucide-react';

export function AdBanner() {
  const { t } = useLanguage();

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
        
        {/* Ad Content Placeholder */}
        <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-center p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Your Professional Ad Here
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Sign up for AdSense and paste your snippet in this component.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
