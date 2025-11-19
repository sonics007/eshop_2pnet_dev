 'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

type HeroProps = {
  heroSettings?: {
    backgroundImage?: string;
    carouselImages?: string[];
  };
};

const heroCopy = {
  sk: {
    intro: '2Pnet s.r.o.',
    headline: 'Technológie a servis, ktoré zrýchlia vaše podnikanie už tento týždeň.',
    description:
      'Dodávky UPS, klimatizácií a IT infraštruktúry so zásahom do 48 hodín a lokálnou podporou z Mladej Boleslavi.',
    primaryCta: 'Objaviť riešenia',
    secondaryCta: 'Kontaktovať experta',
    contactTitle: 'Priamy kontakt'
  },
  cz: {
    intro: '2Pnet s.r.o.',
    headline: 'Technologie a servis, které nakopnou vaše podnikání ještě tento týden.',
    description:
      'Dodávky UPS, klimatizací a IT infrastruktury se zásahem do 48 hodin a lokální podporou z Mladé Boleslavi.',
    primaryCta: 'Objevit řešení',
    secondaryCta: 'Kontaktovat experta',
    contactTitle: 'Přímý kontakt'
  }
} as const;

export function Hero({ heroSettings }: HeroProps) {
  const { language } = useLanguage();
  const copy = heroCopy[language];

  const backgroundLayer =
    heroSettings?.backgroundImage && heroSettings.backgroundImage.length > 0
      ? {
          backgroundImage: `linear-gradient(120deg, rgba(5,18,37,0.9), rgba(15,23,42,0.75)), url(${heroSettings.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      : undefined;

  return (
    <section
      className="hero-gradient relative overflow-hidden rounded-[40px] p-10 text-white shadow-xl"
      style={backgroundLayer}
    >
      <div className="grid gap-10 md:grid-cols-[2fr,1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-glow">{copy.intro}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">{copy.headline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{copy.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/produkty"
              className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href="/kontakt"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white"
            >
              {copy.secondaryCta}
            </Link>
          </div>
          {!!heroSettings?.carouselImages?.length && (
            <div className="mt-10 flex gap-3 overflow-x-auto">
              {heroSettings.carouselImages.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10"
                >
                  <Image
                    src={image}
                    alt={`Ilustrácia ${index + 1}`}
                    width={112}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-white/10 p-6 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-glow">{copy.contactTitle}</p>
          <ul className="mt-4 space-y-3">
            <li>
              Tel.:{' '}
              <a href="tel:+420490520015" className="font-semibold text-white">
                +420 490 520 015
              </a>
            </li>
            <li>Štefánikova 802, 293 01 Mladá Boleslav</li>
            <li>Servis UPS · Klimatizácie · Elektroinštalácie</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/20 p-4 text-xs uppercase tracking-[0.2em] text-white/70">
            ISO 9001 & ISO 14001 | Lokálny tím 24/7 | Zero-trust štandard
          </div>
        </div>
      </div>
    </section>
  );
}

