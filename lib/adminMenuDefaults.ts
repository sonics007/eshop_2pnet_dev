export type AdminMenuItem = {
  id: string;
  label: string;
  description?: string;
  children?: AdminMenuItem[];
};

export const defaultAdminMenu: AdminMenuItem[] = [
  {
    id: 'section-administration',
    label: 'Administrácia',
    description: 'Globálne nastavenia a vizuál',
    children: [
      { id: 'admin-visual', label: 'Vizuál & pozadie' },
      { id: 'admin-links', label: 'Linky & odkazy' },
      { id: 'admin-navigation', label: 'Menu & podmenu' }
    ]
  },
  {
    id: 'section-users',
    label: 'Správa používateľov',
    description: 'Zákazníci a administrátori',
    children: [
      { id: 'admin-customers', label: 'Zákazníci' },
      { id: 'admin-admins', label: 'Administrátori' },
      { id: 'admin-access', label: 'Prístupy & práva' }
    ]
  },
  {
    id: 'section-documents',
    label: 'Doklady',
    description: 'Objednávky, faktúry a Flexi',
    children: [
      { id: 'admin-orders', label: 'Objednávky' },
      { id: 'admin-invoices', label: 'Faktúry' },
      { id: 'admin-flexi', label: 'ABRA Flexi' }
    ]
  },
  {
    id: 'section-products',
    label: 'Produkty',
    description: 'Katalóg, kategórie a akcie',
    children: [
      { id: 'admin-product-list', label: 'Katalóg produktov' },
      { id: 'admin-categories', label: 'Kategórie & podkategórie' },
      { id: 'admin-promotions', label: 'Akcie & kampane' }
    ]
  },
  {
    id: 'section-logging',
    label: 'Logovanie',
    description: 'Audit a sledovanie zmien',
    children: [
      { id: 'admin-audit', label: 'Audit log' },
      { id: 'admin-system', label: 'Systémové udalosti' }
    ]
  }
];
