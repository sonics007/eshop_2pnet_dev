import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getProducts, mapDbProduct } from '@/lib/products.server';
import type { ProductTranslation } from '@/types/product';

type ProductPayload = {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  price: number;
  currency: string;
  badge?: string;
  billingPeriod?: string;
  stock?: number;
  discount?: number;
  promotion?: string;
  image?: string;
  gallery?: string[];
  specs?: string[];
  active?: boolean;
  categoryId?: number;
  subCategoryId?: number;
  translations?: Record<string, ProductTranslation>;
};

const stringOrNull = (value?: string | null) => (value && value.trim().length ? value : null);
const serialiseList = (value?: string[]) => JSON.stringify(value ?? []);
const serialiseTranslations = (value?: Record<string, ProductTranslation>) =>
  value ? JSON.stringify(value) : null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const query = searchParams.get('q');
  const limit = searchParams.get('limit');

  const where: Prisma.ProductWhereInput = {};
  if (category) {
    where.category = { name: category };
  }
  if (query) {
    // SQLite doesn't support 'mode: insensitive', using contains only
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { tagline: { contains: query } }
    ];
  }

  try {
    const records = await prisma.product.findMany({
      where,
      include: { category: true, subCategory: true },
      orderBy: { updatedAt: 'desc' },
      take: limit ? Number(limit) : undefined
    });
    if (!records.length) {
      const fallback = await getProducts(limit ? Number(limit) : undefined);
      return NextResponse.json({ data: fallback });
    }
    return NextResponse.json({ data: records.map(mapDbProduct) });
  } catch (error) {
    console.error('Unable to read products from DB, falling back to JSON', error);
    const fallback = await getProducts(limit ? Number(limit) : undefined);
    return NextResponse.json({ data: fallback });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ProductPayload;

  if (!payload.slug || !payload.name || typeof payload.price !== 'number') {
    return NextResponse.json({ success: false, message: 'Chýbajú povinné polia.' }, { status: 400 });
  }
  if (!payload.categoryId) {
    return NextResponse.json(
      { success: false, message: 'Zvoľte kategóriu produktu.' },
      { status: 400 }
    );
  }

  try {
    const record = await prisma.product.create({
      data: {
        slug: payload.slug,
        name: payload.name,
        tagline: stringOrNull(payload.tagline),
        description: stringOrNull(payload.description),
        price: payload.price,
        currency: payload.currency || 'EUR',
        badge: stringOrNull(payload.badge),
        billingPeriod: stringOrNull(payload.billingPeriod),
        stock: payload.stock ?? 0,
        discount: payload.discount ?? 0,
        promotion: stringOrNull(payload.promotion),
        image: stringOrNull(payload.image),
        gallery: serialiseList(payload.gallery),
        specs: serialiseList(payload.specs),
        active: payload.active ?? true,
        translations: serialiseTranslations(payload.translations),
        category: {
          connect: { id: payload.categoryId }
        },
        subCategory: payload.subCategoryId
          ? { connect: { id: payload.subCategoryId } }
          : undefined
      },
      include: { category: true, subCategory: true }
    });
    return NextResponse.json({ success: true, product: mapDbProduct(record) }, { status: 201 });
  } catch (error) {
    console.error('Unable to create product', error);
    return NextResponse.json(
      { success: false, message: 'Produkt sa nepodarilo uložiť.' },
      { status: 500 }
    );
  }
}
