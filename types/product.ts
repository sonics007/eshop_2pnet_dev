export type ProductTranslation = {
  name?: string;
  tagline?: string;
  description?: string;
  promotion?: string;
  badge?: string;
  specs?: string[];
  price?: number;
  currency?: string;
};

// Mapovanie jazyka na menu
export const LANGUAGE_CURRENCY_MAP: Record<string, { currency: string; locale: string }> = {
  sk: { currency: 'EUR', locale: 'sk-SK' },
  cz: { currency: 'CZK', locale: 'cs-CZ' }
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  categoryId?: number;
  subCategoryId?: number;
  tagline?: string;
  price: number;
  vatRate: number;
  currency: string;
  billingPeriod?: string;
  image?: string;
  gallery?: string[];
  badge?: string;
  specs: string[];
  description?: string;
  promotion?: string;
  stock?: number;
  discount?: number;
  active: boolean;
  translations?: Record<string, ProductTranslation>;
};

export type ProductCategory = {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
};
