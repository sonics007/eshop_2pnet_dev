'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '@/lib/siteSettings';

type HeroProps = {
  heroSettings?: SiteSettings['hero'];
};

export function Hero({ heroSettings }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = heroSettings?.carouselImages?.length
    ? heroSettings.carouselImages
    : heroSettings?.backgroundImage
      ? [heroSettings.backgroundImage]
      : [];

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  const backgroundUrl = images.length ? images[activeIndex] : heroSettings?.backgroundImage;
  const backgroundLayer = backgroundUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(5,18,37,0.9), rgba(15,23,42,0.75)), url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined;

  const highlights = useMemo(() => heroSettings?.highlights ?? [], [heroSettings]);

  return (
    <section className="hero-gradient relative overflow-hidden rounded-[40px] p-10 text-white shadow-xl" style={backgroundLayer}>
      <div className="grid gap-10 md:grid-cols-[2fr,1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">2pnet s.r.o.</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">{heroSettings?.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{heroSettings?.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={heroSettings?.primaryCtaLink || '#'} className="rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg">
              {heroSettings?.primaryCtaLabel}
            </Link>
            <Link href={heroSettings?.secondaryCtaLink || '#'} className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white">
              {heroSettings?.secondaryCtaLabel}
            </Link>
          </div>
          {!!images.length && (
            <div className="mt-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`h-2 w-6 rounded-full transition ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-white/10 p-6 text-sm text-white/80 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Priamy kontakt</p>
          <ul className="mt-4 space-y-3">
            <li>
              Tel.:{' '}
              <a href="tel:+420490520015" className="font-semibold text-white">
                +420 490 520 015
              </a>
            </li>
            <li>Stefanikova 802, 293 01 Mlada Boleslav</li>
            <li>Servis UPS • Klimatizacie • Elektroinstalacie</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/20 p-4 text-xs uppercase tracking-[0.2em] text-white/70">
            ISO 9001 & ISO 14001 | Lokalny tim 24/7 | Zero-trust standard
          </div>
        </div>
      </div>
      {!!highlights.length && (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlights.map((h, idx) => (
            <div key={`${h.metric}-${idx}`} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-3xl font-semibold text-white">{h.metric}</p>
              <p className="mt-2 text-base font-semibold text-white">{h.title}</p>
              <p className="mt-2 text-sm text-white/80">{h.copy}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
