import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { readEmailSettings, sendEmail } from '@/lib/modules/email';
import { defaultTemplates } from '@/lib/modules/email/types';
import bcrypt from 'bcryptjs';

const EXPIRATION_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email je povinný.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ success: true, message: 'Ak účet existuje, email bol odoslaný.' });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000).toISOString();
    await prisma.config.upsert({
      where: { key: `reset-token-${token}` },
      update: { value: JSON.stringify({ userId: user.id, expiresAt }) },
      create: { key: `reset-token-${token}`, value: JSON.stringify({ userId: user.id, expiresAt }) }
    });

    const settings = await readEmailSettings();
    const resetTemplate =
      (settings.templates || defaultTemplates).find((t) => t.key === 'reset') || defaultTemplates.find((t) => t.key === 'reset');

    const baseHost =
      settings.publicBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';
    const resetUrlBase = resetTemplate?.buttonUrl || '/account/reset';
    const resetUrlObj = new URL(resetUrlBase, baseHost);
    resetUrlObj.searchParams.set('token', token);
    const resetUrl = resetUrlObj.toString();
    const brandColor = settings.brandColor || '#1e293b';

    await sendEmail({
      to: user.email,
      from: {
        email:
          resetTemplate?.fromEmail ||
          (settings.fromAliases || []).find((alias) => alias.includes('noreply')) ||
          settings.defaultFromEmail ||
          user.email,
        name: settings.defaultFromName || 'Eshop'
      },
      subject: resetTemplate?.subject || 'Obnova hesla',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          ${settings.logoUrl ? `<div style="text-align:center;margin-bottom:16px;"><img src="${settings.logoUrl}" alt="Logo" style="max-height:60px;"/></div>` : ''}
          <h1 style="color:${brandColor}; font-size:22px; margin: 0 0 12px;">${resetTemplate?.title || 'Obnova hesla'}</h1>
          <p style="color:#334155; font-size:14px; line-height:1.6;">${resetTemplate?.intro}</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:${brandColor}; color:white; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">
              ${resetTemplate?.buttonLabel || 'Obnoviť heslo'}
            </a>
          </div>
          <p style="color:#475569; font-size:13px; line-height:1.6;">${resetTemplate?.closing}</p>
          ${settings.footerHtml ? `<div style="margin-top:16px; font-size:12px; color:#94a3b8;">${settings.footerHtml}</div>` : ''}
        </div>
      `,
      text: `${resetTemplate?.title || 'Obnova hesla'}\n\n${resetTemplate?.intro}\n${resetTemplate?.buttonLabel || 'Obnoviť heslo'}: ${resetUrl}\n\n${resetTemplate?.closing}`
    });

    return NextResponse.json({ success: true, message: 'Email na obnovu bol odoslaný (ak účet existuje).' });
  } catch (error) {
    console.error('Reset request error:', error);
    return NextResponse.json({ success: false, error: 'Chyba servera' }, { status: 500 });
  }
}
