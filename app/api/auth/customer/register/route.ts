import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CustomerUser, AuthResult } from '@/lib/modules/auth/types';

/**
 * POST /api/auth/customer/register
 * Registrácia nového zákazníka
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { email, password, companyName, ico, dic, vatId, phone } = data;

    // Validácia povinných polí
    if (!email || !password || !companyName || !ico || !dic) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Vyplňte všetky povinné polia (email, heslo, firma, IČO, DIČ)'
      }, { status: 400 });
    }

    // Kontrola formátu emailu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Neplatný formát emailu'
      }, { status: 400 });
    }

    // Kontrola minimálnej dĺžky hesla
    if (password.length < 6) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Heslo musí mať aspoň 6 znakov'
      }, { status: 400 });
    }

    // Kontrola či email nie je obsadený
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json<AuthResult>({
        success: false,
        error: 'Email je už registrovaný'
      }, { status: 409 });
    }

    // TODO: V produkcii použiť bcrypt.hash
    // Pre teraz ukladáme heslo priamo (DEV ONLY!)
    const passwordHash = password;

    // Vytvorenie používateľa
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        companyName,
        ico,
        dic,
        vatId: vatId || null,
        role: 'user',
        twoFactorEnabled: false
      }
    });

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
    }, { status: 201 });
  } catch (error) {
    console.error('Customer register error:', error);
    return NextResponse.json<AuthResult>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
