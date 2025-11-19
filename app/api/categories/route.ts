import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProductCategories } from '@/lib/products.server';

export async function GET() {
  const categories = await getProductCategories();
  return NextResponse.json({ data: categories });
}

type CategoryPayload = {
  name: string;
  categoryId?: number;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as CategoryPayload;
  if (!payload.name || !payload.name.trim()) {
    return NextResponse.json({ success: false, message: 'Zadajte názov.' }, { status: 400 });
  }

  try {
    if (payload.categoryId) {
      await prisma.subCategory.create({
        data: {
          name: payload.name.trim(),
          category: { connect: { id: payload.categoryId } }
        }
      });
    } else {
      await prisma.category.create({
        data: { name: payload.name.trim() }
      });
    }
    const categories = await getProductCategories();
    return NextResponse.json({ success: true, data: categories }, { status: 201 });
  } catch (error) {
    console.error('Nepodarilo sa vytvoriť kategóriu', error);
    return NextResponse.json(
      { success: false, message: 'Uloženie zlyhalo, skontrolujte duplicitné názvy.' },
      { status: 500 }
    );
  }
}
