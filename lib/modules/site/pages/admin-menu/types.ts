/**
 * ADMIN MENU MODULE - Types
 * Typy pre správu admin menu
 */

export interface AdminMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  description?: string;
  enabled: boolean;
  order: number;
  children?: AdminMenuItem[];
}

export interface AdminMenuSettings {
  items: AdminMenuItem[];
  showDashboard: boolean;
  showLogout: boolean;
}

export const defaultAdminMenuSettings: AdminMenuSettings = {
  items: [
    { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: 'home', enabled: true, order: 0, description: 'Prehľad modulov a akcií' },
    {
      id: 'products',
      label: 'Produkty',
      href: '/admin/products',
      icon: 'box',
      enabled: true,
      order: 1,
      children: [
        { id: 'products-list', label: 'Zoznam produktov', href: '/admin/products', icon: 'list', enabled: true, order: 0, description: 'Správa katalógu' },
        { id: 'categories', label: 'Kategórie', href: '/admin/categories', icon: 'folder', enabled: true, order: 1, description: 'Strom kategórií' }
      ]
    },
    {
      id: 'sales',
      label: 'Predaj',
      href: '/admin/orders',
      icon: 'shopping-cart',
      enabled: true,
      order: 2,
      children: [
        { id: 'orders', label: 'Objednávky', href: '/admin/orders', icon: 'list', enabled: true, order: 0, description: 'Správa objednávok' },
        { id: 'invoices-list', label: 'Faktúry', href: '/admin/invoices', icon: 'file-text', enabled: true, order: 1, description: 'Vystavené faktúry' },
        { id: 'invoices-template', label: 'Šablóna faktúry', href: '/admin/invoices/template', icon: 'file', enabled: true, order: 2, description: 'Úprava šablóny' }
      ]
    },
    { id: 'users', label: 'Používatelia', href: '/admin/users', icon: 'users', enabled: true, order: 3, description: 'Administrátori a zákazníci' },
    { id: 'analytics', label: 'Analytika', href: '/admin/analytics', icon: 'bar-chart', enabled: true, order: 4, description: 'Štatistiky a návštevnosť' },
    { id: 'flexibee', label: 'ABRA Flexi', href: '/admin/settings/flexibee', icon: 'database', enabled: true, order: 5, description: 'Napojenie na ABRA Flexi' },
    { id: 'issues', label: 'Hlásenia chýb', href: '/admin/issues', icon: 'alert-circle', enabled: true, order: 6, description: 'Bugy s prioritou 1–5 a stavmi' },
    { id: 'chat', label: 'Chat', href: '/admin/chat', icon: 'message-circle', enabled: true, order: 7, description: 'Live chat nastavenia' },
    {
      id: 'settings',
      label: 'Stránka',
      href: '/admin/visual',
      icon: 'settings',
      enabled: true,
      order: 8,
      children: [
        { id: 'visual', label: 'Vizuál & pozadie', href: '/admin/visual', icon: 'image', enabled: true, order: 0, description: 'Hero, farby a pozadie' },
        { id: 'links', label: 'Linky & odkazy', href: '/admin/links', icon: 'link', enabled: true, order: 1, description: 'Footer a rýchle odkazy' },
        { id: 'menu', label: 'Menu eshopu', href: '/admin/menu', icon: 'menu', enabled: true, order: 2, description: 'Navigácia v eshope' },
        { id: 'pricing', label: 'Ceny & kurzy', href: '/admin/settings/pricing', icon: 'currency', enabled: true, order: 3, description: 'Cenové hladiny a kurzy' },
        { id: 'email', label: 'Email', href: '/admin/settings/email', icon: 'mail', enabled: true, order: 4, description: 'SMTP a adresy pre rôzne účely' },
        { id: 'newsletters', label: 'Newsletter', href: '/admin/newsletters', icon: 'send', enabled: true, order: 4.5, description: 'Tvorba a odosielanie newsletterov' },
        { id: 'site', label: 'Stránka', href: '/admin/settings/site', icon: 'globe', enabled: true, order: 5, description: 'Verejná URL (NEXT_PUBLIC_SITE_URL)' },
        { id: 'restart', label: 'Reštart e-shopu', href: '/admin/settings/restart', icon: 'power', enabled: true, order: 6, description: 'Reštart servera (dev)' },
        { id: 'admin-menu', label: 'Admin menu', href: '/admin/admin-menu', icon: 'layout', enabled: true, order: 7, description: 'Správa admin navigácie' }
      ]
    }
  ],
  showDashboard: true,
  showLogout: true
};
