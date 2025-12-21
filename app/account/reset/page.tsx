"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: 'Token chýba.' });
      return;
    }
    if (!form.newPassword || form.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Heslo musí mať aspoň 6 znakov.' });
      return;
    }
    if (form.newPassword !== form.confirm) {
      setMessage({ type: 'error', text: 'Heslá sa nezhodujú.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/customer/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Heslo bolo zmenené.' });
        setTimeout(() => router.push('/account'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Zmena hesla zlyhala.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Chyba pripojenia.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-md px-6 py-12">
        <h1 className="text-3xl font-semibold text-slate-900">Obnova hesla</h1>
        <p className="mt-2 text-sm text-slate-500">Zadajte nové heslo a potvrďte.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {message && (
            <div
              className={`rounded-xl px-3 py-2 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : message.type === 'info'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-rose-50 text-rose-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Nové heslo
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Potvrdiť heslo
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Ukladám...' : 'Potvrdiť nové heslo'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
