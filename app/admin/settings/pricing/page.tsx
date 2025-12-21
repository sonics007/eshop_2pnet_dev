'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

type PricingSettings = {
  eurToCzkRate: number;
  roundTo: number;
  roundUp: boolean;
};

export default function PricingSettingsPage() {
  const [settings, setSettings] = useState<PricingSettings>({
    eurToCzkRate: 25.0,
    roundTo: 0,
    roundUp: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Pre ukážku prepočtu
  const [testEur, setTestEur] = useState(100);

  useEffect(() => {
    fetch('/api/site/pricing')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data) {
          setSettings(payload.data);
        }
      })
      .catch(() => setMessage('Nepodarilo sa načítať nastavenia.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('Ukladám nastavenia...');
      const response = await fetch('/api/site/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Uloženie zlyhalo.');
      }
      setSettings(payload.data);
      setMessage('Nastavenia boli uložené.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Uloženie zlyhalo.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCzk = (eur: number): number => {
    const converted = eur * settings.eurToCzkRate;
    if (settings.roundTo <= 0) {
      return Math.round(converted);
    }
    if (settings.roundUp) {
      return Math.ceil(converted / settings.roundTo) * settings.roundTo;
    }
    return Math.round(converted / settings.roundTo) * settings.roundTo;
  };

  return (
    <AdminLayout activePanel="admin-pricing">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Nastavenia</p>
        <h1 className="text-4xl font-semibold text-slate-900">Konverzný kurz EUR → CZK</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nastavte konverzný kurz pre automatický prepočet cien z EUR na CZK.
        </p>
      </div>

      <section className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        {message && (
          <p className={`rounded-2xl px-4 py-2 text-sm ${message.includes('uložené') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
        ) : (
          <div className="space-y-6">
            {/* Konverzný kurz */}
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Konverzný kurz (1 EUR = ? CZK)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.eurToCzkRate}
                  onChange={(e) => setSettings((prev) => ({ ...prev, eurToCzkRate: parseFloat(e.target.value) || 25 }))}
                  className="mt-2 w-full max-w-xs rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="25.00"
                />
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Aktuálny kurz ČNB je približne 25 CZK za 1 EUR.
              </p>
            </div>

            {/* Zaokrúhľovanie */}
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Zaokrúhľovanie
                <select
                  value={settings.roundTo}
                  onChange={(e) => setSettings((prev) => ({ ...prev, roundTo: parseInt(e.target.value) || 0 }))}
                  className="mt-2 w-full max-w-xs rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                >
                  <option value={0}>Bez zaokrúhľovania (celé čísla)</option>
                  <option value={10}>Na desiatky (10, 20, 30...)</option>
                  <option value={50}>Na päťdesiatky (50, 100, 150...)</option>
                  <option value={100}>Na stovky (100, 200, 300...)</option>
                </select>
              </label>
            </div>

            {/* Smer zaokrúhľovania */}
            {settings.roundTo > 0 && (
              <div>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.roundUp}
                    onChange={(e) => setSettings((prev) => ({ ...prev, roundUp: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  Vždy zaokrúhľovať nahor
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Ak je zaškrtnuté, ceny sa vždy zaokrúhlia nahor (napr. 2421 → 2500 pri zaokrúhľovaní na stovky).
                </p>
              </div>
            )}

            {/* Ukážka prepočtu */}
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-700">Ukážka prepočtu</h3>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-xs text-slate-500">Cena v EUR</label>
                  <input
                    type="number"
                    value={testEur}
                    onChange={(e) => setTestEur(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="text-2xl text-slate-400">→</div>
                <div>
                  <label className="text-xs text-slate-500">Cena v CZK</label>
                  <div className="mt-1 rounded-xl bg-white border border-slate-200 px-4 py-2 text-lg font-semibold text-slate-900">
                    {calculateCzk(testEur).toLocaleString('cs-CZ')} CZK
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {testEur} EUR × {settings.eurToCzkRate} = {(testEur * settings.eurToCzkRate).toFixed(2)} CZK
                {settings.roundTo > 0 && ` → zaokrúhlené na ${settings.roundTo}: ${calculateCzk(testEur)} CZK`}
              </p>
            </div>

            {/* Uložiť */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Ako to funguje</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Pri vytváraní/úprave produktu môžete zadať cenu len v EUR</li>
          <li>• CZK cena sa automaticky prepočíta podľa nastaveného kurzu</li>
          <li>• Môžete tiež zadať vlastnú CZK cenu manuálne - tá má prednosť</li>
          <li>• Zmena kurzu neovplyvní existujúce manuálne zadané CZK ceny</li>
        </ul>
      </section>
    </AdminLayout>
  );
}
