"use client";

import { useLanguage } from '@/lib/contexts/language-context';

export function AdBanner() {
  const { t } = useLanguage();

  return (
    <div className="w-full h-[80px] bg-gray-400/90 rounded-[1.5rem] flex flex-col items-center justify-center text-center px-4 relative shadow-sm">
      <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">
        ADSENSE SPACE
      </p>
      <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
        MANAGED MANAGED SLOT
      </p>
    </div>
  );
}
