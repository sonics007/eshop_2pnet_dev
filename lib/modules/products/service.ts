/**
 * PRODUCTS MODULE - Service Layer
 *
 * Biznis logika pre produktový katalóg.
 * Server-only - nepoužívať na klientovi.
 */

import { prisma } from '@/lib/prisma';
import type {
  Product,
  Category,
  SubCategory,
  ProductFilter,
  ProductListResult,
  CreateProductData,
  UpdateProductData
} from './types';

// ===============================
// PRODUCTS
// ===============================

function mapProduct(p: {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  currency: string;
  discount: number | null;
  stock: number;
  badge: string | null;
  promotion: string | null;
  image: string | null;
  gallery: string | null;
  specs: string | null;
  translations: string | null;
  categoryId: number | null;
  subCategoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline || undefined,
    description: p.description || undefined,
    price: p.price,
    currency: p.currency,
    discount: p.discount || undefined,
    stock: p.stock,
    badge: p.badge || undefined,
    promotion: p.promotion || undefined,
    image: p.image || undefined,
    gallery: p.gallery ? JSON.parse(p.gallery) : undefined,
    specs: p.specs ? JSON.parse(p.specs) : undefined,
    translations: p.translations ? JSON.parse(p.translations) : undefined,
    categoryId: p.categoryId || undefined,
    subCategoryId: p.subCategoryId || undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

export async function getProducts(
  filter: ProductFilter = {},
  page = 1,
  pageSize = 20
): Promise<ProductListResult> {
  const where: Record<string, unknown> = {};

  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }

  if (filter.subCategoryId) {
    where.subCategoryId = filter.subCategoryId;
  }

  if (filter.inStock) {
    where.stock = { gt: 0 };
  }

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.price = {};
    if (filter.minPrice !== undefined) {
      (where.price as Record<string, number>).gte = filter.minPrice;
    }
    if (filter.maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = filter.maxPrice;
    }
  }

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search } },
      { description: { contains: filter.search } }
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  return {
    products: products.map(mapProduct),
    total,
    page,
    pageSize
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  return product ? mapProduct(product) : null;
}

export async function getProductById(id: number): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id }
  });

  return product ? mapProduct(product) : null;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const product = await prisma.product.create({
    data: {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline || null,
      description: data.description || null,
      price: data.price,
      currency: data.currency || 'EUR',
      discount: data.discount || null,
      stock: data.stock || 0,
      badge: data.badge || null,
      promotion: data.promotion || null,
      image: data.image || null,
      gallery: data.gallery ? JSON.stringify(data.gallery) : null,
      specs: data.specs ? JSON.stringify(data.specs) : null,
      translations: data.translations ? JSON.stringify(data.translations) : null,
      categoryId: data.categoryId || null,
      subCategoryId: data.subCategoryId || null
    }
  });

  return mapProduct(product);
}

export async function updateProduct(data: UpdateProductData): Promise<Product | null> {
  const updateData: Record<string, unknown> = {};

  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.tagline !== undefined) updateData.tagline = data.tagline || null;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.discount !== undefined) updateData.discount = data.discount || null;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.badge !== undefined) updateData.badge = data.badge || null;
  if (data.promotion !== undefined) updateData.promotion = data.promotion || null;
  if (data.image !== undefined) updateData.image = data.image || null;
  if (data.gallery !== undefined) updateData.gallery = data.gallery ? JSON.stringify(data.gallery) : null;
  if (data.specs !== undefined) updateData.specs = data.specs ? JSON.stringify(data.specs) : null;
  if (data.translations !== undefined) updateData.translations = data.translations ? JSON.stringify(data.translations) : null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
  if (data.subCategoryId !== undefined) updateData.subCategoryId = data.subCategoryId || null;

  try {
    const product = await prisma.product.update({
      where: { id: data.id },
      data: updateData
    });

    return mapProduct(product);
  } catch {
    return null;
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: { id }
    });
    return true;
  } catch {
    return false;
  }
}

// ===============================
// CATEGORIES
// ===============================

export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: true
    },
    orderBy: { name: 'asc' }
  });

  return categories.map(c => ({
    id: c.id,
    name: c.name,
    subcategories: c.subcategories.map(s => ({
      id: s.id,
      name: s.name,
      categoryId: s.categoryId
    }))
  }));
}

export async function createCategory(name: string): Promise<Category> {
  const category = await prisma.category.create({
    data: { name }
  });

  return {
    id: category.id,
    name: category.name,
    subcategories: []
  };
}

export async function createSubCategory(name: string, categoryId: number): Promise<SubCategory> {
  const subcategory = await prisma.subCategory.create({
    data: { name, categoryId }
  });

  return {
    id: subcategory.id,
    name: subcategory.name,
    categoryId: subcategory.categoryId
  };
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    // Najprv zmaž podkategórie
    await prisma.subCategory.deleteMany({
      where: { categoryId: id }
    });

    await prisma.category.delete({
      where: { id }
    });

    return true;
  } catch {
    return false;
  }
}
