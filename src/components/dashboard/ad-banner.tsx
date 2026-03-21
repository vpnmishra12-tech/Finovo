"use client";

import { useLanguage } from '@/lib/contexts/language-context';

export function AdBanner() {
  const { t } = useLanguage();

  return (
    <div className="w-full h-[70px] bg-gray-400 rounded-2xl flex flex-col items-center justify-center text-center px-4 relative">
      <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] leading-none mb-1">
        ADSENSE SPACE
      </p>
      <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest">
        MANAGED SLOT
      </p>
    </div>
  );
}
