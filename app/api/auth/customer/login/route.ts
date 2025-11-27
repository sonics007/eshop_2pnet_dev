import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CustomerUser, AuthResult } from '@/lib/modules/auth/types';

/**
 * POST /api/auth/customer/login
 * Prihlásenie zákazníka
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Email a heslo sú povinné'
      }, { status: 400 });
    }

    // Nájdi používateľa v DB
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávny email alebo heslo'
      }, { status: 401 });
    }

    // Kontrola role - customer only
    if (user.role !== 'user') {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávny email alebo heslo'
      }, { status: 401 });
    }

    // TODO: V produkcii použiť bcrypt.compare
    // Pre teraz jednoduchá kontrola (heslo je uložené ako hash)
    const isValid = user.passwordHash === password;

    if (!isValid) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávny email alebo heslo'
      }, { status: 401 });
    }

    const customerUser: CustomerUser = {
      id: user.id,
      email: user.email,
      role: 'customer',
      companyName: user.companyName,
      ico: user.ico || undefined,
      dic: user.dic || undefined,
      vatId: user.vatId || undefined
    };

    return NextResponse.json<AuthResult>({
      success: true,
      user: customerUser
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json<AuthResult>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
