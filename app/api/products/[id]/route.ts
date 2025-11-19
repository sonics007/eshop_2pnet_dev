import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapDbProduct } from '@/lib/products.server';
import type { ProductTranslation } from '@/types/product';

const stringOrNull = (value?: string | null) => (value && value.trim().length ? value : null);
const serialiseList = (value?: string[]) => JSON.stringify(value ?? []);
const serialiseTranslations = (value?: Record<string, ProductTranslation>) =>
  value ? JSON.stringify(value) : null;

function buildWhereParam(id: string) {
  if (!Number.isNaN(Number(id))) {
    return { id: Number(id) };
  }
  return { slug: id };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const record = await prisma.product.findFirst({
      where: buildWhereParam(params.id),
      include: { category: true, subCategory: true }
    });
    if (!record) {
      return NextResponse.json({ success: false, message: 'Produkt neexistuje.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product: mapDbProduct(record) });
  } catch (error) {
    console.error('Produkt sa nepodarilo načítať', error);
    return NextResponse.json({ success: false, message: 'Chyba servera.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  try {
    const record = await prisma.product.update({
      where: buildWhereParam(params.id),
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
        category: payload.categoryId ? { connect: { id: payload.categoryId } } : undefined,
        subCategory: payload.subCategoryId
          ? { connect: { id: payload.subCategoryId } }
          : { disconnect: true }
      },
      include: { category: true, subCategory: true }
    });
    return NextResponse.json({ success: true, product: mapDbProduct(record) });
  } catch (error) {
    console.error('Produkt sa nepodarilo aktualizovať', error);
    return NextResponse.json(
      { success: false, message: 'Aktualizácia produktu zlyhala.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: buildWhereParam(params.id)
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Produkt sa nepodarilo odstrániť', error);
    return NextResponse.json(
      { success: false, message: 'Odstránenie produktu zlyhalo.' },
      { status: 500 }
    );
  }
}
