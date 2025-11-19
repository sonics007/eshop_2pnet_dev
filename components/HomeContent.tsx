'use client';

import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { useLanguage } from '@/components/LanguageContext';
import { type Product } from '@/types/product';
import { type SiteSettings } from '@/lib/siteSettings';

const homeCopy = {
  sk: {
    uspCards: [
      {
        title: 'Servis do 48 h',
        copy: 'Lokálny tím inžinierov vyrazí do dvoch pracovných dní, presne ako na 2pnet.cz.',
        metric: '48h'
      },
      {
        title: 'Zero-trust štandard',
        copy: 'Každé zariadenie je overené AI politikami ešte pred pripojením do siete.',
        metric: 'ZTNA'
      },
      {
        title: 'Ekologická logistika',
        copy: 'Partneri s CO₂ neutralitou a transparentným trackingom zásielok.',
        metric: '-32%'
      }
    ],
    recommendedLabel: 'Odporúčané',
    recommendedTitle: 'Riešenia pre vašu infraštruktúru'
  },
  cz: {
    uspCards: [
      {
        title: 'Servis do 48 h',
        copy: 'Lokální tým inženýrů vyrazí do dvou pracovních dnů, stejně jako na 2pnet.cz.',
        metric: '48h'
      },
      {
        title: 'Zero-trust standard',
        copy: 'Každé zařízení je ověřeno politikami zero-trust ještě před připojením do sítě.',
        metric: 'ZTNA'
      },
      {
        title: 'Ekologická logistika',
        copy: 'Partneři s CO₂ neutralitou a transparentním trackingem zásilek.',
        metric: '-32%'
      }
    ],
    recommendedLabel: 'Doporučujeme',
    recommendedTitle: 'Řešení pro vaši infrastrukturu'
  }
} as const;

type HomeContentProps = {
  siteSettings: SiteSettings;
  products: Product[];
  featuredProducts: Product[];
};

export function HomeContent({ siteSettings, products, featuredProducts }: HomeContentProps) {
  const { language } = useLanguage();
  const copy = homeCopy[language];

  return (
    <div className="bg-slate-50">
      <Navbar
        logoLinks={{
          logoPrimaryLink: siteSettings.links.logoPrimaryLink,
          logoAdminLink: siteSettings.links.logoAdminLink
        }}
      />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Hero heroSettings={siteSettings.hero} />

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.uspCards.map((usp) => (
            <div key={usp.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-3xl font-semibold text-slate-900">{usp.metric}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{usp.title}</p>
              <p className="mt-2 text-sm text-slate-500">{usp.copy}</p>
            </div>
          ))}
        </section>

        <ProductGrid products={products} />

        <section className="mt-16 rounded-3xl bg-white p-10 shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{copy.recommendedLabel}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{copy.recommendedTitle}</h2>
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

