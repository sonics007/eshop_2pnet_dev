/**
 * LINKS MODULE - Types
 * Typy pre správu odkazov a linkov
 */

export interface LinkSettings {
  logoPrimaryLink: string;
  logoAdminLink: string;
  footerLinks: Array<{
    label: string;
    value: string;
  }>;
}

export const defaultLinkSettings: LinkSettings = {
  logoPrimaryLink: 'https://www.2pnet.cz',
  logoAdminLink: '/admin',
  footerLinks: [
    { label: 'Servis UPS', value: 'https://www.2pnet.cz/servis-ups' },
    { label: 'Klimatizacie', value: 'https://www.2pnet.cz/klimatizace' },
    { label: 'IT infrastruktura', value: 'https://www.2pnet.cz/servis-it' }
  ]
};
