'use client';

import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { useLanguage } from '@/components/LanguageContext';
import { type Product } from '@/types/product';
import { type SiteSettings } from '@/lib/siteSettings';

type HomeContentProps = {
  siteSettings: SiteSettings;
  products: Product[];
  featuredProducts: Product[];
};

export function HomeContent({ siteSettings, products, featuredProducts }: HomeContentProps) {
  const { language } = useLanguage();
  const highlights = siteSettings.hero.highlights || [];

  return (
    <div className="bg-slate-50">
      <Navbar
        logoLinks={{
          logoPrimaryLink: siteSettings.links.logoPrimaryLink,
          logoAdminLink: siteSettings.links.logoAdminLink
        }}
      />
      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        <Hero heroSettings={siteSettings.hero} />

        {!!highlights.length && (
          <section className="grid gap-6 md:grid-cols-3">
            {highlights.map((usp, idx) => (
              <div key={`${usp.metric}-${idx}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <p className="text-3xl font-semibold text-slate-900">{usp.metric}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{usp.title}</p>
                <p className="mt-2 text-sm text-slate-500">{usp.copy}</p>
              </div>
            ))}
          </section>
        )}

        <ProductGrid products={products} />

        <section className="mt-4 rounded-3xl bg-white p-10 shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Odporucame</p>
              <h2 className="text-2xl font-semibold text-slate-900">Riesenia pre vasu infrastrukturu</h2>
            </div>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <div key={product.slug} className="rounded-2xl border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">{product.tagline}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {new Intl.NumberFormat(language === 'cz' ? 'cs-CZ' : 'sk-SK', {
                    style: 'currency',
                    currency: product.currency.replace(/[^A-Z]/gi, '') || 'EUR',
                    minimumFractionDigits: 0
                  }).format(product.price)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer manualLinks={siteSettings.links.footerLinks} />
    </div>
  );
}
