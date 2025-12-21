'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useCart } from '@/components/CartContext';
import { LANGUAGE_CURRENCY_MAP } from '@/types/product';
import { ADMIN_ACCOUNT_EVENT_KEY, ADMIN_ACCOUNT_STORAGE_KEY } from '@/lib/constants';

const navLinkItems = [
  { href: '/', key: 'home' },
  { href: '/produkty', key: 'products' },
  { href: '/kontakt', key: 'contact' }
] as const;

type NavKey = (typeof navLinkItems)[number]['key'];
type NavLabels = { sk: Partial<Record<NavKey, string>>; cz: Partial<Record<NavKey, string>> };

type StoredAdminAccount = { id?: number; name: string; email: string; twoFactorEnabled?: boolean };

const translations = {
  sk: {
    home: 'Domov',
    products: 'Produkty',
    cart: 'Košík',
    contact: 'Kontakt',
    account: 'Účet',
    flagAlt: 'Slovenská vlajka',
    searchPlaceholder: 'Hľadať produkty...'
  },
  cz: {
    home: 'Domů',
    products: 'Produkty',
    cart: 'Košík',
    contact: 'Kontakt',
    account: 'Účet',
    flagAlt: 'Česká vlajka',
    searchPlaceholder: 'Vyhledat produkty...'
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
  const { items: cartItems } = useCart();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [dynamicLogoLinks, setDynamicLogoLinks] = useState(logoLinks ?? defaultLogoLinks);
  const [adminAccount, setAdminAccount] = useState<StoredAdminAccount | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [navLabels, setNavLabels] = useState<NavLabels>({ sk: {}, cz: {} });
  const [editNavKey, setEditNavKey] = useState<NavKey | null>(null);
  const [editSk, setEditSk] = useState('');
  const [editCz, setEditCz] = useState('');
  const [navSaving, setNavSaving] = useState(false);
  const [navMessage, setNavMessage] = useState<string | null>(null);

  useEffect(() => {
    if (logoLinks) {
      setDynamicLogoLinks(logoLinks);
      return;
    }
    // Použijeme sessionStorage cache pre rýchlejšie načítanie
    const cacheKey = 'navbar-logo-links';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        setDynamicLogoLinks(JSON.parse(cached));
        return;
      } catch { /* ignore */ }
    }
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (!response.ok) return;
        const data = await response.json();
        if (mounted && data?.links) {
          const links = {
            logoPrimaryLink: data.links.logoPrimaryLink ?? defaultLogoLinks.logoPrimaryLink,
            logoAdminLink: data.links.logoAdminLink ?? defaultLogoLinks.logoAdminLink
          };
          setDynamicLogoLinks(links);
          sessionStorage.setItem(cacheKey, JSON.stringify(links));
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
        const stored = window.localStorage.getItem(ADMIN_ACCOUNT_STORAGE_KEY);
        if (!stored) {
          setAdminAccount(null);
          return;
        }
        const parsed = JSON.parse(stored) as Partial<StoredAdminAccount>;
        if (parsed?.email) {
          setAdminAccount({
            id: parsed.id,
            name: parsed.name || parsed.email,
            email: parsed.email,
            twoFactorEnabled: parsed.twoFactorEnabled
          });
          setProfileName(parsed.name || parsed.email);
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
    window.addEventListener(ADMIN_ACCOUNT_EVENT_KEY, customHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(ADMIN_ACCOUNT_EVENT_KEY, customHandler);
    };
  }, []);

  useEffect(() => {
    const loadNavLabels = async () => {
      try {
        const response = await fetch('/api/navbar-labels');
        if (!response.ok) return;
        const data = (await response.json()) as NavLabels;
        setNavLabels({
          sk: data?.sk ?? {},
          cz: data?.cz ?? {}
        });
      } catch (error) {
        console.error('Nepodarilo sa načítať texty navigácie', error);
      }
    };
    loadNavLabels();
  }, []);

  const labels = useMemo(() => {
    const base = translations[language];
    const overrides = navLabels[language] ?? {};
    return { ...base, ...overrides };
  }, [language, navLabels]);
  const currencyLabel = useMemo(() => LANGUAGE_CURRENCY_MAP[language]?.currency ?? 'EUR', [language]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    router.push(`/produkty?query=${encodeURIComponent(term)}`);
    if (isMenuOpen) setMenuOpen(false);
  };

  const renderLinks = (variant: 'desktop' | 'mobile') =>
    navLinkItems.map((item) => (
      <div
        key={item.href}
        className={`flex items-center gap-1 ${
          variant === 'mobile' ? 'rounded-xl px-4 py-2' : ''
        }`}
      >
        <Link
          href={item.href}
          className={`transition ${
            pathname === item.href
              ? 'text-white'
              : variant === 'desktop'
                ? 'text-white/70 hover:text-white'
                : 'text-white/80 hover:text-white'
          } ${variant === 'mobile' ? 'block w-full' : ''}`}
          onClick={() => {
            if (variant === 'mobile') setMenuOpen(false);
          }}
        >
          {labels[item.key]}
        </Link>
        {isAdminRoute && adminEditLinks[item.key] && (
          <button
            type="button"
            className="text-[11px] font-semibold text-white/70 transition hover:text-white/90"
            onClick={(e) => {
              e.stopPropagation();
              const currentSk = navLabels.sk[item.key] ?? translations.sk[item.key];
              const currentCz = navLabels.cz[item.key] ?? translations.cz[item.key];
              setEditNavKey(item.key);
              setEditSk(currentSk);
              setEditCz(currentCz);
              setNavMessage(null);
            }}
          >
            ★
          </button>
        )}
      </div>
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

  const isAdminRoute = pathname?.startsWith('/admin') || false;
  const adminEditLinks: Record<string, string> = {
    home: '/admin/visual',
    products: '/admin/products',
    contact: '/admin/links'
  };

  const saveProfile = async () => {
    if (!adminAccount?.id) {
      setProfileMessage('Chýba ID prihláseného admina.');
      return;
    }
    if (profilePassword && profilePassword !== profilePasswordConfirm) {
      setProfileMessage('Heslá sa nezhodujú.');
      return;
    }
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const payload: any = { companyName: profileName || adminAccount.email };
      if (profilePassword) payload.password = profilePassword;
      const res = await fetch(`/api/users/${adminAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage('Uložené.');
        // refresh stored admin
        const nextAdmin = {
          ...adminAccount,
          name: profileName || adminAccount.email
        };
        setAdminAccount(nextAdmin);
        window.localStorage.setItem(
          ADMIN_ACCOUNT_STORAGE_KEY,
          JSON.stringify({
            id: nextAdmin.id,
            name: nextAdmin.name,
            email: nextAdmin.email,
            twoFactorEnabled: nextAdmin.twoFactorEnabled
          })
        );
        window.dispatchEvent(new Event(ADMIN_ACCOUNT_EVENT_KEY));
        setProfilePassword('');
        setProfilePasswordConfirm('');
      } else {
        setProfileMessage(data.error || 'Ukladanie zlyhalo.');
      }
    } catch (error) {
      setProfileMessage('Chyba servera.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <>
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
          <Image
            src="/2pnet-logo.png"
            alt="2Pnet logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
            style={{ height: 'auto', width: 'auto' }}
          />
          <span className="sr-only">2Pnet e-shop</span>
        </button>
        <nav className="hidden gap-6 text-sm font-medium md:flex text-white">{renderLinks('desktop')}</nav>
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden items-center md:flex md:w-64 lg:w-80"
          role="search"
        >
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:border-white/40 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
          >
            Hľadať
          </button>
        </form>
        <div className="hidden items-center gap-3 md:flex">
          {renderLanguageButtons('desktop')}
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase text-white/80">
            {currencyLabel}
          </span>
          {isAdminRoute ? (
            adminAccount ? (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen((p) => !p)}
                  className="rounded-2xl border border-white/20 px-4 py-2 text-left text-xs leading-tight text-white/80"
                >
                  <p className="text-sm font-semibold text-white">
                    {adminAccount.name && adminAccount.name !== adminAccount.email
                      ? adminAccount.name
                      : adminAccount.email}
                  </p>
                  {adminAccount.name && adminAccount.name !== adminAccount.email && (
                    <p className="text-[11px] text-white/70">Administrátor</p>
                  )}
                  {adminAccount.twoFactorEnabled && (
                    <span className="text-[11px] font-semibold text-emerald-200">2FA aktívne</span>
                  )}
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-800/95 p-2 text-sm shadow-xl">
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setAdminMenuOpen(false);
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-white hover:bg-slate-700"
                    >
                      Profil a heslo
                    </button>
                    <button
                      onClick={() => {
                        setAdminMenuOpen(false);
                        router.push('/admin/users?tab=admins');
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-white hover:bg-slate-700"
                    >
                      Zapnúť 2FA
                    </button>
                    <button
                      onClick={() => {
                        setAdminMenuOpen(false);
                        router.push('/admin');
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-rose-100 hover:bg-rose-900/40"
                    >
                      Odhlásiť sa
                    </button>
                  </div>
                )}
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
            <Link
              href="/cart"
              className="relative rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-900"
            >
              {labels.cart}
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-900 shadow">
                  {cartCount}
                </span>
              )}
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
          <form onSubmit={handleSearchSubmit} className="relative" role="search">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
            >
              Hľadať
            </button>
          </form>
          {renderLinks('mobile')}
          <div className="flex items-center gap-4">
            {renderLanguageButtons('mobile')}
            <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase text-white/70">
              {currencyLabel}
            </span>
            {isAdminRoute ? (
              adminAccount ? (
                <div className="text-xs text-white/70">
                  {adminAccount.name && adminAccount.name !== adminAccount.email && !adminAccount.name.includes('@') && (
                    <p className="text-sm font-semibold text-white">{adminAccount.name}</p>
                  )}
                  <p className="text-sm font-semibold text-white">{adminAccount.email}</p>
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
                <Link href="/cart" className="relative rounded-full bg-brand-accent px-4 py-2 text-slate-900">
                  {labels.cart}
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>

      {editNavKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Úprava textu menu</p>
                <p className="text-xs text-slate-500">Položka: {translations.sk[editNavKey]}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-sm text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setEditNavKey(null);
                  setNavMessage(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Slovenský text
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  value={editSk}
                  onChange={(e) => setEditSk(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Český preklad
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  value={editCz}
                  onChange={(e) => setEditCz(e.target.value)}
                />
              </label>
            </div>

            {navMessage && <p className="mt-3 text-sm text-slate-600">{navMessage}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setEditNavKey(null);
                  setNavMessage(null);
                }}
              >
                Zrušiť
              </button>
              <button
                type="button"
                disabled={navSaving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={async () => {
                  if (!editNavKey) return;
                  setNavSaving(true);
                  setNavMessage(null);
                  try {
                    const next: NavLabels = {
                      sk: { ...navLabels.sk, [editNavKey]: editSk },
                      cz: { ...navLabels.cz, [editNavKey]: editCz }
                    };
                    const response = await fetch('/api/navbar-labels', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(next)
                    });
                    if (!response.ok) throw new Error('Ukladanie zlyhalo');
                    const data = (await response.json()) as NavLabels;
                    setNavLabels(data);
                    setEditNavKey(null);
                    setNavMessage(null);
                  } catch (error) {
                    console.error(error);
                    setNavMessage('Nepodarilo sa uložiť text.');
                  } finally {
                    setNavSaving(false);
                  }
                }}
              >
                {navSaving ? 'Ukladám…' : 'Uložiť'}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Môj profil</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              >
                Zavrieť
              </button>
            </div>
            {profileMessage && (
              <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{profileMessage}</p>
            )}
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Meno
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Nové heslo (nechať prázdne ak nechcete meniť)
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="********"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Potvrdiť heslo
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  value={profilePasswordConfirm}
                  onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                  placeholder="********"
                />
              </label>
              <p className="text-xs text-slate-500">
                Zapnutie 2FA: prejdite do Administrátori → kliknite „Nastaviť 2FA“ pri svojom účte.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {profileSaving ? 'Ukladám...' : 'Uložiť'}
                </button>
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Zrušiť
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
