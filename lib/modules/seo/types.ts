/**
 * SEO MODULE - Types
 *
 * Typy pre SEO nastavenia eshopu
 */

// ==================== GLOBAL SEO SETTINGS ====================

export interface SeoGlobalSettings {
  // Základné info o firme
  siteName: string;
  siteUrl: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  locale: string; // napr. sk_SK

  // Default meta tagy
  defaultTitle: string;
  titleTemplate: string; // napr. "%s | Názov eshopu"
  defaultDescription: string;
  defaultKeywords: string;
  defaultImage: string;

  // Social profiles
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;

  // Organization (pre Schema.org)
  organizationName: string;
  organizationLogo: string;
  organizationPhone?: string;
  organizationEmail?: string;
  organizationAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Verifikácie
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  facebookDomainVerification?: string;

  // Tracking IDs (ak nie sú v env)
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;

  // Sitemap
  sitemapEnabled: boolean;
  sitemapChangefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  sitemapPriority: number;

  // Robots
  robotsEnabled: boolean;
  robotsContent?: string;
}

export const defaultSeoGlobalSettings: SeoGlobalSettings = {
  siteName: 'Eshop',
  siteUrl: '',
  defaultLanguage: 'sk',
  supportedLanguages: ['sk', 'cz'],
  locale: 'sk_SK',

  defaultTitle: 'Eshop',
  titleTemplate: '%s | Eshop',
  defaultDescription: '',
  defaultKeywords: '',
  defaultImage: '',

  organizationName: '',
  organizationLogo: '',

  sitemapEnabled: true,
  sitemapChangefreq: 'weekly',
  sitemapPriority: 0.5,

  robotsEnabled: true
};

// ==================== PAGE SEO ====================

export interface SeoPageData {
  id?: number;
  path: string;
  pageType?: 'home' | 'product' | 'category' | 'page' | 'blog' | 'other';

  // Meta
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';

  // Twitter
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Robots
  noIndex?: boolean;
  noFollow?: boolean;

  // Structured Data
  structuredData?: Record<string, unknown>;
}

// ==================== REDIRECTS ====================

export interface SeoRedirect {
  id?: number;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
  enabled: boolean;
  hits?: number;
  createdAt?: Date;
}

// ==================== ROBOTS RULES ====================

export interface SeoRobotsRule {
  id?: number;
  userAgent: string;
  directive: 'Allow' | 'Disallow' | 'Crawl-delay';
  path: string;
  enabled: boolean;
  order: number;
}

// ==================== STRUCTURED DATA (JSON-LD) ====================

export interface SchemaOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone: string;
    email: string;
    contactType: string;
  };
  address?: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

export interface SchemaProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string | string[];
  sku?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    url: string;
    priceCurrency: string;
    price: number;
    availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
    seller?: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
}

export interface SchemaBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

export interface SchemaWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

// ==================== SEO AUDIT ====================

export interface SeoAuditResult {
  score: number; // 0-100
  issues: SeoIssue[];
  passed: string[];
}

export interface SeoIssue {
  type: 'error' | 'warning' | 'info';
  category: 'meta' | 'content' | 'technical' | 'social' | 'performance';
  message: string;
  page?: string;
  recommendation: string;
}

// ==================== SITEMAP ====================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: {
    loc: string;
    title?: string;
    caption?: string;
  }[];
  alternates?: {
    hreflang: string;
    href: string;
  }[];
}
