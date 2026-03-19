import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { LanguageProvider } from '@/lib/contexts/language-context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'SmartKharcha AI - Smart Expense Tracker',
  description: 'An AI-powered expense tracker for modern Indian users.',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=180&h=180&fit=crop&q=80&v=wallet', sizes: '180x180', type: 'image/png' },
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
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
        
        {/* iOS Touch Icon - Premium Purple Wallet Theme */}
        <link rel="apple-touch-icon" href="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=180&h=180&fit=crop&q=80&v=wallet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground selection:bg-primary/30">
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
