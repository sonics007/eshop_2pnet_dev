import { NextResponse } from 'next/server';
import { verifyAdminAccess, refreshAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import type { AdminUser } from '@/lib/modules/auth/types';

/**
 * GET /api/auth/admin/session
 * Overí aktuálnu admin session a vráti user data
 */
export async function GET() {
  try {
    // Skús overiť access token
    let payload = await verifyAdminAccess();

    // Ak access token expiroval, skús refresh
    if (!payload) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        payload = await verifyAdminAccess();
      }
    }

    if (!payload) {
      return NextResponse.json({
        success: false,
        authenticated: false
      }, { status: 401 });
    }

    // Načítaj aktuálne user data z DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'Používateľ neexistuje alebo nie je admin'
      }, { status: 401 });
    }

    const adminUser: AdminUser = {
      id: user.id,
      email: user.email,
      role: 'admin',
      name: user.companyName || 'Admin',
      twoFactorEnabled: user.twoFactorEnabled,
      permissions: []
    };

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: adminUser
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Chyba pri overení session'
    }, { status: 500 });
  }
}
