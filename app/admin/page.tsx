'use client';

import { useMemo, useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getModule } from '@/lib/modules';
import { useAdminAuth } from '@/lib/modules/auth';
import type { AdminMenuSettings, AdminMenuItem } from '@/lib/modules/site/pages/admin-menu/types';
import { defaultAdminMenuSettings } from '@/lib/modules/site/pages/admin-menu/types';

export default function AdminPage() {
  const { admin, isAuthenticated, isLoading, login, logout, requiresTwoFactor, verifyTwoFactor } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuSettings, setMenuSettings] = useState<AdminMenuSettings>(defaultAdminMenuSettings);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    async function loadMenuSettings() {
      try {
        const response = await fetch('/api/site/admin-menu', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMenuSettings(data.data);
          }
        }
      } catch {
        // Network/API error - fallback to default menu
      } finally {
        setMenuLoading(false);
      }
    }

    loadMenuSettings();
  }, []);

  const menuSections = useMemo(() => {
    const items = [...menuSettings.items].filter(item => item.enabled).sort((a, b) => a.order - b.order);

    return items.map(item => {
      const moduleDef = getModule(item.id);
      const children = (item.children || []).filter(child => child.enabled).sort((a, b) => a.order - b.order);

      // Prefer oficiálne panely modulu (kvôli popisom), inak fallback na položky menu
      const panelsSource = moduleDef?.adminPanels && moduleDef.adminPanels.length > 0
        ? moduleDef.adminPanels
        : (children.length > 0 ? children : [item]);

      const panels = panelsSource.map(panel => {
        const panelId = 'id' in panel ? panel.id : panel.id;
        const panelHref = 'route' in panel ? panel.route : panel.href;
        const matchingMenuItem =
          children.find(c => c.id === panelId || c.href === panelHref) || item;
        const description =
          ('description' in panel ? panel.description : undefined) ||
          matchingMenuItem.description;

        return {
          id: panelId,
          label: 'label' in panel ? panel.label : panel.label,
          route: panelHref,
          description
        };
      });

      return {
        moduleId: item.id,
        moduleName: moduleDef?.name || item.label,
        moduleDescription: moduleDef?.description || '',
        panels
      };
    });
  }, [menuSettings]);

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Zadajte e-mail aj heslo.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    setStatusMessage('Overujem prihlásenie…');
    const result = await login({ email, password, otpCode: otpCode || undefined });
    setSubmitting(false);
    if (result.success) {
      setStatusMessage('Prihlásenie úspešné.');
      setOtpCode('');
    } else if (result.requiresTwoFactor) {
      setStatusMessage('Vyžaduje sa 2FA kód.');
    } else {
      setStatusMessage(null);
      setErrorMessage(result.error || 'Prihlásenie zlyhalo.');
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!otpCode.trim()) {
      setErrorMessage('Zadajte prosím 6-miestny kód.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    setStatusMessage('Overujem kód…');
    const result = await verifyTwoFactor(otpCode.trim());
    setSubmitting(false);
    if (result.success) {
      setStatusMessage('2FA bolo overené.');
      setOtpCode('');
    } else {
      setStatusMessage(null);
      setErrorMessage(result.error || 'Neplatný kód.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Načítavam admin panel…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white">
              <img src="/2pnet-logo.png" alt="2Pnet logo" className="h-8 w-auto" />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-3xl font-semibold text-slate-900">Admin panel</h1>
          <p className="mt-2 text-sm text-slate-500">Prihláste sa ako administrátor.</p>
          <form
            className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
            onSubmit={handleLogin}
          >
            <label className="block text-sm font-medium text-slate-700">
              E-mail
              <input
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="admin@firma.sk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Heslo
              <input
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {requiresTwoFactor && (
              <label className="block text-sm font-medium text-slate-700">
                2FA kód
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </label>
            )}
            {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
            {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
            {requiresTwoFactor ? (
              <button
                type="button"
                onClick={handleVerifyTwoFactor}
                disabled={submitting}
                className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                Overiť kód
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                Prihlásiť sa
              </button>
            )}
          </form>
        </main>
      </div>
    );
  }

  return (
    <AdminLayout activePanel="dashboard">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Vitajte, {admin?.email || 'admin'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Prehľad všetkých modulov a administračných nástrojov
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`menu-skeleton-${idx}`}
              className="h-36 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))
        ) : (
          menuSections.map((section) => (
            <div
              key={section.moduleId}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-slate-900">{section.moduleName}</h3>
              {section.moduleDescription && (
                <p className="mt-2 text-sm text-slate-500">{section.moduleDescription}</p>
              )}

              <div className="mt-1 flex min-h-[90px] max-h-32 flex-col gap-0.5 overflow-auto pr-0.5">
                {section.panels.map((panel) =>
                  panel.route ? (
                    <Link
                      key={panel.id}
                      href={panel.route}
                      className="block rounded-lg px-2.5 py-0.5 text-[12px] leading-snug text-slate-700 transition hover:bg-slate-50"
                    >
                      → {panel.label}
                      {panel.description && (
                        <span className="block text-[9px] leading-tight text-slate-400 whitespace-pre-line">
                          {panel.description}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div key={panel.id} className="rounded-lg px-2.5 py-0.5 text-[12px] leading-snug text-slate-400">
                      {panel.label}
                      {panel.description && (
                        <span className="block text-[9px] leading-tight text-slate-300 whitespace-pre-line">
                          {panel.description}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Moduly</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{menuSections.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Verzia systému</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">0.0.3</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Framework</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Next.js 16</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Databáza</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">SQLite</p>
        </div>
      </div>
    </AdminLayout>
  );
}
