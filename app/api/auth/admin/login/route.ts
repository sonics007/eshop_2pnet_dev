import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import type { AdminUser, AuthResult } from '@/lib/modules/auth/types';

/**
 * POST /api/auth/admin/login
 * Prihlásenie administrátora
 */
export async function POST(request: Request) {
  try {
    const { email, password, otpCode } = await request.json();

    if (!email || !password) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Email alebo meno a heslo sú povinné'
      }, { status: 400 });
    }

    const loginInput = email.trim().toLowerCase();

    // Nájdi používateľa v DB - podľa emailu alebo mena
    let user = await prisma.user.findUnique({
      where: { email: loginInput }
    });

    // Ak nenájdené podľa emailu, hľadaj admina podľa mena alebo časti emailu
    if (!user) {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' }
      });

      // Skús nájsť podľa companyName (case-insensitive)
      user = admins.find(a =>
        a.companyName?.toLowerCase() === loginInput
      ) ?? null;

      // Skús aj podľa časti pred @ v emaili
      if (!user && !loginInput.includes('@')) {
        user = admins.find(a =>
          a.email.toLowerCase().startsWith(loginInput + '@')
        ) ?? null;
      }
    }

    if (!user) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      }, { status: 401 });
    }

    // Kontrola role - admin only
    if (user.role !== 'admin') {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      }, { status: 401 });
    }

    // Overenie hesla - podporuje bcrypt hash aj plain text (pre migráciu)
    let isValid = false;
    if (user.passwordHash.startsWith('$2')) {
      // Bcrypt hash
      isValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Plain text (pre spätnú kompatibilitu - odstrániť po migrácii)
      isValid = user.passwordHash === password;
    }

    if (!isValid) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      }, { status: 401 });
    }

    // Kontrola 2FA
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!otpCode) {
        // Vyžiadať 2FA kód
        return NextResponse.json<AuthResult>({
          success: false,
          requiresTwoFactor: true
        });
      }

      // Overiť OTP kód s user-specific secret
      const otpSecret = user.twoFactorSecret || process.env.ADMIN_OTP_SECRET;
      if (!otpSecret) {
        return NextResponse.json<AuthResult>({
          success: false,
          error: '2FA nie je správne nakonfigurované'
        }, { status: 500 });
      }

      const isValidOtp = authenticator.check(otpCode, otpSecret);
      if (!isValidOtp) {
        return NextResponse.json<AuthResult>({
          success: false,
          error: 'Neplatný overovací kód'
        }, { status: 401 });
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin login error:', error);
    }
    return NextResponse.json<AuthResult>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
