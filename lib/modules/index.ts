/**
 * MODULAR ESHOP SYSTEM - Module Registry
 *
 * Centrálny registrátor všetkých modulov v systéme.
 * Pridanie nového modulu:
 * 1. Vytvorte priečinok v lib/modules/<nazov>
 * 2. Exportujte moduleDefinition z index.ts
 * 3. Importujte a pridajte do MODULES pola nižšie
 */

export interface ModuleRoute {
  path: string;
  label: string;
  icon?: string;
}

export interface ModuleAdminPanel {
  id: string;
  label: string;
  description?: string;
  component?: string; // názov komponentu na lazy load
  route?: string; // cesta na samostatnú stránku
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;

  // Databázové závislosti
  prismaModels?: string[];

  // API routes namespace
  apiNamespace?: string;

  // Admin panel sekcie
  adminPanels?: ModuleAdminPanel[];

  // Frontend routes
  routes?: ModuleRoute[];

  // Závislosti na iných moduloch
  dependencies?: string[];
}

// ===========================================
// MODULE DEFINITIONS
// ===========================================

export const authCustomerModule: ModuleDefinition = {
  id: 'auth-customer',
  name: 'Zákaznícka autentifikácia',
  description: 'Prihlásenie a registrácia zákazníkov',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['User'],
  apiNamespace: 'auth/customer',
  routes: [
    { path: '/auth/login', label: 'Prihlásenie' },
    { path: '/auth/register', label: 'Registrácia' },
    { path: '/account', label: 'Môj účet' }
  ]
};

export const authAdminModule: ModuleDefinition = {
  id: 'auth-admin',
  name: 'Admin autentifikácia',
  description: 'Prihlásenie administrátorov s 2FA',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['User'],
  apiNamespace: 'auth/admin',
  routes: [
    { path: '/admin/login', label: 'Admin prihlásenie' }
  ]
};

export const productsModule: ModuleDefinition = {
  id: 'products',
  name: 'Produkty',
  description: 'Katalóg produktov, kategórie a podkategórie',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['Product', 'Category', 'SubCategory'],
  apiNamespace: 'products',
  routes: [
    { path: '/produkty', label: 'Produkty' },
    { path: '/produkty/[slug]', label: 'Detail produktu' }
  ],
  adminPanels: [
    { id: 'admin-products', label: 'Katalóg produktov', route: '/admin/products' },
    { id: 'admin-categories', label: 'Kategórie', description: 'Správa kategórií a podkategórií', route: '/admin/categories' }
  ]
};

export const cartModule: ModuleDefinition = {
  id: 'cart',
  name: 'Košík',
  description: 'Nákupný košík a checkout proces',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'cart',
  routes: [
    { path: '/cart', label: 'Košík' },
    { path: '/checkout', label: 'Checkout' }
  ],
  dependencies: ['products', 'auth-customer']
};

export const ordersModule: ModuleDefinition = {
  id: 'orders',
  name: 'Objednávky',
  description: 'Správa objednávok a história',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['Order', 'OrderItem', 'OrderHistory'],
  apiNamespace: 'orders',
  adminPanels: [
    { id: 'admin-orders', label: 'Objednávky', route: '/admin/orders' }
  ],
  dependencies: ['products', 'auth-customer']
};

export const invoicesModule: ModuleDefinition = {
  id: 'invoices',
  name: 'Faktúry',
  description: 'Generovanie a správa faktúr',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['Invoice'],
  apiNamespace: 'invoices',
  adminPanels: [
    { id: 'admin-invoices', label: 'Faktúry', route: '/admin/invoices' },
    { id: 'admin-invoice-template', label: 'Šablóna faktúry', route: '/admin/invoices/template' }
  ],
  dependencies: ['orders']
};

export const chatModule: ModuleDefinition = {
  id: 'chat',
  name: 'Live chat',
  description: 'Chat widget dostupný na celom webe',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'chat',
  adminPanels: [
    { id: 'admin-chat', label: 'Chat nastavenia', description: '- Tawk.to integrácia\n - Chatwoot integrácia', route: '/admin/chat' }
  ]
};

export const emailModule: ModuleDefinition = {
  id: 'email',
  name: 'Email',
  description: 'SMTP odosielanie, testy a viac adries podľa účelu',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'email',
  adminPanels: [
    { id: 'admin-email', label: 'Email', description: 'SMTP, adresy a test odoslania', route: '/admin/settings/email' }
  ]
};

export const systemModule: ModuleDefinition = {
  id: 'system',
  name: 'Systém',
  description: 'Údržba a reštart aplikácie',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'system',
  adminPanels: [
    { id: 'admin-restart', label: 'Reštart e-shopu', description: 'Reštart dev/procesu', route: '/admin/settings/restart' }
  ]
};

export const issuesModule: ModuleDefinition = {
  id: 'issues',
  name: 'Hlásenia chýb',
  description: 'Excel štýl tabuľky pre bugy s prioritami a stavmi',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['Issue'],
  apiNamespace: 'issues',
  adminPanels: [
    { id: 'admin-issues', label: 'Hlásenia chýb', description: 'Nové, v riešení, vyriešené s prioritami 1-5', route: '/admin/issues' }
  ]
};

