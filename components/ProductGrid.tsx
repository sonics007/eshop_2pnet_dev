'use client';

import { useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/components/LanguageContext';

const DEFAULT_CATEGORY_VALUE = '__ALL__';

const copy = {
  sk: {
    subtitle: 'Najpredávanejšie',
    title: 'Riešenia pripravené na okamžité nasadenie',
    all: 'Všetko'
  },
  cz: {
    subtitle: 'Nejprodávanější',
    title: 'Řešení připravená k okamžitému nasazení',
    all: 'Vše'
  }
} as const;

export function ProductGrid({ products }: { products: Product[] }) {
  const { language } = useLanguage();
  const text = copy[language];

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).map((value) => ({
      value,
      label: value
    }));
    return [{ value: DEFAULT_CATEGORY_VALUE, label: text.all }, ...unique];
  }, [products, text.all]);

  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY_VALUE);

  const filteredProducts = useMemo(() => {
    if (activeCategory === DEFAULT_CATEGORY_VALUE) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  return (
    <section className="mt-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{text.subtitle}</p>
          <h2 className="text-2xl font-semibold text-slate-900">{text.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                activeCategory === category.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </header>
      <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

