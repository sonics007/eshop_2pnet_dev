import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/subcategories/[id]
 * Aktualizácia podkategórie - vyžaduje admin autentifikáciu
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { id } = await params;
    const { name, categoryId } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Názov podkategórie je povinný' },
        { status: 400 }
      );
    }

    const data: { name: string; categoryId?: number } = { name: name.trim() };
    if (categoryId) {
      data.categoryId = Number(categoryId);
    }

    const subcategory = await prisma.subCategory.update({
      where: { id: Number(id) },
      data,
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
    });
  } catch (error) {
    console.error('Failed to update subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri aktualizácii podkategórie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subcategories/[id]
 * Odstránenie podkategórie - vyžaduje admin autentifikáciu
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { id } = await params;

    // Skontroluj či podkategória nemá produkty
    const subcategory = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { products: true } } }
    });

    if (!subcategory) {
      return NextResponse.json(
        { success: false, error: 'Podkategória nenájdená' },
        { status: 404 }
      );
    }

    if (subcategory._count.products > 0) {
      return NextResponse.json(
        { success: false, error: 'Podkategória obsahuje produkty, najprv ich presuňte' },
        { status: 400 }
      );
    }

    await prisma.subCategory.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri mazaní podkategórie' },
      { status: 500 }
    );
  }
}
