export type SiteSettings = {
  hero: {
    backgroundImage: string;
    carouselImages: string[];
  };
  links: {
    logoPrimaryLink: string;
    logoAdminLink: string;
    footerLinks: Array<{ label: string; value: string }>;
  };
};

export const defaultSiteSettings: SiteSettings = {
  hero: {
    backgroundImage: '',
    carouselImages: []
  },
  links: {
    logoPrimaryLink: 'https://www.2pnet.cz',
    logoAdminLink: '/admin',
    footerLinks: [
      { label: 'Servis UPS', value: 'https://www.2pnet.cz/servis-ups' },
      { label: 'Klimatizácie', value: 'https://www.2pnet.cz/klimatizace' },
      { label: 'IT infraštruktúra', value: 'https://www.2pnet.cz/servis-it' }
    ]
  }
};

export function mergeSiteSettings(payload: Partial<SiteSettings> | null | undefined): SiteSettings {
  const hero = payload?.hero ?? {};
  const links = payload?.links ?? {};
  return {
    hero: {
      backgroundImage: hero.backgroundImage ?? defaultSiteSettings.hero.backgroundImage,
      carouselImages: hero.carouselImages ?? []
    },
    links: {
      logoPrimaryLink: links.logoPrimaryLink ?? defaultSiteSettings.links.logoPrimaryLink,
      logoAdminLink: links.logoAdminLink ?? defaultSiteSettings.links.logoAdminLink,
      footerLinks: links.footerLinks ?? defaultSiteSettings.links.footerLinks
    }
  };
}
