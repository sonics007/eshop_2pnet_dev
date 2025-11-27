import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/admin/list
 * Zoznam administrátorov (len pre prihlásených adminov)
 */
export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        companyName: true,
        role: true
      }
    });

    return NextResponse.json({
      admins: admins.map(a => ({
        id: a.id,
        email: a.email,
        name: a.companyName || 'Admin',
        role: a.role
      }))
    });
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json({ admins: [] }, { status: 500 });
  }
}
