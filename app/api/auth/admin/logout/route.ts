import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/jwt';

/**
 * POST /api/auth/admin/logout
 * Odhlásenie administrátora - vymaže JWT cookies
 */
export async function POST() {
  try {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Chyba pri odhlásení' }, { status: 500 });
  }
}
