import { NextResponse } from 'next/server';
import { setPasswordByToken } from '@/lib/modules/users/service';
import { prisma } from '@/lib/prisma';

interface SetPasswordRequest {
  token: string;
  password: string;
}

interface SetPasswordResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/auth/admin/set-password
 * Nastavenie hesla pre nového admina cez invitation token
 */
export async function POST(request: Request) {
  try {
    const body: SetPasswordRequest = await request.json();

    if (!body.token || !body.password) {
      return NextResponse.json<SetPasswordResponse>({
        success: false,
        error: 'Token a heslo sú povinné'
      }, { status: 400 });
    }

    // Validácia hesla
    if (body.password.length < 8) {
      return NextResponse.json<SetPasswordResponse>({
        success: false,
        error: 'Heslo musí mať aspoň 8 znakov'
      }, { status: 400 });
    }

    const result = await setPasswordByToken({
      token: body.token,
      password: body.password
    });

    if (!result.success) {
      return NextResponse.json<SetPasswordResponse>({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json<SetPasswordResponse>({
      success: true
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json<SetPasswordResponse>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/admin/set-password?token=xxx
 * Overenie platnosti tokenu
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'Token nie je zadaný'
      }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { invitationToken: token },
      select: {
        email: true,
        companyName: true,
        invitationExpiry: true
      }
    });

    const expiry = user?.invitationExpiry ? new Date(user.invitationExpiry as any) : null;

    if (!user || !expiry || expiry.getTime() < Date.now()) {
      return NextResponse.json({
        valid: false,
        error: 'Neplatný alebo expirovaný odkaz'
      });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.companyName
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
