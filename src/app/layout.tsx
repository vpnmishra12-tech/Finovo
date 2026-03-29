
"use client";

import { useEffect, useState } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { LanguageProvider } from '@/lib/contexts/language-context';
import { Toaster } from '@/components/ui/toaster';
import { initializeAdMob, showBannerAd } from '@/lib/ad-manager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated to true immediately to render the app shell
    setHasHydrated(true);
    
    // Initialize AdMob safely in the background after a short delay
    // This prevents the main thread from blocking during app startup
    const startAds = async () => {
      try {
        await initializeAdMob();
        setTimeout(async () => {
          try {
            await showBannerAd();
          } catch (e) {
            console.warn('Banner show skipped', e);
          }
        }, 3000); // 3 second delay for stability
      } catch (e) {
        console.warn('Ads init failed', e);
      }
    };
    
    startAds();
  }, []);

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased min-h-screen bg-background text-foreground selection:bg-primary/30">
        {!hasHydrated ? (
          // Solid splash color to prevent white flicker during JS load
          <div className="fixed inset-0 bg-background" />
        ) : (
          <FirebaseClientProvider>
            <AuthProvider>
              <LanguageProvider>
                {children}
                <Toaster />
              </LanguageProvider>
            </AuthProvider>
          </FirebaseClientProvider>
        )}
      </body>
    </html>
  );
}
