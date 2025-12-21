import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import type { AdminUser, AuthResult } from '@/lib/modules/auth/types';
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth/jwt';

/**
 * POST /api/auth/admin/verify-2fa
 * Overenie 2FA kódu po úspešnom prihlásení
 */
export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Email a kód sú povinné'
      }, { status: 400 });
    }

    // Nájdi používateľa
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Neplatná požiadavka'
      }, { status: 401 });
    }

    const otpSecret = user.twoFactorSecret || process.env.ADMIN_OTP_SECRET;

    // Skontrolovať, či má používateľ 2FA povolené a dostupný secret
    if (!user.twoFactorEnabled || !otpSecret) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: '2FA nie je pre tento účet nastavené'
      }, { status: 400 });
    }

    // Overiť OTP kód proti používateľskému secretu
    const isValidOtp = authenticator.check(code, otpSecret);
    if (!isValidOtp) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Neplatný overovací kód'
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

    // Vytvor JWT tokeny po úspešnom 2FA overení
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: 'admin'
    });
    const refreshToken = await createRefreshToken({
      userId: user.id,
      email: user.email,
      role: 'admin'
    });

    // Nastav HTTP-only cookies
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json<AuthResult>({
      success: true,
      user: adminUser
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json<AuthResult>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
