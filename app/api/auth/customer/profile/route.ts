import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuthResult, CustomerUser } from '@/lib/modules/auth/types';

const stringOrNull = (value?: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const id = Number(payload?.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Chýba platné ID používateľa'
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.role !== 'user') {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Používateľ neexistuje alebo nie je zákazník'
      }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof payload.companyName === 'string' && payload.companyName.trim()) {
      updateData.companyName = payload.companyName.trim();
    }
    if (payload.ico !== undefined) {
      updateData.ico = stringOrNull(payload.ico);
    }
    if (payload.dic !== undefined) {
      updateData.dic = stringOrNull(payload.dic);
    }
    if (payload.vatId !== undefined) {
      updateData.vatId = stringOrNull(payload.vatId);
    }
    if (payload.phone !== undefined) {
      updateData.phone = stringOrNull(payload.phone);
    }
    if (payload.street !== undefined) {
      updateData.street = stringOrNull(payload.street);
    }
    if (payload.city !== undefined) {
      updateData.city = stringOrNull(payload.city);
    }
    if (payload.zip !== undefined) {
      updateData.zip = stringOrNull(payload.zip);
    }
    if (payload.country !== undefined) {
      updateData.country = stringOrNull(payload.country);
    }

    const updated = Object.keys(updateData).length
      ? await prisma.user.update({ where: { id }, data: updateData })
      : user;

    const customerUser: CustomerUser = {
      id: updated.id,
      email: updated.email,
      role: 'customer',
      companyName: updated.companyName,
      ico: updated.ico || undefined,
      dic: updated.dic || undefined,
      vatId: updated.vatId || undefined,
      phone: updated.phone || undefined,
      street: updated.street || undefined,
      city: updated.city || undefined,
      zip: updated.zip || undefined,
      country: updated.country || undefined
    };

    return NextResponse.json<AuthResult>({
      success: true,
      user: customerUser
    });
  } catch (error) {
    console.error('Customer profile update failed:', error);
    return NextResponse.json<AuthResult>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
