import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { LanguageProvider } from '@/lib/contexts/language-context';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SmartKharcha AI - Smart Expense Tracker',
  description: 'An AI-powered expense tracker for modern Indian users.',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=180&h=180&fit=crop&q=80', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartKharcha AI',
  },
  applicationName: 'SmartKharcha AI',
};

export const viewport: Viewport = {
  themeColor: '#5252E0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=180&h=180&fit=crop&q=80" />
        
        {/* STEP 1: AdSense Global Script (AdSense for Content) */}
        {/* Jab aapka AdSense account approve ho jaye, niche wala code uncomment karein aur 'ca-pub-...' apni ID se badlein */}
        {/* 
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        /> 
        */}
      </head>
      <body className="font-body antialiased min-h-screen">
        <FirebaseClientProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <Toaster />
            </LanguageProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
