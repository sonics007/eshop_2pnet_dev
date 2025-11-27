import { NextResponse } from 'next/server';
import { generate2FASecret, enable2FA, disable2FA } from '@/lib/modules/users/service';
import type { TwoFAResponse } from '@/lib/modules/users';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/2fa
 * Generovanie nového 2FA secretu (QR kód)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json<TwoFAResponse>({
        success: false,
        error: 'Neplatné ID'
      }, { status: 400 });
    }

    const setup = await generate2FASecret(userId);

    return NextResponse.json<TwoFAResponse>({
      success: true,
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Generate 2FA error:', error);
    return NextResponse.json<TwoFAResponse>({
      success: false,
      error: message
    }, { status: 400 });
  }
}

/**
 * POST /api/users/[id]/2fa
 * Aktivácia 2FA s overením kódu
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json<TwoFAResponse>({
        success: false,
        error: 'Neplatné ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { secret, code } = body;

    if (!secret || !code) {
      return NextResponse.json<TwoFAResponse>({
        success: false,
        error: 'Secret a overovací kód sú povinné'
      }, { status: 400 });
    }

    await enable2FA(userId, secret, code);

    return NextResponse.json<TwoFAResponse>({
      success: true,
      message: '2FA bolo úspešne aktivované'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Enable 2FA error:', error);
    return NextResponse.json<TwoFAResponse>({
      success: false,
      error: message
    }, { status: 400 });
  }
}

/**
 * DELETE /api/users/[id]/2fa
 * Deaktivácia 2FA
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json<TwoFAResponse>({
        success: false,
        error: 'Neplatné ID'
      }, { status: 400 });
    }

    await disable2FA(userId);

    return NextResponse.json<TwoFAResponse>({
      success: true,
      message: '2FA bolo deaktivované'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Disable 2FA error:', error);
    return NextResponse.json<TwoFAResponse>({
      success: false,
      error: message
    }, { status: 400 });
  }
}
