/**
 * LEGACY COMPATIBILITY LAYER
 * Tento súbor je zachovaný pre spätnú kompatibilitu.
 * Nový kód by mal používať moduly z lib/modules/site/
 */

// Import len typov (nie service funkcií s fs/path)
import type { VisualSettings } from '@/lib/modules/site/pages/visual/types';
import type { LinkSettings } from '@/lib/modules/site/pages/links/types';

export type SiteSettings = {
  hero: VisualSettings;
  links: LinkSettings;
};

// Inline defaults aby sme sa vyhli circular imports
export const defaultSiteSettings: SiteSettings = {
  hero: {
    backgroundImage: '',
    carouselImages: [],
    title: 'Technologie a servis, ktore nakopnu vase podnikanie este tento tyzden.',
    description: 'Dodavky UPS, klimatizacii a IT infrastruktury so zasahom do 48 hodin a lokalnou podporou.',
    primaryCtaLabel: 'Objavit riesenia',
    primaryCtaLink: '/produkty',
    secondaryCtaLabel: 'Kontaktovat experta',
    secondaryCtaLink: '/kontakt',
    highlights: [
      { metric: '48h', title: 'Servis do 48 h', copy: 'Lokalny tim inzinierov vyrazi do dvoch pracovnych dni.' },
      { metric: 'ZTNA', title: 'Zero-trust standard', copy: 'Kazde zariadenie je overene politikami zero-trust.' },
      { metric: '-32%', title: 'Ekologicka logistika', copy: 'Partneri s CO2 neutralitou a transparentnym trackingom.' }
    ],
    secondaryHighlights: [
      { metric: '48h', title: 'Servis do 48 h', copy: 'Lokalny tim inzinierov vyrazi do dvoch pracovnych dni.' },
      { metric: 'ZTNA', title: 'Zero-trust standard', copy: 'Kazde zariadenie je overene politikami zero-trust.' },
      { metric: '-32%', title: 'Ekologicka logistika', copy: 'Partneri s CO2 neutralitou a transparentnym trackingom.' }
    ]
  },
  links: {
    logoPrimaryLink: 'https://www.2pnet.cz',
    logoAdminLink: '/admin',
    footerLinks: [
      { label: 'Servis UPS', value: 'https://www.2pnet.cz/servis-ups' },
      { label: 'Klimatizacie', value: 'https://www.2pnet.cz/klimatizace' },
      { label: 'IT infrastruktura', value: 'https://www.2pnet.cz/servis-it' }
    ]
  }
};

export function mergeSiteSettings(payload: Partial<SiteSettings> | null | undefined): SiteSettings {
  const hero: Partial<VisualSettings> = payload?.hero ?? {};
  const links: Partial<LinkSettings> = payload?.links ?? {};

  const defaultHero = defaultSiteSettings.hero;
  const defaultLinks = defaultSiteSettings.links;

  const mergeHighlights = (items?: any[], defaults?: any[]) => {
    if (!items?.length) return defaults ?? [];
    return items.map((item, idx) => ({
      metric: item.metric ?? defaults?.[idx]?.metric ?? '',
      title: item.title ?? defaults?.[idx]?.title ?? '',
      copy: item.copy ?? defaults?.[idx]?.copy ?? '',
      titleCz: item.titleCz ?? defaults?.[idx]?.titleCz ?? '',
      copyCz: item.copyCz ?? defaults?.[idx]?.copyCz ?? ''
    }));
  };

  return {
    hero: {
      backgroundImage: hero.backgroundImage ?? defaultHero.backgroundImage,
      carouselImages: hero.carouselImages ?? defaultHero.carouselImages,
      title: hero.title ?? defaultHero.title,
      description: hero.description ?? defaultHero.description,
      primaryCtaLabel: hero.primaryCtaLabel ?? defaultHero.primaryCtaLabel,
      primaryCtaLink: hero.primaryCtaLink ?? defaultHero.primaryCtaLink,
      secondaryCtaLabel: hero.secondaryCtaLabel ?? defaultHero.secondaryCtaLabel,
      secondaryCtaLink: hero.secondaryCtaLink ?? defaultHero.secondaryCtaLink,
      highlights: mergeHighlights(hero.highlights, defaultHero.highlights),
      secondaryHighlights: mergeHighlights(hero.secondaryHighlights, defaultHero.secondaryHighlights),
      translations: {
        cz: {
          title: hero.translations?.cz?.title ?? defaultHero.translations?.cz?.title ?? '',
          description: hero.translations?.cz?.description ?? defaultHero.translations?.cz?.description ?? '',
          primaryCtaLabel: hero.translations?.cz?.primaryCtaLabel ?? defaultHero.translations?.cz?.primaryCtaLabel ?? '',
          secondaryCtaLabel: hero.translations?.cz?.secondaryCtaLabel ?? defaultHero.translations?.cz?.secondaryCtaLabel ?? ''
        }
      }
    },
    links: {
      logoPrimaryLink: links.logoPrimaryLink ?? defaultLinks.logoPrimaryLink,
      logoAdminLink: links.logoAdminLink ?? defaultLinks.logoAdminLink,
      footerLinks: links.footerLinks ?? defaultLinks.footerLinks
    }
  };
}
