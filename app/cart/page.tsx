'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useCustomerAuth } from '@/lib/modules/auth/customer/context';
import { useCart } from '@/components/CartContext';
import { useLanguage } from '@/components/LanguageContext';
import { LANGUAGE_CURRENCY_MAP } from '@/types/product';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totals } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const { language } = useLanguage();
  const languageConfig = LANGUAGE_CURRENCY_MAP[language] ?? LANGUAGE_CURRENCY_MAP.sk;
  const displayCurrency = totals.currency || languageConfig.currency;
  const localeForCurrency = (currency: string) => (currency === 'CZK' ? 'cs-CZ' : languageConfig.locale);
  const formatCurrency = (value: number, currency = displayCurrency) =>
    new Intl.NumberFormat(localeForCurrency(currency), { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  const multipleCurrencies = Object.keys(totals.breakdown).length > 1;

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Krok 0</p>
            <h1 className="text-4xl font-semibold text-slate-900">Košík</h1>
            <p className="mt-2 text-sm text-slate-500">Skontrolujte obsah, upravte množstvo a pokračujte k pokladni.</p>
          </div>
          <Link
            href="/produkty"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Pokračovať v nákupe
          </Link>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {items.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Váš košík je prázdny. Pridajte produkty zo stránky „Produkty“.
              </div>
            )}
            {items.map((item) => (
              <div
                key={item.slug}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-4 md:w-2/3">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Bez obrázka
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Produkt</p>
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      Cena za ks: {formatCurrency(item.price, item.currency)}{' '}
                      <span className="text-xs text-slate-400">(DPH {item.vatRate ?? 20}%)</span>
                    </p>
                  </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        className="px-3 py-2 text-lg"
                        aria-label="Znížiť množstvo"
                        onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="px-4 text-base font-semibold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-2 text-lg"
                        aria-label="Zvýšiť množstvo"
                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                      onClick={() => removeItem(item.slug)}
                    >
                      Odstrániť
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Spolu</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-lg font-semibold text-slate-900">Sumár objednávky</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Medzisúčet</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {Object.entries(totals.vatByRate).map(([rate, amount]) => (
                <div className="flex justify-between text-slate-500" key={rate}>
                  <span>DPH {rate}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-semibold text-slate-900">
                <span>Celkom</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
              {multipleCurrencies && (
                <p className="text-xs text-amber-600">
                  V košíku máte položky s rôznymi menami. Súhrn zobrazuje menu {displayCurrency}.
                </p>
              )}
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
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Fakturácia</p>
              <p>Platba na faktúru so splatnosťou 14 dní. PDF dostanete po potvrdení objednávky.</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
