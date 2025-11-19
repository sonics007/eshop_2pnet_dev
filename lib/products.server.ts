import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import fallbackProducts from '@/data/products.json';
import type { Product, ProductCategory, ProductTranslation } from '@/types/product';

export type DbProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    subCategory: true;
  };
}>;

function safeParse<T>(payload?: string | null, fallback: T = [] as unknown as T): T {
  if (!payload) return fallback;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return fallback;
  }
}

function mapTranslations(payload?: string | null): Record<string, ProductTranslation> | undefined {
  const parsed = safeParse<Record<string, ProductTranslation>>(payload, {});
  return Object.keys(parsed).length ? parsed : undefined;
}

export function mapDbProduct(product: DbProductWithRelations): Product {
  return {
    id: product.id,
    slug: product.slug,
  name: product.name,
  category: product.category?.name ?? 'Nezaradené',
  subCategory: product.subCategory?.name ?? undefined,
  categoryId: product.categoryId ?? undefined,
  subCategoryId: product.subCategoryId ?? undefined,
    tagline: product.tagline ?? undefined,
    price: product.price,
    currency: product.currency,
    billingPeriod: product.billingPeriod ?? undefined,
    image: product.image ?? undefined,
    gallery: safeParse<string[]>(product.gallery, product.image ? [product.image] : []),
    badge: product.badge ?? undefined,
    specs: safeParse<string[]>(product.specs, []),
    description: product.description ?? undefined,
    promotion: product.promotion ?? undefined,
    stock: product.stock ?? 0,
    discount: product.discount ?? undefined,
    active: product.active,
    translations: mapTranslations(product.translations)
  };
}

function mapFallbackProducts(): Product[] {
  return (fallbackProducts as any[]).map((product, index) => ({
    id: index + 1,
    slug: product.slug,
    name: product.name,
    category: product.category ?? 'Nezaradené',
    subCategory: product.subCategory,
    tagline: product.tagline,
    price: product.price ?? 0,
    currency: product.currency ?? 'EUR',
    billingPeriod: product.billingPeriod,
    image: product.image,
    gallery: product.image ? [product.image] : [],
    badge: product.badge,
    specs: product.specs ?? [],
    description: product.description,
    promotion: product.promotion,
    stock: 0,
    discount: 0,
    active: true,
    translations: {
      sk: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        promotion: product.promotion,
        badge: product.badge,
        specs: product.specs ?? []
      }
    }
  }));
}

export async function getProducts(limit?: number): Promise<Product[]> {
  try {
    const records = await prisma.product.findMany({
      include: { category: true, subCategory: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    if (!records.length) return mapFallbackProducts();
    return records.map(mapDbProduct);
  } catch (error) {
    console.warn('Falling back to JSON products:', error);
    return mapFallbackProducts();
  }
}

export async function getFeaturedProducts(limit = 3) {
  return getProducts(limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const record = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, subCategory: true }
    });
    if (!record) return null;
    return mapDbProduct(record);
  } catch (error) {
    console.warn('Falling back to JSON product by slug:', error);
    return mapFallbackProducts().find((product) => product.slug === slug) ?? null;
  }
}

export async function getProductSlugs(): Promise<string[]> {
  try {
    const records = await prisma.product.findMany({ select: { slug: true } });
    if (!records.length) {
      return (fallbackProducts as any[]).map((product) => product.slug);
    }
    return records.map((record) => record.slug);
  } catch (error) {
    console.warn('Falling back to JSON slugs:', error);
    return (fallbackProducts as any[]).map((product) => product.slug);
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' }
    });
    if (!categories.length) {
      const fallback = mapFallbackProducts();
      const grouped = new Map<string, Set<string>>();
      fallback.forEach((product) => {
        if (!grouped.has(product.category)) {
          grouped.set(product.category, new Set());
        }
        if (product.subCategory) {
          grouped.get(product.category)?.add(product.subCategory);
        }
      });
      return Array.from(grouped.entries()).map(([name, subs], index) => ({
        id: index + 1,
        name,
        subcategories: Array.from(subs).map((sub, subIndex) => ({ id: subIndex + 1, name: sub }))
      }));
    }
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      subcategories: category.subcategories.map((sub) => ({ id: sub.id, name: sub.name }))
    }));
  } catch (error) {
    console.warn('Falling back to JSON categories:', error);
    return mapFallbackProducts().reduce<ProductCategory[]>((acc, product, index) => {
      let entry = acc.find((item) => item.name === product.category);
      if (!entry) {
        entry = { id: index + 1, name: product.category, subcategories: [] };
        acc.push(entry);
      }
      if (product.subCategory && !entry.subcategories.some((sub) => sub.name === product.subCategory)) {
        entry.subcategories.push({ id: entry.subcategories.length + 1, name: product.subCategory });
      }
      return acc;
    }, []);
  }
}

export function serialiseTranslations(translations?: Record<string, ProductTranslation>) {
  if (!translations) return null;
  return JSON.stringify(translations);
}
