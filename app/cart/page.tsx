'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthContext';
import { useCart } from '@/components/CartContext';

const currencyFormat = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('sk-SK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);

export default function CartPage() {
  const { items, updateQuantity, removeItem, totals } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-900">Košík</h1>
        <p className="mt-2 text-sm text-slate-500">
          Spravujte množstvo, odstráňte položky alebo pokračujte na checkout.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {items.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Váš košík je prázdny. Pridajte produkty zo stránky „Produkty“.
              </div>
            )}
            {items.map((item) => (
              <div
                key={item.slug}
                className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card md:flex-row"
              >
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Produkt</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{item.name}</p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
                    <span>Množstvo:</span>
                    <div className="inline-flex items-center rounded-full border border-slate-200">
                      <button
                        type="button"
                        className="px-3 py-1 text-lg"
                        aria-label="Znížiť množstvo"
                        onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-1 text-lg"
                        aria-label="Zvýšiť množstvo"
                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="text-rose-500 underline" onClick={() => removeItem(item.slug)}>
                      Odstrániť
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {currencyFormat(item.price * item.quantity, item.currency)}
                </p>
              </div>
            ))}
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-lg font-semibold text-slate-900">Sumár objednávky</p>
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
            {isAuthenticated ? (
              <Link
                href="/checkout"
                className="mt-8 block rounded-full bg-brand-accent px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-lg"
              >
                Prejsť na checkout
              </Link>
            ) : (
              <div className="mt-6 space-y-3 text-sm text-slate-500">
                <p>Objednávku môže dokončiť iba prihlásený firemný klient.</p>
                <Link
                  href="/account"
                  className="block rounded-full border border-slate-900 px-6 py-3 text-center font-semibold text-slate-900"
                >
                  Prihlásiť sa alebo vytvoriť účet
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}


