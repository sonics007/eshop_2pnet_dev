/**
 * SEO MODULE - Service
 *
 * Služba pre správu SEO nastavení eshopu
 */

import { prisma } from '@/lib/prisma';
import {
  SeoGlobalSettings,
  SeoPageData,
  SeoRedirect,
  SeoRobotsRule,
  SeoAuditResult,
  SeoIssue,
  SitemapUrl,
  SchemaOrganization,
  SchemaProduct,
  SchemaBreadcrumbList,
  SchemaWebSite,
  defaultSeoGlobalSettings
} from './types';

const CONFIG_KEY = 'seo-global-settings';

// ==================== GLOBAL SETTINGS ====================

export async function readSeoGlobalSettings(): Promise<SeoGlobalSettings> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY }
    });

    if (!config) {
      return defaultSeoGlobalSettings;
    }

    const parsed = JSON.parse(config.value) as Partial<SeoGlobalSettings>;
    return {
      ...defaultSeoGlobalSettings,
      ...parsed
    };
  } catch (error) {
    console.error('Error reading SEO global settings:', error);
    return defaultSeoGlobalSettings;
  }
}

export async function writeSeoGlobalSettings(
  settings: Partial<SeoGlobalSettings>
): Promise<SeoGlobalSettings> {
  try {
    const current = await readSeoGlobalSettings();
    const updated: SeoGlobalSettings = {
      ...current,
      ...settings
    };

    await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: CONFIG_KEY, value: JSON.stringify(updated) }
    });

    return updated;
  } catch (error) {
    console.error('Error writing SEO global settings:', error);
    throw error;
  }
}

// ==================== PAGE SEO ====================

export async function getSeoPage(path: string): Promise<SeoPageData | null> {
  try {
    const page = await prisma.seoPage.findUnique({
      where: { path }
    });

    if (!page) return null;

    return {
      id: page.id,
      path: page.path,
      pageType: page.pageType as SeoPageData['pageType'],
      metaTitle: page.metaTitle || undefined,
      metaDescription: page.metaDescription || undefined,
      metaKeywords: page.metaKeywords || undefined,
      canonicalUrl: page.canonicalUrl || undefined,
      ogTitle: page.ogTitle || undefined,
      ogDescription: page.ogDescription || undefined,
      ogImage: page.ogImage || undefined,
      ogType: page.ogType as SeoPageData['ogType'],
      twitterCard: page.twitterCard as SeoPageData['twitterCard'],
      twitterTitle: page.twitterTitle || undefined,
      twitterDescription: page.twitterDescription || undefined,
      twitterImage: page.twitterImage || undefined,
      noIndex: page.noIndex,
      noFollow: page.noFollow,
      structuredData: page.structuredData ? JSON.parse(page.structuredData) : undefined
    };
  } catch (error) {
    console.error('Error getting SEO page:', error);
    return null;
  }
}

export async function getAllSeoPages(): Promise<SeoPageData[]> {
  try {
    const pages = await prisma.seoPage.findMany({
      orderBy: { path: 'asc' }
    });

    return pages.map(page => ({
      id: page.id,
      path: page.path,
      pageType: page.pageType as SeoPageData['pageType'],
      metaTitle: page.metaTitle || undefined,
      metaDescription: page.metaDescription || undefined,
      metaKeywords: page.metaKeywords || undefined,
      canonicalUrl: page.canonicalUrl || undefined,
      ogTitle: page.ogTitle || undefined,
      ogDescription: page.ogDescription || undefined,
      ogImage: page.ogImage || undefined,
      ogType: page.ogType as SeoPageData['ogType'],
      twitterCard: page.twitterCard as SeoPageData['twitterCard'],
      twitterTitle: page.twitterTitle || undefined,
      twitterDescription: page.twitterDescription || undefined,
      twitterImage: page.twitterImage || undefined,
      noIndex: page.noIndex,
      noFollow: page.noFollow,
      structuredData: page.structuredData ? JSON.parse(page.structuredData) : undefined
    }));
  } catch (error) {
    console.error('Error getting all SEO pages:', error);
    return [];
  }
}

