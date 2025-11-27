/**
 * VISUAL MODULE - Types
 * Typy pre správu vizuálu a hero sekcie
 */

export interface VisualSettings {
  backgroundImage: string;
  carouselImages: string[];
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  highlights: Array<{
    metric: string;
    title: string;
    copy: string;
  }>;
}

export const defaultVisualSettings: VisualSettings = {
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
  ]
};
