'use client';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { type FormEvent, useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-900">Kontakt</h1>
        <p className="mt-2 text-sm text-slate-500">
          Napíšte nám o projekte, licencii alebo partnerskej spolupráci. Ozveme sa do 24 hodín.
        </p>
        <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          <div>
            <label className="text-sm font-semibold text-slate-700">Meno a priezvisko</label>
            <input
              required
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Spoločnosť</label>
            <input
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              required
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Správa</label>
            <textarea
              required
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900"
          >
            {sent ? 'Odoslané' : 'Poslať správu'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
