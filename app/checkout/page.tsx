'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthContext';
import { useCart } from '@/components/CartContext';

const currencyFormat = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('sk-SK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { items, totals, clearCart } = useCart();
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({
    name: '',
    company: user?.companyName ?? '',
    ico: user?.ico ?? '',
    dic: user?.dic ?? '',
    address: '',
    note: ''
  });

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Prihláste sa do svojho účtu</h1>
          <p className="mt-4 text-sm text-slate-500">
            Checkout je dostupný len pre B2B zákazníkov. Pokračujte prosím na stránku účtu, prihláste sa a následne sa
            sem vráťte.
          </p>
          <Link
            href="/account"
            className="mt-8 inline-flex rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900"
          >
            Prejsť na účet
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) {
      setMessage('Košík je prázdny. Pridajte produkty a skúste znova.');
      return;
    }
    const payload = {
      id: `OBJ-${Date.now()}`,
      customer: formState.company || formState.name,
      companyId: formState.ico,
      email: user?.email ?? '',
      status: 'Prijatá',
      total: totals.total,
      paymentMethod: 'Faktúra 14 dní',
      invoiceNumber: '—',
      assignedTo: 'Sales',
      note: formState.note,
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      history: [
        {
          status: 'Prijatá',
          timestamp: new Date().toISOString(),
          note: 'Objednávka vytvorená cez checkout'
        }
      ]
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setMessage(`Objednávka ${payload.id} bola uložená. Faktúru nájdete v admin sekcii.`);
        clearCart();
      } else {
        setMessage('Objednávka bola prijatá, ale DB je offline – skontrolujte logy.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Objednávka bola lokálne spracovaná, ale server ju nepotvrdil.');
    }
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500">
          Objednávka bude spracovaná na faktúru. Doručíme vám PDF do e-mailu {user?.email}.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-[2fr,1fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Meno a priezvisko
                <input
                  required
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Spoločnosť
                <input
                  value={formState.company}
                  onChange={(event) => setFormState({ ...formState, company: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                IČO
                <input
                  value={formState.ico}
                  onChange={(event) => setFormState({ ...formState, ico: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                DIČ / IČ DPH
                <input
                  value={formState.dic}
                  onChange={(event) => setFormState({ ...formState, dic: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Fakturačná adresa
              <input
                required
                value={formState.address}
                onChange={(event) => setFormState({ ...formState, address: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Poznámka
              <textarea
                rows={4}
                value={formState.note}
                onChange={(event) => setFormState({ ...formState, note: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button type="submit" className="w-full rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900">
              Potvrdiť objednávku
            </button>
            {message && <p className="text-xs text-emerald-600">{message}</p>}
          </form>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-lg font-semibold text-slate-900">Sumár objednávky</p>
            {items.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">Košík je prázdny.</p>
            ) : (
              <>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {items.map((item) => (
                    <li key={item.slug} className="flex items-center justify-between">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{currencyFormat(item.price * item.quantity, item.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Medzisúčet</span>
                    <span>{currencyFormat(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>DPH 20%</span>
                    <span>{currencyFormat(totals.vat)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Celkom</span>
                    <span>{currencyFormat(totals.total)}</span>
                  </div>
                </div>
              </>
            )}
            <Link href="/cart" className="mt-8 block text-center text-sm text-slate-500 underline">
              ‹ Späť do košíka
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

