import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import { AuthProvider } from '@/components/AuthContext';
import { CartProvider } from '@/components/CartContext';
import { FloatingChatTrigger } from '@/components/FloatingChatTrigger';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: '2Pnet E-shop | 2Pnet s.r.o.',
  description:
    'Online katalóg služieb 2Pnet s.r.o. – servis UPS, klimatizácie, elektroinštalácie a IT infraštruktúra so zásahom do 48 hodín.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <FloatingChatTrigger />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
