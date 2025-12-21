import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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
    vatRate: product.vatRate ?? 20,
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

export async function getProducts(limit?: number): Promise<Product[]> {
  try {
    const records = await prisma.product.findMany({
      include: { category: true, subCategory: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    // Vráť produkty z DB (aj keď je prázdna)
    return records.map(mapDbProduct);
  } catch (error) {
    console.error('Failed to fetch products from DB:', error);
    return [];
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
    console.error('Failed to fetch product by slug:', error);
    return null;
  }
}

export async function getProductSlugs(): Promise<string[]> {
  try {
    const records = await prisma.product.findMany({ select: { slug: true } });
    return records.map((record) => record.slug);
  } catch (error) {
    console.error('Failed to fetch product slugs:', error);
    return [];
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' }
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      subcategories: category.subcategories.map((sub) => ({ id: sub.id, name: sub.name }))
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export function serialiseTranslations(translations?: Record<string, ProductTranslation>) {
  if (!translations) return null;
  return JSON.stringify(translations);
}
