'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types/product';
import { useCart } from '@/components/CartContext';
import { useLanguage } from '@/components/LanguageContext';

const detailCopy = {
  sk: {
    add: 'Pridať do košíka',
    added: 'V košíku',
    goto: 'Zobraziť košík',
    description: 'Popis riešenia',
    specs: 'Technické parametre',
    promotion: 'Mimoriadna ponuka',
    availabilityInStock: 'Skladom ihneď',
    availabilityOnDemand: 'Na objednávku',
    gallery: 'Galéria',
    quantity: 'Počet kusov'
  },
  cz: {
    add: 'Přidat do košíku',
    added: 'V košíku',
    goto: 'Zobrazit košík',
    description: 'Popis řešení',
    specs: 'Technické parametry',
    promotion: 'Mimořádná nabídka',
    availabilityInStock: 'Skladem ihned',
    availabilityOnDemand: 'Na objednávku',
    gallery: 'Galerie',
    quantity: 'Počet kusů'
  }
} as const;

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
  const { language } = useLanguage();
  const { addItem } = useCart();
  const text = detailCopy[language];
  const translation = product.translations?.[language];
  const productName = translation?.name ?? product.name;
  const tagline = translation?.tagline ?? product.tagline;
  const description = translation?.description ?? product.description;
  const specs = translation?.specs?.length ? translation.specs : product.specs;
  const promotion = translation?.promotion ?? product.promotion;

  const gallerySources = useMemo(() => {
    const unique = new Set<string>();
    if (product.image) unique.add(product.image);
    product.gallery?.forEach((src) => {
      if (src) unique.add(src);
    });
    return Array.from(unique);
  }, [product.image, product.gallery]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveIndex(0);
    setQuantity(1);
    setAdded(false);
  }, [product.slug]);

  const activeImage = gallerySources[activeIndex];

  const handleAdd = () => {
    console.info('[Cart] add detail', product.slug, 'qty', quantity);
    addItem({ ...product, name: productName }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-12">
      <div className="grid gap-10 lg:grid-cols-[3fr,2fr]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={productName}
                width={900}
                height={700}
                className="h-[420px] w-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                {language === 'cz' ? 'Bez dostupného obrázku' : 'Bez dostupného obrázka'}
              </div>
            )}
          </div>
          {gallerySources.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{text.gallery}</p>
              <div className="flex gap-3 overflow-x-auto">
                {gallerySources.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border transition ${
                      activeIndex === index ? 'border-slate-900' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt={`${productName} ${index + 1}`} width={120} height={120} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.category}</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">{productName}</h1>
            {tagline && <p className="mt-2 text-base text-slate-600">{tagline}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-3xl font-semibold text-slate-900">
              {new Intl.NumberFormat(language === 'cz' ? 'cs-CZ' : 'sk-SK', {
                style: 'currency',
                currency: product.currency.replace(/[^A-Z]/gi, '') || 'EUR',
                minimumFractionDigits: 0
              }).format(product.price)}
              {product.billingPeriod && (
                <span className="text-base font-normal text-slate-500"> / {product.billingPeriod}</span>
              )}
            </p>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {product.stock && product.stock > 0 ? text.availabilityInStock : text.availabilityOnDemand}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{text.quantity}</span>
              <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-lg"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Znížiť počet kusov"
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-lg"
                  onClick={() => setQuantity((value) => value + 1)}
                  aria-label="Zvýšiť počet kusov"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              {added ? text.added : text.add}
            </button>
            <Link
              href="/cart"
              className="flex-1 rounded-full border border-slate-900 px-6 py-3 text-center text-base font-semibold text-slate-900"
            >
              {text.goto}
            </Link>
          </div>
          {promotion && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">{text.promotion}</p>
              <p className="mt-2 text-sm text-amber-700">{promotion}</p>
            </div>
          )}
          {specs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{text.specs}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {specs.map((spec) => (
                  <li key={spec} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {description && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{text.description}</p>
          <p className="mt-3 text-base leading-relaxed text-slate-600 whitespace-pre-line">{description}</p>
        </section>
      )}
    </div>
  );
}
