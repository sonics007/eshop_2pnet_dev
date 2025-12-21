/**
 * VISUAL MODULE - Types
 * Typy pre správu vizuálu a hero sekcie
 */

export interface HighlightItem {
  metric: string;
  title: string;
  copy: string;
  // Czech translations
  titleCz?: string;
  copyCz?: string;
}

export interface VisualSettingsTranslations {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

export interface VisualSettings {
  backgroundImage: string;
  carouselImages: string[];
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  highlights: HighlightItem[];
  secondaryHighlights: HighlightItem[];
  // Translations
  translations?: {
    cz?: VisualSettingsTranslations;
  };
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
    { metric: '48h', title: 'Servis do 48 h', copy: 'Lokalny tim inzinierov vyrazi do dvoch pracovnych dni.', titleCz: '', copyCz: '' },
    { metric: 'ZTNA', title: 'Zero-trust standard', copy: 'Kazde zariadenie je overene politikami zero-trust.', titleCz: '', copyCz: '' },
    { metric: '-32%', title: 'Ekologicka logistika', copy: 'Partneri s CO2 neutralitou a transparentnym trackingom.', titleCz: '', copyCz: '' }
  ],
  secondaryHighlights: [
    { metric: '48h', title: 'Servis do 48 h', copy: 'Lokalny tim inzinierov vyrazi do dvoch pracovnych dni.', titleCz: '', copyCz: '' },
    { metric: 'ZTNA', title: 'Zero-trust standard', copy: 'Kazde zariadenie je overene politikami zero-trust.', titleCz: '', copyCz: '' },
    { metric: '-32%', title: 'Ekologicka logistika', copy: 'Partneri s CO2 neutralitou a transparentnym trackingom.', titleCz: '', copyCz: '' }
  ],
  translations: {
    cz: {
      title: '',
      description: '',
      primaryCtaLabel: '',
      secondaryCtaLabel: ''
    }
  }
};
