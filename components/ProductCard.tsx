'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types/product';
import { useLanguage } from '@/components/LanguageContext';
import { useCart } from '@/components/CartContext';
import { formatLocalizedPrice, getLocalizedPrice } from '@/lib/pricing';

const buttonCopy = {
  sk: { add: 'Pridať do košíka', added: 'Pridané' },
  cz: { add: 'Přidat do košíku', added: 'Přidáno' }
} as const;

export function ProductCard({ product }: { product: Product }) {
  const { language } = useLanguage();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const labels = buttonCopy[language];
  const { addItem } = useCart();
  const translation = product.translations?.[language];
  const productName = translation?.name ?? product.name;
  const tagline = translation?.tagline ?? product.tagline;
  const badge = translation?.badge ?? product.badge;
  const specs = translation?.specs?.length ? translation.specs : product.specs;

  // Získanie lokalizovanej ceny a meny podľa jazyka
  const localizedPrice = getLocalizedPrice(product, language);

  const handleAdd = () => {
    console.info('[Cart] add', product.slug, 'qty', quantity);
    addItem(
      { ...product, name: productName },
      quantity,
      { price: localizedPrice.price, currency: localizedPrice.currency }
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="card-sheen flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <Link href={`/produkty/${product.slug}`} className="group block">
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-100 transition group-hover:shadow-lg">
          {product.image ? (
            <Image
              src={product.image}
              alt={productName}
              width={800}
              height={600}
              className="h-56 w-full object-contain transition group-hover:scale-[1.01] bg-white"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center text-sm text-slate-400">Bez vizuálu</div>
          )}
          {badge && (
            <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900">
              {badge}
            </span>
          )}
        </div>
      </Link>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.category}</p>
      <Link href={`/produkty/${product.slug}`} className="mt-2 text-2xl font-semibold text-slate-900 transition hover:text-slate-700">
        {productName}
      </Link>
      {tagline && <p className="mt-2 text-sm text-slate-500">{tagline}</p>}
      <ul className="mt-4 space-y-2 text-sm text-slate-500">
        {specs.slice(0, 3).map((spec) => (
          <li key={spec}>• {spec}</li>
        ))}
      </ul>
      <div className="mt-auto space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              bez DPH: {formatLocalizedPrice(localizedPrice.price, localizedPrice.currency, localizedPrice.locale)}
            </p>
            <span className="text-2xl font-semibold text-slate-900">
              {formatLocalizedPrice(
                localizedPrice.price * (1 + (product.vatRate ?? 20) / 100),
                localizedPrice.currency,
                localizedPrice.locale
              )}
            </span>
            {product.billingPeriod && (
              <span className="ml-1 text-sm text-slate-400">/ {product.billingPeriod}</span>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
            <button
              type="button"
              className="px-2 text-base text-slate-700"
              aria-label="Znížiť počet kusov"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-base text-slate-900">{quantity}</span>
            <button
              type="button"
              className="px-2 text-base text-slate-700"
              aria-label="Zvýšiť počet kusov"
              onClick={() => setQuantity((value) => value + 1)}
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {added ? labels.added : labels.add}
        </button>
      </div>
    </article>
  );
}
