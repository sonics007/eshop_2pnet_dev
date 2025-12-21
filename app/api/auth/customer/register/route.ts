import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { CustomerUser, AuthResult } from '@/lib/modules/auth/types';
import { readEmailSettings, sendEmail } from '@/lib/modules/email';
import { defaultRegistrationTemplate } from '@/lib/modules/email/types';

/**
 * POST /api/auth/customer/register
 * Registrácia nového zákazníka
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { email, password, companyName, ico, dic, vatId, phone, street, city, zip, country } = data;

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

    // Hashujeme heslo pomocou bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Vytvorenie používateľa
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        companyName,
        ico,
        dic,
        vatId: vatId?.trim() || null,
        phone: phone?.trim() || null,
        street: street?.trim() || null,
        city: city?.trim() || null,
        zip: zip?.trim() || null,
        country: country?.trim() || null,
        role: 'user',
        twoFactorEnabled: false
      }
    });

    const customerUser: CustomerUser = {
      id: user.id,
      email: user.email,
      role: 'customer',
      companyName: user.companyName || '',
      ico: user.ico || undefined,
      dic: user.dic || undefined,
      vatId: user.vatId || undefined,
      phone: user.phone || undefined,
      street: user.street || undefined,
      city: user.city || undefined,
      zip: user.zip || undefined,
      country: user.country || undefined
    };

    // Odoslať potvrdzovací email (best-effort)
    try {
      const settings = await readEmailSettings();
      const template =
        (settings.templates || []).find((t) => t.key === 'registration') ||
        settings.registrationTemplate ||
        defaultRegistrationTemplate;
      const fromAddress =
        template.fromEmail ||
        (settings.fromAliases || []).find((alias) => alias.includes('noreply')) ||
        settings.defaultFromEmail ||
        user.email;

      const brandColor = settings.brandColor || '#1e293b';
      const buttonUrl = template.buttonUrl || '/account';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          ${settings.logoUrl ? `<div style="text-align:center;margin-bottom:16px;"><img src="${settings.logoUrl}" alt="Logo" style="max-height:60px;"/></div>` : ''}
          <h1 style="color:${brandColor}; font-size:22px; margin: 0 0 12px;">${template.title}</h1>
          <p style="color:#334155; font-size:14px; line-height:1.6;">${template.intro}</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${buttonUrl}" style="display:inline-block; background:${brandColor}; color:white; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">
              ${template.buttonLabel}
            </a>
          </div>
          <p style="color:#475569; font-size:13px; line-height:1.6;">${template.closing}</p>
          ${settings.footerHtml ? `<div style="margin-top:16px; font-size:12px; color:#94a3b8;">${settings.footerHtml}</div>` : ''}
        </div>
      `;

      await sendEmail({
        to: user.email,
        from: { email: fromAddress, name: settings.defaultFromName || 'Eshop' },
        subject: template.subject || 'Vitajte',
        html,
        text: `${template.title}\n\n${template.intro}\n\n${template.buttonLabel}: ${buttonUrl}\n\n${template.closing}`
      });
    } catch (emailError) {
      console.warn('Registration email send failed:', emailError);
    }

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
