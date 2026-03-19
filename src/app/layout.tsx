import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { LanguageProvider } from '@/lib/contexts/language-context';
import { Toaster } from '@/components/ui/toaster';

const APP_ICON_URL = 'https://images.unsplash.com/photo-1620714223084-8fcacc6df38a?w=512&h=512&fit=crop&q=80&v=walletv13';

export const metadata: Metadata = {
  title: 'Finovo - Smart Expense Tracker',
  description: 'Manage your money smartly with AI - Professional Edition',
  manifest: '/manifest.json',
  icons: {
    icon: APP_ICON_URL,
    shortcut: APP_ICON_URL,
    apple: [
      { url: APP_ICON_URL, sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Finovo',
    description: 'Manage your money smartly with AI - Professional Edition',
    images: [{ url: APP_ICON_URL, width: 512, height: 512 }],
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finovo',
  },
  applicationName: 'Finovo',
};

export const viewport: Viewport = {
  themeColor: '#3B82F6',
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
        
        <link rel="apple-touch-icon" href={APP_ICON_URL} />
        <link rel="icon" href={APP_ICON_URL} />
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