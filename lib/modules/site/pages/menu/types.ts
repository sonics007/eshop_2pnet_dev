/**
 * MENU MODULE - Types
 * Typy pre správu hlavného menu
 */

export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
  children?: MenuItem[];
}

export interface MenuSettings {
  mainMenu: MenuItem[];
  footerMenu: MenuItem[];
  mobileMenuEnabled: boolean;
}

export const defaultMenuSettings: MenuSettings = {
  mainMenu: [
    { label: 'Domov', href: '/' },
    { label: 'Produkty', href: '/produkty' },
    { label: 'O nás', href: '/o-nas' },
    { label: 'Kontakt', href: '/kontakt' }
  ],
  footerMenu: [
    { label: 'Obchodné podmienky', href: '/obchodne-podmienky' },
    { label: 'Ochrana osobných údajov', href: '/ochrana-udajov' },
    { label: 'Cookies', href: '/cookies' }
  ],
  mobileMenuEnabled: true
};
