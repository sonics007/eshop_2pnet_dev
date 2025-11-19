'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type StatusResponse = {
  configured: boolean;
  missing: string[];
};

type FormState = {
  url: string;
  company: string;
  username: string;
  password: string;
};

export default function FlexibeeSettingsPage() {
  const [status, setStatus] = useState<StatusResponse>({ configured: false, missing: [] });
  const [form, setForm] = useState<FormState>({ url: '', company: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);

  const refreshStatus = () =>
    fetch('/api/flexibee/status')
      .then((res) => res.json())
      .then((payload) => setStatus(payload))
      .catch(() => setStatus({ configured: false, missing: [] }));

  useEffect(() => {
    Promise.all([
      fetch('/api/flexibee/status').then((res) => res.json()),
      fetch('/api/flexibee/settings').then((res) => res.json())
    ])
      .then(([statusPayload, settingsPayload]) => {
        setStatus(statusPayload);
        setForm({
          url: settingsPayload.url ?? '',
          company: settingsPayload.company ?? '',
          username: settingsPayload.username ?? '',
          password: ''
        });
      })
      .catch(() => setMessage('Nepodarilo sa načítať nastavenia.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setMessage('Ukladám nastavenia...');
      const response = await fetch('/api/flexibee/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Uloženie zlyhalo.');
      setMessage('Nastavenia boli uložené.');
      refreshStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Uloženie zlyhalo.');
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage('Overujem spojenie s ABRA Flexi...');
      const response = await fetch('/api/flexibee/test', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Test spojenia zlyhal.');
      }
      setMessage('Spojenie s ABRA Flexi je funkčné.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Test spojenia zlyhal.');
    } finally {
      setTesting(false);
      refreshStatus();
    }
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Integrácie</p>
            <h1 className="text-4xl font-semibold text-slate-900">Nastavenie ABRA Flexi</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tu nakonfigurujete prístupové údaje API. Údaje sa ukladajú do lokálneho konfiguračného súboru v priečinku
              data/.
            </p>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
            ← Späť do admin panelu
          </Link>
        </div>

        <section className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aktuálny stav</h2>
            <p className="mt-1 text-sm text-slate-500">
              {status.configured ? (
                <span className="text-emerald-600">Integrácia je pripravená.</span>
              ) : (
                <span className="text-rose-500">
                  Integrácia nie je kompletná. Doplnite prosím údaje nižšie alebo env premenné.
                </span>
              )}
            </p>
            {!status.configured && status.missing.length > 0 && (
              <ul className="mt-3 list-disc pl-6 text-sm text-slate-600">
                {status.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          {message && <p className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">{message}</p>}

          {loading ? (
            <p className="text-sm text-slate-500">Načítavam formulár...</p>
          ) : (
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  FlexiBee URL
                  <input
                    value={form.url}
                    onChange={(event) => handleChange('url', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                    placeholder="https://demo.flexibee.eu"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Kód spoločnosti
                  <input
                    value={form.company}
                    onChange={(event) => handleChange('company', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                    placeholder="demo"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Používateľské meno
                  <input
                    value={form.username}
                    onChange={(event) => handleChange('username', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                    placeholder="restuser"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Heslo
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Poznámka: Hodnoty z .env majú prednosť pred údajmi uloženými cez tento formulár. Ak používate produkčné
                tajomstvá, odporúčame spravovať ich cez systém premenných.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-slate-900"
                >
                  Potvrdiť nastavenia
                </button>
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTest}
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
                >
                  {testing ? 'Overujem...' : 'Overiť spojenie'}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