// SITE MODULES - PAGES (Modulárna hierarchická štruktúra)
// Všetky stránkové moduly sú v lib/modules/site/pages/
// Zoskupené pod jednu sekciu "Stránka" v admin menu
export const sitePagesModule: ModuleDefinition = {
  id: 'site-pages',
  name: 'Stránka',
  description: 'Správa obsahu a nastavení stránky',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['Config'],
  apiNamespace: 'site',
  adminPanels: [
    { id: 'admin-visual', label: 'Vizuál & pozadie', description: 'Hero pozadie a farby', route: '/admin/visual' },
    { id: 'admin-links', label: 'Linky & odkazy', description: 'Footer linky', route: '/admin/links' },
    { id: 'admin-navigation', label: 'Menu', description: 'Hlavné menu eshopu', route: '/admin/menu' },
    { id: 'admin-admin-menu', label: 'Admin menu', description: 'Menu v admin paneli', route: '/admin/admin-menu' }
  ]
};

// LEGACY - zachované pre spätnú kompatibilitu
export const siteSettingsModule: ModuleDefinition = {
  id: 'site-settings',
  name: 'Nastavenia webu (legacy)',
  description: 'Vizuál, pozadie, odkazy a menu - DEPRECATED',
  version: '1.0.0',
  enabled: false, // vypnuté, použite site-visual, site-links, site-menu
  prismaModels: ['Config'],
  apiNamespace: 'site-settings',
  adminPanels: []
};

export const flexibeeModule: ModuleDefinition = {
  id: 'flexibee',
  name: 'ABRA Flexi',
  description: 'Integrácia s účtovným systémom ABRA Flexi',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'flexibee',
  adminPanels: [
    { id: 'admin-flexi', label: 'ABRA Flexi', route: '/admin/settings/flexibee' }
  ],
  dependencies: ['invoices']
};

export const loggingModule: ModuleDefinition = {
  id: 'logging',
  name: 'Logovanie',
  description: 'Audit log a systémové udalosti',
  version: '1.0.0',
  enabled: true,
  prismaModels: [],
  apiNamespace: 'logs',
  adminPanels: [
    { id: 'admin-audit', label: 'Audit log', description: 'História zmien' },
    { id: 'admin-system', label: 'Systémové udalosti', description: 'Chyby a upozornenia' }
  ]
};

export const usersModule: ModuleDefinition = {
  id: 'users',
  name: 'Správa používateľov',
  description: 'Vytváranie, editácia a 2FA pre používateľov',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['User'],
  apiNamespace: 'users',
  adminPanels: [
    { id: 'admin-admins', label: 'Administrátori', description: 'Správa admin účtov', route: '/admin/users?tab=admins' },
    { id: 'admin-customers', label: 'Zákazníci', description: 'Správa zákazníckych účtov', route: '/admin/users?tab=customers' }
  ],
  dependencies: ['auth-admin']
};

// ===========================================
// MODULE REGISTRY
// ===========================================

export const MODULES: ModuleDefinition[] = [
  authCustomerModule,
  authAdminModule,
  productsModule,
  cartModule,
  ordersModule,
  invoicesModule,
  chatModule,
  emailModule,
  systemModule,
  issuesModule,
  // Site moduly - zoskupené pod "Stránka"
  sitePagesModule,
  // Legacy
  siteSettingsModule,
  // Ostatné
  flexibeeModule,
  loggingModule,
  usersModule
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Získa modul podľa ID
 */
export function getModule(moduleId: string): ModuleDefinition | undefined {
  return MODULES.find(m => m.id === moduleId);
}

/**
 * Získa všetky povolené moduly
 */
export function getEnabledModules(): ModuleDefinition[] {
  return MODULES.filter(m => m.enabled);
}

/**
 * Získa všetky admin panely z povolených modulov
 */
export function getAdminPanels(): ModuleAdminPanel[] {
  return getEnabledModules()
    .flatMap(m => m.adminPanels || []);
}

/**
 * Získa admin panely zoskupené podľa modulov
 */
export interface AdminMenuSection {
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  panels: ModuleAdminPanel[];
}

export function getAdminMenuSections(): AdminMenuSection[] {
  return getEnabledModules()
    .filter(m => m.adminPanels && m.adminPanels.length > 0)
    .map(m => ({
      moduleId: m.id,
      moduleName: m.name,
      moduleDescription: m.description,
      panels: m.adminPanels || []
    }));
}

/**
 * Skontroluje, či sú závislosti modulu splnené
 */
export function checkModuleDependencies(moduleId: string): { valid: boolean; missing: string[] } {
  const moduleDef = getModule(moduleId);
  if (!moduleDef) return { valid: false, missing: [] };

  const missing = (moduleDef.dependencies || []).filter(depId => {
    const dep = getModule(depId);
    return !dep || !dep.enabled;
  });

  return { valid: missing.length === 0, missing };
}

/**
 * Získa všetky API namespaces
 */
export function getApiNamespaces(): string[] {
  return getEnabledModules()
    .map(m => m.apiNamespace)
    .filter((ns): ns is string => !!ns);
}
