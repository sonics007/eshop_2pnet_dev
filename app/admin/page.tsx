'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import type { SiteSettings } from '@/lib/siteSettingsShared';
import { defaultSiteSettings } from '@/lib/siteSettingsShared';

type Panel = 'dashboard' | 'visual' | 'links' | 'menu' | 'chat' | 'logs';

const defaultEmail = 'admin@admin.sk';
const defaultPassword = 'admin';
const AUTH_KEY = 'admin-authenticated';

export default function AdminPage() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>('dashboard');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(AUTH_KEY);
    if (stored === '1') {
      setIsAuthenticated(true);
    }
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/site-settings');
      if (!res.ok) throw new Error('load_failed');
      const data = await res.json();
      setSiteSettings(data ?? defaultSiteSettings);
    } catch (err) {
      console.error('Nepodarilo sa načítať nastavenia', err);
      setSiteSettings(defaultSiteSettings);
    }
  }

  function updateHeroField<K extends keyof SiteSettings['hero']>(key: K, value: SiteSettings['hero'][K]) {
    if (!siteSettings) return;
    setSiteSettings({ ...siteSettings, hero: { ...siteSettings.hero, [key]: value } });
  }

  function updateHighlight(index: number, field: 'metric' | 'title' | 'copy', value: string) {
    if (!siteSettings) return;
    const next = siteSettings.hero.highlights.map((h, idx) =>
      idx === index ? { ...h, [field]: value } : h,
    );
    setSiteSettings({ ...siteSettings, hero: { ...siteSettings.hero, highlights: next } });
  }

  async function handleSaveVisual() {
    if (!siteSettings) return;
    setIsSaving(true);
    setSaveNotice('');
    try {
      const res = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      });
      if (!res.ok) throw new Error('save_failed');
      setSaveNotice('Uložené');
    } catch (err) {
      console.error('Ukladanie zlyhalo', err);
      setSaveNotice('Chyba pri ukladaní');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveNotice(''), 2000);
    }
  }

  const navItems = useMemo(
    () =>
      [
        { id: 'dashboard' as const, label: 'Dashboard', href: '/admin' },
        { id: 'visual' as const, label: 'Vizuál & pozadie', href: '/admin/visual' },
        { id: 'links' as const, label: 'Linky & odkazy', href: '/admin/links' },
        { id: 'menu' as const, label: 'Menu', href: '/admin/menu' },
        { id: 'chat' as const, label: 'Live chat' },
        { id: 'logs' as const, label: 'Logy' },
      ] satisfies Array<{ id: Panel; label: string; href?: string }>,
    [],
  );

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin/visual')) setActivePanel('visual');
    else if (pathname.startsWith('/admin/links')) setActivePanel('links');
    else if (pathname.startsWith('/admin/menu')) setActivePanel('menu');
    else if (pathname === '/admin') setActivePanel('dashboard');
  }, [pathname]);

  function handleLogin() {
    if (email.trim() === defaultEmail && password === defaultPassword) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_KEY, '1');
      }
    } else {
      alert('Nesprávne prihlásenie');
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }

  function renderVisualPanel() {
    if (!siteSettings) return <p className="text-sm text-slate-500">Načítavam nastavenia...</p>;
    return (
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Vizuál & pozadie</h2>
            <p className="text-sm text-slate-500">Hero sekcia, carousel a USP karty</p>
          </div>
          {saveNotice && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {saveNotice}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Nadpis
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={siteSettings.hero.title}
              onChange={(e) => updateHeroField('title', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Popis
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              rows={3}
              value={siteSettings.hero.description}
              onChange={(e) => updateHeroField('description', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Primárne tlačidlo — text
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={siteSettings.hero.primaryCtaLabel}
              onChange={(e) => updateHeroField('primaryCtaLabel', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Primárne tlačidlo — link
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={siteSettings.hero.primaryCtaLink}
              onChange={(e) => updateHeroField('primaryCtaLink', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Sekundárne tlačidlo — text
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={siteSettings.hero.secondaryCtaLabel}
              onChange={(e) => updateHeroField('secondaryCtaLabel', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Sekundárne tlačidlo — link
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={siteSettings.hero.secondaryCtaLink}
              onChange={(e) => updateHeroField('secondaryCtaLink', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Obrázky karuselu (jeden riadok = jedna URL)
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              rows={3}
              value={(siteSettings.hero.carouselImages || []).join('\n')}
              onChange={(e) =>
                updateHeroField(
                  'carouselImages',
                  e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">USP karty (3 položky)</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {siteSettings.hero.highlights.map((h, idx) => (
                <div key={idx} className="space-y-2 rounded-2xl border border-slate-200 p-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Metrika
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                      value={h.metric}
                      onChange={(e) => updateHighlight(idx, 'metric', e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Nadpis
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                      value={h.title}
                      onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Popis
                    <textarea
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                      rows={3}
                      value={h.copy}
                      onChange={(e) => updateHighlight(idx, 'copy', e.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSaveVisual}
            disabled={isSaving}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSaving ? 'Ukladám...' : 'Uložiť vizuál'}
          </button>
          <button
            onClick={loadSettings}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900"
          >
            Načítať z DB
          </button>
        </div>
      </section>
    );
  }

  function renderPlaceholder(text: string) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">{text}</h2>
        <p className="text-sm text-slate-500">Sekcia bude doplnená neskôr.</p>
      </section>
    );
  }

  function renderPanel() {
    switch (activePanel) {
      case 'dashboard':
        return (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prehľad</p>
                <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
              </div>
              <Link
                href="/"
                className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
              >
                Otvoriť e-shop
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: 'Objednávky', value: '12', hint: 'za posledných 7 dní' },
                { label: 'Faktúry', value: '8', hint: 'čaká na úhradu' },
                { label: 'Správy v chate', value: '3', hint: 'neprečítané' },
                { label: 'Produkty', value: '24', hint: 'publikované' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.hint}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'visual':
        return renderVisualPanel();
      case 'links':
        return renderPlaceholder('Linky & odkazy');
      case 'chat':
        return renderPlaceholder('Live chat & kanály');
      case 'menu':
        return renderPlaceholder('Menu');
      case 'logs':
      default:
        return renderPlaceholder('Logy a správa');
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-3xl font-semibold text-slate-900">Admin panel</h1>
          <p className="mt-2 text-sm text-slate-500">Prihláste sa ako administrátor.</p>
          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <label className="block text-sm font-medium text-slate-700">
              E-mail
              <input
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={defaultEmail}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Heslo
              <input
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
              />
            </label>
            <button
              onClick={handleLogin}
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Prihlásiť sa
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrácia</p>
            <h1 className="text-3xl font-semibold text-slate-900">Nastavenia e-shopu</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900"
          >
            Odhlásiť sa
          </button>
        </div>

        <div className="space-y-4">
          <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-card">
              <div className="flex flex-wrap gap-2">
                {navItems.map((item) =>
                  item.href ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activePanel === item.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => setActivePanel(item.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activePanel === item.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            </nav>

          <div className="space-y-4">{renderPanel()}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
