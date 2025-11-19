'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';

const navLinkItems = [
  { href: '/', key: 'home' },
  { href: '/produkty', key: 'products' },
  { href: '/kontakt', key: 'contact' }
] as const;

const ADMIN_ACCOUNT_KEY = 'admin-current-user';
const ADMIN_EVENT_KEY = 'admin-account-update';
type StoredAdminAccount = { name: string; email: string };

const translations = {
  sk: {
    home: 'Domov',
    products: 'Produkty',
    cart: 'Košík',
    contact: 'Kontakt',
    account: 'Účet',
    flagAlt: 'Slovenská vlajka'
  },
  cz: {
    home: 'Domů',
    products: 'Produkty',
    cart: 'Košík',
    contact: 'Kontakt',
    account: 'Účet',
    flagAlt: 'Česká vlajka'
  }
} as const;

type NavbarProps = {
  logoLinks?: {
    logoPrimaryLink: string;
    logoAdminLink: string;
  };
};

const defaultLogoLinks = {
  logoPrimaryLink: 'https://www.2pnet.cz',
  logoAdminLink: '/admin'
};

export function Navbar({ logoLinks }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [dynamicLogoLinks, setDynamicLogoLinks] = useState(logoLinks ?? defaultLogoLinks);
  const [adminAccount, setAdminAccount] = useState<StoredAdminAccount | null>(null);

  useEffect(() => {
    if (logoLinks) {
      setDynamicLogoLinks(logoLinks);
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (!response.ok) return;
        const data = await response.json();
        if (mounted && data?.links) {
          setDynamicLogoLinks({
            logoPrimaryLink: data.links.logoPrimaryLink ?? defaultLogoLinks.logoPrimaryLink,
            logoAdminLink: data.links.logoAdminLink ?? defaultLogoLinks.logoAdminLink
          });
        }
      } catch (error) {
        console.error('Nepodarilo sa načítať odkazy loga', error);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [logoLinks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadAdminAccount = () => {
      try {
        const stored = window.localStorage.getItem(ADMIN_ACCOUNT_KEY);
        if (!stored) {
          setAdminAccount(null);
          return;
        }
        const parsed = JSON.parse(stored) as Partial<StoredAdminAccount>;
        if (parsed?.name && parsed?.email) {
          setAdminAccount({ name: parsed.name, email: parsed.email });
        } else {
          setAdminAccount(null);
        }
      } catch {
        setAdminAccount(null);
      }
    };
    loadAdminAccount();
    const handler = () => loadAdminAccount();
    const customHandler: EventListener = () => loadAdminAccount();
    window.addEventListener('storage', handler);
    window.addEventListener(ADMIN_EVENT_KEY, customHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(ADMIN_EVENT_KEY, customHandler);
    };
  }, []);

  const labels = translations[language];

  const renderLinks = (variant: 'desktop' | 'mobile') =>
    navLinkItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`transition ${
          pathname === item.href
            ? 'text-white'
            : variant === 'desktop'
              ? 'text-white/70 hover:text-white'
              : 'text-white/80 hover:text-white'
        } ${variant === 'mobile' ? 'block rounded-xl px-4 py-2' : ''}`}
        onClick={() => {
          if (variant === 'mobile') setMenuOpen(false);
        }}
      >
        {labels[item.key]}
      </Link>
    ));

  const renderLanguageButtons = (variant: 'desktop' | 'mobile') => (
    <div
      className={`flex items-center ${
        variant === 'desktop' ? 'gap-1 rounded-full border border-white/20 bg-white/10 p-1' : 'gap-2'
      }`}
    >
      {(['sk', 'cz'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => {
            setLanguage(lng);
            if (variant === 'mobile') setMenuOpen(false);
          }}
          className={`overflow-hidden rounded-full transition ${
            variant === 'desktop'
              ? `h-8 w-8 border ${language === lng ? 'border-white bg-white shadow-inner' : 'border-white/30 bg-white/10 opacity-60 hover:opacity-90'}`
              : `h-10 w-10 border ${language === lng ? 'border-white bg-white/20' : 'border-white/40 opacity-60 hover:opacity-90'}`
          }`}
          aria-label={lng === 'sk' ? 'Slovenská verzia' : 'Česká verzia'}
        >
          <Image
            src={`/flags/${lng}.png`}
            alt={translations[lng].flagAlt}
            width={variant === 'desktop' ? 24 : 28}
            height={variant === 'desktop' ? 24 : 28}
            className={`h-full w-full ${language === lng ? '' : 'grayscale'}`}
            priority={lng === 'sk'}
          />
        </button>
      ))}
    </div>
  );

  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          type="button"
          aria-label="Prejsť na 2pnet.cz alebo otvoriť admin panel"
          onClick={(event) => {
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              router.push(dynamicLogoLinks.logoAdminLink);
            } else {
              window.location.href = dynamicLogoLinks.logoPrimaryLink;
            }
          }}
          className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white"
        >
          <Image src="/2pnet-logo.png" alt="2Pnet logo" width={120} height={32} className="h-8 w-auto" priority />
          <span className="sr-only">2Pnet e-shop</span>
        </button>
        <nav className="hidden gap-6 text-sm font-medium md:flex text-white">{renderLinks('desktop')}</nav>
        <div className="hidden items-center gap-3 md:flex">
          {renderLanguageButtons('desktop')}
          {isAdminRoute ? (
            adminAccount ? (
              <div className="rounded-2xl border border-white/20 px-4 py-2 text-left text-xs leading-tight text-white/80">
                <p className="text-sm font-semibold text-white">{adminAccount.name}</p>
                <p>{adminAccount.email}</p>
              </div>
            ) : (
              <Link href="/admin" className="text-sm font-semibold text-white/70 transition hover:text-white">
                Admin prihlásenie
              </Link>
            )
          ) : (
            <Link href="/account" className="text-sm font-medium text-white/70 transition hover:text-white">
              {labels.account}
            </Link>
          )}
          {!isAdminRoute && (
            <Link href="/cart" className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-900">
              {labels.cart}
            </Link>
          )}
        </div>
        <button
          className="rounded-full border border-white/30 p-2 text-white md:hidden"
          aria-label="Prepnúť menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="block h-0.5 w-5 bg-current"></span>
          <span className="mt-1 block h-0.5 w-5 bg-current"></span>
          <span className="mt-1 block h-0.5 w-4 bg-current"></span>
        </button>
      </div>
      {isMenuOpen && (
        <div className="flex flex-col gap-4 border-t border-slate-700 bg-slate-900/95 px-6 py-4 text-sm font-medium md:hidden">
          {renderLinks('mobile')}
          <div className="flex items-center gap-4">
            {renderLanguageButtons('mobile')}
            {isAdminRoute ? (
              adminAccount ? (
                <div className="text-xs text-white/70">
                  <p className="text-sm font-semibold text-white">{adminAccount.name}</p>
                  <p>{adminAccount.email}</p>
                </div>
              ) : (
                <Link href="/admin" className="text-white/70 hover:text-white">
                  Admin prihlásenie
                </Link>
              )
            ) : (
              <>
                <Link href="/account" className="text-white/70 hover:text-white">
                  {labels.account}
                </Link>
                <Link href="/cart" className="rounded-full bg-brand-accent px-4 py-2 text-slate-900">
                  {labels.cart}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
