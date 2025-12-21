import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/categories/[id]/subcategories
 * Zoznam podkategórií pre danú kategóriu
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subcategories = await prisma.subCategory.findMany({
      where: { categoryId: Number(id) },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        categoryId: sub.categoryId,
        productCount: sub._count.products
      }))
    });
  } catch (error) {
    console.error('Failed to get subcategories:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri načítaní podkategórií' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories/[id]/subcategories
 * Vytvorenie novej podkategórie
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Názov podkategórie je povinný' },
        { status: 400 }
      );
    }

    // Skontroluj či kategória existuje
    const category = await prisma.category.findUnique({
      where: { id: Number(id) }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategória nenájdená' },
        { status: 404 }
      );
    }

    const subcategory = await prisma.subCategory.create({
      data: {
        name: name.trim(),
        categoryId: Number(id)
      },
      include: {
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: subcategory.id,
        name: subcategory.name,
        categoryId: subcategory.categoryId,
        productCount: subcategory._count.products
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri vytváraní podkategórie' },
      { status: 500 }
    );
  }
}
