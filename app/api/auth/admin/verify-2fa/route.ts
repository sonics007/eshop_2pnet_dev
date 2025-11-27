import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import type { AdminUser, AuthResult } from '@/lib/modules/auth/types';

// OTP secret - v produkcii by malo byť per-user a v DB
const OTP_SECRET = 'SUPERSECRET2P';

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

    // Overiť OTP kód
    const isValidOtp = authenticator.check(code, OTP_SECRET);
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
