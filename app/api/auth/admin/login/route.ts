import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import type { AdminUser, AuthResult } from '@/lib/modules/auth/types';
import { createAccessToken, createRefreshToken } from '@/lib/auth/jwt';

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

    // Kontrola či má používateľ nastavené heslo (invitation pending)
    if (!user.passwordHash) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Účet čaká na aktiváciu. Skontrolujte email s odkazom na nastavenie hesla.'
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

    // Vytvor JWT tokeny
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

    // Vytvor response a nastav cookies priamo na ňom
    const response = NextResponse.json<AuthResult>({
      success: true,
      user: adminUser
    });

    // Nastav HTTP-only cookies priamo na response
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('eshop-access-token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hodina
      path: '/'
    });

    response.cookies.set('eshop-refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dní
      path: '/'
    });

    return response;
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