export async function upsertSeoPage(data: SeoPageData): Promise<SeoPageData> {
  try {
    const page = await prisma.seoPage.upsert({
      where: { path: data.path },
      update: {
        pageType: data.pageType,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        canonicalUrl: data.canonicalUrl,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,
        ogType: data.ogType,
        twitterCard: data.twitterCard,
        twitterTitle: data.twitterTitle,
        twitterDescription: data.twitterDescription,
        twitterImage: data.twitterImage,
        noIndex: data.noIndex ?? false,
        noFollow: data.noFollow ?? false,
        structuredData: data.structuredData ? JSON.stringify(data.structuredData) : null
      },
      create: {
        path: data.path,
        pageType: data.pageType,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        canonicalUrl: data.canonicalUrl,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,
        ogType: data.ogType,
        twitterCard: data.twitterCard,
        twitterTitle: data.twitterTitle,
        twitterDescription: data.twitterDescription,
        twitterImage: data.twitterImage,
        noIndex: data.noIndex ?? false,
        noFollow: data.noFollow ?? false,
        structuredData: data.structuredData ? JSON.stringify(data.structuredData) : null
      }
    });

    return {
      id: page.id,
      path: page.path,
      pageType: page.pageType as SeoPageData['pageType'],
      metaTitle: page.metaTitle || undefined,
      metaDescription: page.metaDescription || undefined,
      noIndex: page.noIndex,
      noFollow: page.noFollow
    };
  } catch (error) {
    console.error('Error upserting SEO page:', error);
    throw error;
  }
}

export async function deleteSeoPage(path: string): Promise<void> {
  try {
    await prisma.seoPage.delete({
      where: { path }
    });
  } catch (error) {
    console.error('Error deleting SEO page:', error);
    throw error;
  }
}

// ==================== REDIRECTS ====================

export async function getAllRedirects(): Promise<SeoRedirect[]> {
  try {
    const redirects = await prisma.seoRedirect.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return redirects.map(r => ({
      id: r.id,
      fromPath: r.fromPath,
      toPath: r.toPath,
      statusCode: r.statusCode as 301 | 302,
      enabled: r.enabled,
      hits: r.hits,
      createdAt: r.createdAt
    }));
  } catch (error) {
    console.error('Error getting redirects:', error);
    return [];
  }
}

export async function getRedirect(fromPath: string): Promise<SeoRedirect | null> {
  try {
    const redirect = await prisma.seoRedirect.findUnique({
      where: { fromPath }
    });

    if (!redirect || !redirect.enabled) return null;

    // Increment hits
    await prisma.seoRedirect.update({
      where: { id: redirect.id },
      data: { hits: redirect.hits + 1 }
    });

    return {
      id: redirect.id,
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode as 301 | 302,
      enabled: redirect.enabled,
      hits: redirect.hits + 1
    };
  } catch (error) {
    console.error('Error getting redirect:', error);
    return null;
  }
}

export async function createRedirect(data: Omit<SeoRedirect, 'id' | 'hits' | 'createdAt'>): Promise<SeoRedirect> {
  try {
    const redirect = await prisma.seoRedirect.create({
      data: {
        fromPath: data.fromPath,
        toPath: data.toPath,
        statusCode: data.statusCode,
        enabled: data.enabled
      }
    });

    return {
      id: redirect.id,
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode as 301 | 302,
      enabled: redirect.enabled,
      hits: redirect.hits
    };
  } catch (error) {
    console.error('Error creating redirect:', error);
    throw error;
  }
}

export async function updateRedirect(
  id: number,
  data: Partial<Omit<SeoRedirect, 'id' | 'hits' | 'createdAt'>>
): Promise<SeoRedirect> {
  try {
    const redirect = await prisma.seoRedirect.update({
      where: { id },
      data
    });

    return {
      id: redirect.id,
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode as 301 | 302,
      enabled: redirect.enabled,
      hits: redirect.hits
    };
  } catch (error) {
    console.error('Error updating redirect:', error);
    throw error;
  }
}

