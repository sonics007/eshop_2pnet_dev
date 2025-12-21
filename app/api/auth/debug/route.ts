import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * GET /api/auth/debug
 * Debug endpoint pre kontrolu cookies a tokenov
 * POZOR: Len pre development!
 */
export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const accessToken = cookieStore.get('eshop-access-token')?.value;
  const refreshToken = cookieStore.get('eshop-refresh-token')?.value;

  let accessPayload = null;
  let refreshPayload = null;
  let accessError = null;
  let refreshError = null;

  if (accessToken) {
    try {
      accessPayload = await verifyToken(accessToken);
    } catch (e) {
      accessError = String(e);
    }
  }

  if (refreshToken) {
    try {
      refreshPayload = await verifyToken(refreshToken);
    } catch (e) {
      refreshError = String(e);
    }
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    cookieNames: allCookies.map(c => c.name),
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
    accessPayload,
    accessError,
    refreshPayload,
    refreshError
  });
}

/**
 * POST /api/auth/debug
 * Testovací endpoint - nastaví test cookie
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Test cookie set'
  });

  response.cookies.set('test-cookie', 'test-value-123', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/'
  });

  return response;
}
