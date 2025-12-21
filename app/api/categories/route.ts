import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

/**
 * GET /api/categories
 * Zoznam všetkých kategórií s podkategóriami (verejné)
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products,
        subcategories: cat.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId
        })),
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Failed to get categories:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri načítaní kategórií' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Vytvorenie novej kategórie - vyžaduje admin autentifikáciu
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Názov kategórie je povinný' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
      include: {
        subcategories: true,
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        productCount: category._count.products,
        subcategories: [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create category:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Kategória s týmto názvom už existuje' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Chyba pri vytváraní kategórie' },
      { status: 500 }
    );
  }
}
