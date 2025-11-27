/**
 * PRODUCTS MODULE - Types
 *
 * Typy pre produktový katalóg
 */

export interface Product {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  price: number;
  currency: string;
  discount?: number;
  stock: number;
  badge?: string;
  promotion?: string;
  image?: string;
  gallery?: string[];
  specs?: Record<string, string>;
  translations?: Record<string, ProductTranslation>;
  categoryId?: number;
  subCategoryId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductTranslation {
  name?: string;
  tagline?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  subcategories?: SubCategory[];
  products?: Product[];
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  products?: Product[];
}

export interface ProductFilter {
  categoryId?: number;
  subCategoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProductData {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  price: number;
  currency?: string;
  discount?: number;
  stock?: number;
  badge?: string;
  promotion?: string;
  image?: string;
  gallery?: string[];
  specs?: Record<string, string>;
  translations?: Record<string, ProductTranslation>;
  categoryId?: number;
  subCategoryId?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number;
}