export async function deleteRedirect(id: number): Promise<void> {
  try {
    await prisma.seoRedirect.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting redirect:', error);
    throw error;
  }
}

// ==================== ROBOTS RULES ====================

export async function getAllRobotsRules(): Promise<SeoRobotsRule[]> {
  try {
    const rules = await prisma.seoRobotsRule.findMany({
      orderBy: { order: 'asc' }
    });

    return rules.map(r => ({
      id: r.id,
      userAgent: r.userAgent,
      directive: r.directive as SeoRobotsRule['directive'],
      path: r.path,
      enabled: r.enabled,
      order: r.order
    }));
  } catch (error) {
    console.error('Error getting robots rules:', error);
    return [];
  }
}

export async function createRobotsRule(
  data: Omit<SeoRobotsRule, 'id'>
): Promise<SeoRobotsRule> {
  try {
    const rule = await prisma.seoRobotsRule.create({
      data: {
        userAgent: data.userAgent,
        directive: data.directive,
        path: data.path,
        enabled: data.enabled,
        order: data.order
      }
    });

    return {
      id: rule.id,
      userAgent: rule.userAgent,
      directive: rule.directive as SeoRobotsRule['directive'],
      path: rule.path,
      enabled: rule.enabled,
      order: rule.order
    };
  } catch (error) {
    console.error('Error creating robots rule:', error);
    throw error;
  }
}

export async function updateRobotsRule(
  id: number,
  data: Partial<Omit<SeoRobotsRule, 'id'>>
): Promise<SeoRobotsRule> {
  try {
    const rule = await prisma.seoRobotsRule.update({
      where: { id },
      data
    });

    return {
      id: rule.id,
      userAgent: rule.userAgent,
      directive: rule.directive as SeoRobotsRule['directive'],
      path: rule.path,
      enabled: rule.enabled,
      order: rule.order
    };
  } catch (error) {
    console.error('Error updating robots rule:', error);
    throw error;
  }
}

export async function deleteRobotsRule(id: number): Promise<void> {
  try {
    await prisma.seoRobotsRule.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting robots rule:', error);
    throw error;
  }
}

export async function generateRobotsTxt(): Promise<string> {
  const globalSettings = await readSeoGlobalSettings();
  const rules = await getAllRobotsRules();

  if (!globalSettings.robotsEnabled) {
    return 'User-agent: *\nDisallow: /';
  }

  if (globalSettings.robotsContent) {
    return globalSettings.robotsContent;
  }

  // Generate from rules
  const enabledRules = rules.filter(r => r.enabled);
  const groupedByAgent = new Map<string, SeoRobotsRule[]>();

  for (const rule of enabledRules) {
    const existing = groupedByAgent.get(rule.userAgent) || [];
    existing.push(rule);
    groupedByAgent.set(rule.userAgent, existing);
  }

  let content = '';
  Array.from(groupedByAgent.entries()).forEach(([agent, agentRules]) => {
    content += `User-agent: ${agent}\n`;
    for (const rule of agentRules) {
      content += `${rule.directive}: ${rule.path}\n`;
    }
    content += '\n';
  });

  // Add sitemap reference
  if (globalSettings.sitemapEnabled && globalSettings.siteUrl) {
    content += `Sitemap: ${globalSettings.siteUrl}/sitemap.xml\n`;
  }

  return content || 'User-agent: *\nAllow: /';
}

// ==================== SITEMAP ====================

