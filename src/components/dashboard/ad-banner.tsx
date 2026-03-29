"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/contexts/language-context';

export function AdBanner() {
  const { t } = useLanguage();
  const [isMobileApp, setIsMobileApp] = useState(false);

  // Detecting if running inside a WebView/Mobile context
  useEffect(() => {
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobileApp(isCapacitor || isMobileUA);
  }, []);

  // AdMob Banner Placeholder
  // This will be replaced by native ads when you build the APK
  const ADMOB_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111"; // Test ID default

  return (
    <div className="w-full h-[75px] bg-primary/5 border-y border-primary/10 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {isMobileApp ? (
        <div className="space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">
            {t.sponsored || "SPONSORED"}
          </p>
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-8 h-8 bg-primary/20 rounded-md animate-pulse" />
            <div className="flex flex-col gap-1 text-left">
              <div className="w-24 h-2 bg-primary/20 rounded animate-pulse" />
              <div className="w-16 h-1.5 bg-primary/20 rounded animate-pulse" />
            </div>
          </div>
          {/* AdMob Integration Point: AdMob IDs will be active here in APK */}
          <span className="hidden" data-admob-id={ADMOB_UNIT_ID}></span>
        </div>
      ) : (
        <div className="opacity-30">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">
            FINOVO PREMIUM AD SLOT
          </p>
          <p className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">
            {ADMOB_UNIT_ID ? "CONFIGURED" : "PENDING SETUP"}
          </p>
        </div>
      )}
    </div>
  );
}