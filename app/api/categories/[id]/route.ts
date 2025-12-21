import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/categories/[id]
 * Detail kategórie
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        subcategories: { orderBy: { name: 'asc' } },
        _count: { select: { products: true } }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategória nenájdená' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        productCount: category._count.products,
        subcategories: category.subcategories,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to get category:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri načítaní kategórie' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Aktualizácia kategórie - vyžaduje admin autentifikáciu
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Názov kategórie je povinný' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
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
        subcategories: category.subcategories
      }
    });
  } catch (error: unknown) {
    console.error('Failed to update category:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Kategória s týmto názvom už existuje' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Chyba pri aktualizácii kategórie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Odstránenie kategórie - vyžaduje admin autentifikáciu
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { id } = await params;
    
    // Skontroluj či kategória nemá produkty
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { products: true } } }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategória nenájdená' },
        { status: 404 }
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { success: false, error: 'Kategória obsahuje produkty, najprv ich presuňte' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri mazaní kategórie' },
      { status: 500 }
    );
  }
}
