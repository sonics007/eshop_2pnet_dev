import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import { CustomerAuthProvider } from '@/lib/modules/auth/customer/context';
import { CartProvider } from '@/components/CartContext';
import { ChatWidgetLoader } from '@/components/ChatWidgetLoader';
import AnalyticsTracker from '@/components/AnalyticsTracker';

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
          <CustomerAuthProvider>
            <CartProvider>
              {children}
              <ChatWidgetLoader />
              <AnalyticsTracker />
            </CartProvider>
          </CustomerAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