export async function generateSitemapUrls(): Promise<SitemapUrl[]> {
  const globalSettings = await readSeoGlobalSettings();
  const urls: SitemapUrl[] = [];

  if (!globalSettings.sitemapEnabled || !globalSettings.siteUrl) {
    return urls;
  }

  const baseUrl = globalSettings.siteUrl.replace(/\/$/, '');

  // Homepage
  urls.push({
    loc: baseUrl,
    changefreq: 'daily',
    priority: 1.0
  });

  // Get all products
  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      slug: true,
      updatedAt: true,
      image: true,
      name: true
    }
  });

  for (const product of products) {
    const url: SitemapUrl = {
      loc: `${baseUrl}/produkty/${product.slug}`,
      lastmod: product.updatedAt.toISOString().split('T')[0],
      changefreq: globalSettings.sitemapChangefreq,
      priority: 0.8
    };

    if (product.image) {
      url.images = [{
        loc: product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`,
        title: product.name
      }];
    }

    urls.push(url);
  }

  // Get all categories
  const categories = await prisma.category.findMany({
    select: { name: true, updatedAt: true }
  });

  for (const category of categories) {
    urls.push({
      loc: `${baseUrl}/kategoria/${encodeURIComponent(category.name.toLowerCase())}`,
      lastmod: category.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.6
    });
  }

  // Get SEO pages (custom pages)
  const seoPages = await prisma.seoPage.findMany({
    where: {
      noIndex: false
    },
    select: {
      path: true,
      updatedAt: true
    }
  });

  for (const page of seoPages) {
    // Skip if already in sitemap
    if (urls.some(u => u.loc.endsWith(page.path))) continue;

    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: page.updatedAt.toISOString().split('T')[0],
      changefreq: globalSettings.sitemapChangefreq,
      priority: globalSettings.sitemapPriority
    });
  }

  return urls;
}

export async function generateSitemapXml(): Promise<string> {
  const urls = await generateSitemapUrls();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;

    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }

    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }

    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }

    if (url.images) {
      for (const image of url.images) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;
        if (image.title) {
          xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
        }
        xml += '    </image:image>\n';
      }
    }

    if (url.alternates) {
      for (const alt of url.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      }
    }

    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== STRUCTURED DATA (JSON-LD) ====================

export async function generateOrganizationSchema(): Promise<SchemaOrganization> {
  const settings = await readSeoGlobalSettings();

  const schema: SchemaOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.organizationName || settings.siteName,
    url: settings.siteUrl,
    logo: settings.organizationLogo || settings.defaultImage
  };

  if (settings.organizationPhone || settings.organizationEmail) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      telephone: settings.organizationPhone || '',
      email: settings.organizationEmail || '',
      contactType: 'customer service'
    };
  }

  if (settings.organizationAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: settings.organizationAddress.street,
      addressLocality: settings.organizationAddress.city,
      postalCode: settings.organizationAddress.postalCode,
      addressCountry: settings.organizationAddress.country
    };
  }

  const sameAs: string[] = [];
  if (settings.facebookUrl) sameAs.push(settings.facebookUrl);
  if (settings.instagramUrl) sameAs.push(settings.instagramUrl);
  if (settings.linkedinUrl) sameAs.push(settings.linkedinUrl);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

export async function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  slug: string;
  stock: number;
  sku?: string;
}): Promise<SchemaProduct> {
  const settings = await readSeoGlobalSettings();
  const baseUrl = settings.siteUrl.replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.image || settings.defaultImage,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/produkty/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: settings.organizationName || settings.siteName
      }
    }
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): SchemaBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export async function generateWebsiteSchema(): Promise<SchemaWebSite> {
  const settings = await readSeoGlobalSettings();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.siteName,
    url: settings.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${settings.siteUrl}/vyhladavanie?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

// ==================== SEO AUDIT ====================

export async function runSeoAudit(): Promise<SeoAuditResult> {
  const issues: SeoIssue[] = [];
  const passed: string[] = [];

  const globalSettings = await readSeoGlobalSettings();
  const pages = await getAllSeoPages();

  // Check global settings
  if (!globalSettings.siteUrl) {
    issues.push({
      type: 'error',
      category: 'technical',
      message: 'Chýba URL stránky',
      recommendation: 'Nastavte URL stránky v globálnych nastaveniach SEO'
    });
  } else {
    passed.push('URL stránky je nastavená');
  }

  if (!globalSettings.defaultDescription) {
    issues.push({
      type: 'warning',
      category: 'meta',
      message: 'Chýba predvolený meta description',
      recommendation: 'Pridajte predvolený meta popis pre stránky bez vlastného popisu'
    });
  } else if (globalSettings.defaultDescription.length < 120) {
    issues.push({
      type: 'info',
      category: 'meta',
      message: 'Predvolený meta description je krátky',
      recommendation: 'Odporúčaná dĺžka meta description je 150-160 znakov'
    });
  } else {
    passed.push('Predvolený meta description je nastavený');
  }

  if (!globalSettings.organizationLogo) {
    issues.push({
      type: 'warning',
      category: 'social',
      message: 'Chýba logo organizácie',
      recommendation: 'Nahrajte logo pre lepšie zobrazenie v Schema.org a sociálnych sieťach'
    });
  } else {
    passed.push('Logo organizácie je nastavené');
  }

  if (!globalSettings.googleSiteVerification) {
    issues.push({
      type: 'info',
      category: 'technical',
      message: 'Google Search Console nie je overený',
      recommendation: 'Pridajte verifikačný kód pre Google Search Console'
    });
  } else {
    passed.push('Google Search Console je overený');
  }

  // Check products
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, description: true, image: true }
  });

  const productsWithoutDescription = products.filter(p => !p.description);
  if (productsWithoutDescription.length > 0) {
    issues.push({
      type: 'warning',
      category: 'content',
      message: `${productsWithoutDescription.length} produktov bez popisu`,
      recommendation: 'Pridajte popis ku všetkým produktom pre lepšie SEO'
    });
  } else {
    passed.push('Všetky produkty majú popis');
  }

  const productsWithoutImage = products.filter(p => !p.image);
  if (productsWithoutImage.length > 0) {
    issues.push({
      type: 'warning',
      category: 'content',
      message: `${productsWithoutImage.length} produktov bez obrázka`,
      recommendation: 'Pridajte obrázky ku všetkým produktom'
    });
  } else {
    passed.push('Všetky produkty majú obrázok');
  }

  // Calculate score
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  let score = 100;
  score -= errorCount * 15;
  score -= warningCount * 5;
  score -= infoCount * 2;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    passed
  };
}

// ==================== META TAGS HELPER ====================

export async function getPageMetaTags(path: string): Promise<{
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  openGraph: {
    title: string;
    description: string;
    image?: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image?: string;
  };
  robots: string;
}> {
  const globalSettings = await readSeoGlobalSettings();
  const pageSettings = await getSeoPage(path);

  const title = pageSettings?.metaTitle || globalSettings.defaultTitle;
  const description = pageSettings?.metaDescription || globalSettings.defaultDescription;
  const image = pageSettings?.ogImage || globalSettings.defaultImage;

  const robotsDirectives: string[] = [];
  if (pageSettings?.noIndex) robotsDirectives.push('noindex');
  if (pageSettings?.noFollow) robotsDirectives.push('nofollow');
  const robots = robotsDirectives.length > 0 ? robotsDirectives.join(', ') : 'index, follow';

  return {
    title: globalSettings.titleTemplate.replace('%s', title),
    description,
    keywords: pageSettings?.metaKeywords || globalSettings.defaultKeywords,
    canonical: pageSettings?.canonicalUrl || `${globalSettings.siteUrl}${path}`,
    openGraph: {
      title: pageSettings?.ogTitle || title,
      description: pageSettings?.ogDescription || description,
      image: image || undefined,
      type: pageSettings?.ogType || 'website'
    },
    twitter: {
      card: pageSettings?.twitterCard || 'summary_large_image',
      title: pageSettings?.twitterTitle || title,
      description: pageSettings?.twitterDescription || description,
      image: pageSettings?.twitterImage || image || undefined
    },
    robots
  };
}
