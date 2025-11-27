import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import { AuthProvider } from '@/components/AuthContext';
import { CartProvider } from '@/components/CartContext';

// Lazy-load chat komponenty - načítajú sa až po hlavnom obsahu
const FloatingChatTrigger = dynamic(
  () => import('@/components/FloatingChatTrigger').then(mod => ({ default: mod.FloatingChatTrigger })),
  { ssr: false }
);

const TawkToWidget = dynamic(
  () => import('@/components/TawkToWidget'),
  { ssr: false }
);

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: '2Pnet E-shop | 2Pnet s.r.o.',
  description:
    'Online katalóg služieb 2Pnet s.r.o. – servis UPS, klimatizácie, elektroinštalácie a IT infraštruktúra so zásahom do 48 hodín.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <FloatingChatTrigger />
              <TawkToWidget />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
