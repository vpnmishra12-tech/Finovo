import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { LanguageProvider } from '@/lib/contexts/language-context';
import { Toaster } from '@/components/ui/toaster';

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

// DEFINITIVE ULTRA-PREMIUM 3D DIGITAL WALLET - Version v4000
const APP_ICON_URL = 'https://images.unsplash.com/photo-1621416848446-991125c75b06?w=512&h=512&fit=crop&q=80';

export const metadata: Metadata = {
  title: 'Finovo - Expense Tracker',
  description: 'Manage your money smartly with AI - Ultra Premium #2C2D2D Edition',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: `${APP_ICON_URL}&v=4000`, sizes: '32x32', type: 'image/png' },
      { url: `${APP_ICON_URL}&v=4000`, sizes: '192x192', type: 'image/png' },
    ],
    shortcut: `${APP_ICON_URL}&v=4000`,
    apple: [
      { url: `${APP_ICON_URL}&v=4000`, sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Finovo - Expense Tracker',
    description: 'Manage your money smartly with AI - Ultra Premium #2C2D2D Edition',
    images: [{ url: APP_ICON_URL, width: 512, height: 512 }],
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finovo - Expense Tracker',
  },
  applicationName: 'Finovo - Expense Tracker',
};

export const viewport: Viewport = {
  themeColor: '#2C2D2D',
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
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
