'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function RestartPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    setLoading(true);
    setMessage('Požiadavka na reštart sa odosiela...');
    try {
      const res = await fetch('/api/admin/restart', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Reštart sa nepodaril');
      }
      setMessage(data.message || 'Reštart bol spustený.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reštart sa nepodaril.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activePanel="admin-restart">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Systém</p>
        <h1 className="text-4xl font-semibold text-slate-900">Reštart e-shopu</h1>
        <p className="mt-2 text-sm text-slate-500">
          Spustite reštart aplikácie. V prostredí dev to môže vyžadovať manuálny zásah (stop/start procesu).
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm text-slate-600">
          Reštart ukončí aktuálny serverový proces. Ak bežíte cez npm run dev, môže byť potrebné server znovu spustiť
          manuálne. V produkcii použite proces manager (PM2/systemd).
        </p>
        <button
          type="button"
          onClick={handleRestart}
          disabled={loading}
          className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Spúšťam…' : 'Reštartovať'}
        </button>
        {message && (
          <p className="text-sm text-slate-600">
            {message}
          </p>
        )}
      </section>
    </AdminLayout>
  );
}
