import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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

    // Kontrola či má používateľ nastavené heslo
    if (!user.passwordHash) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Nesprávny email alebo heslo'
      }, { status: 401 });
    }

    // Overenie hesla pomocou bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);

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
      vatId: user.vatId || undefined,
      phone: user.phone || undefined,
      street: user.street || undefined,
      city: user.city || undefined,
      zip: user.zip || undefined,
      country: user.country || undefined
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
