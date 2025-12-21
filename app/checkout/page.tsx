'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useCustomerAuth } from '@/lib/modules/auth/customer/context';
import { useCart } from '@/components/CartContext';
import { useLanguage } from '@/components/LanguageContext';
import { LANGUAGE_CURRENCY_MAP } from '@/types/product';

export default function CheckoutPage() {
  const { isAuthenticated, user } = useCustomerAuth();
  const { items, totals, clearCart } = useCart();
  const { language } = useLanguage();
  const languageConfig = LANGUAGE_CURRENCY_MAP[language] ?? LANGUAGE_CURRENCY_MAP.sk;
  const displayCurrency = totals.currency || languageConfig.currency;
  const localeForCurrency = (currency: string) => (currency === 'CZK' ? 'cs-CZ' : languageConfig.locale);
  const formatCurrency = (value: number, currency = displayCurrency) =>
    new Intl.NumberFormat(localeForCurrency(currency), { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  const multipleCurrencies = Object.keys(totals.breakdown).length > 1;
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    company: user?.companyName ?? '',
    ico: user?.ico ?? '',
    dic: user?.dic ?? '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
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
      customer: formState.company || `${formState.firstName} ${formState.lastName}`.trim(),
      companyId: formState.ico,
      email: user?.email?.toLowerCase() ?? '',
      status: 'Prijatá',
      total: totals.total,
      paymentMethod: 'Faktúra 14 dní',
      invoiceNumber: '—',
      assignedTo: 'Sales',
      note: formState.note,
      address: `${formState.street}, ${formState.city} ${formState.zip}, ${formState.country}`,
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Krok 1</p>
            <h1 className="text-4xl font-semibold text-slate-900">Checkout</h1>
            <p className="mt-2 text-sm text-slate-500">
              Objednávka bude spracovaná na faktúru. PDF pošleme na {user?.email}.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <p className="font-semibold">Prihlásený zákazník</p>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-[2fr,1fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              Faktúru vystavíme na údaje nižšie. Vyplňte prosím všetky povinné polia.
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Meno
                <input
                  required
                  value={formState.firstName}
                  onChange={(event) => setFormState({ ...formState, firstName: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="Ján"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Priezvisko
                <input
                  required
                  value={formState.lastName}
                  onChange={(event) => setFormState({ ...formState, lastName: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="Novák"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Spoločnosť (voliteľné)
                <input
                  value={formState.company}
                  onChange={(event) => setFormState({ ...formState, company: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="2Pnet s.r.o."
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                IČO / IČ DPH (voliteľné)
                <input
                  value={formState.dic}
                  onChange={(event) => setFormState({ ...formState, dic: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="12345678"
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Ulica a číslo
                <input
                  required
                  value={formState.street}
                  onChange={(event) => setFormState({ ...formState, street: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="Hlavná 123"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Mesto
                <input
                  required
                  value={formState.city}
                  onChange={(event) => setFormState({ ...formState, city: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="Bratislava"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                PSČ
                <input
                  required
                  value={formState.zip}
                  onChange={(event) => setFormState({ ...formState, zip: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="811 01"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Štát
                <input
                  required
                  value={formState.country}
                  onChange={(event) => setFormState({ ...formState, country: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  placeholder="Slovensko"
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-slate-700">
              Poznámka pre predajcu
              <textarea
                rows={4}
                value={formState.note}
                onChange={(event) => setFormState({ ...formState, note: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                placeholder="Špeciálne pokyny k fakturácii alebo doručeniu."
              />
            </label>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button type="submit" className="flex-1 rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900">
                Potvrdiť objednávku
              </button>
              <Link href="/cart" className="text-sm text-slate-500 underline">
                ‹ Späť do košíka
              </Link>
            </div>
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
                      <span>{formatCurrency(item.price * item.quantity, item.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Medzisúčet</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>DPH 20%</span>
                    <span>{formatCurrency(totals.vat)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Celkom</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                {multipleCurrencies && (
                  <p className="text-xs text-amber-600">
                    Košík obsahuje viacero mien. Súhrn zobrazuje menu {displayCurrency}.
                  </p>
                )}
              </div>
            </>
            )}
            <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Faktúra</p>
              <p>Platba na faktúru so splatnosťou 14 dní. PDF príde na váš email.</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
