/**
 * EMAIL MODULE - Service (IMAP only)
 *
 * Ukladá IMAP nastavenia a testuje IMAP pripojenie. SMTP/POP3 sú vypnuté.
 */

import net from 'net';
import tls from 'tls';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '@/lib/prisma';
import {
  EmailSettings,
  EmailMessage,
  EmailSendResult,
  EmailAddress,
  EmailPurpose,
  defaultEmailSettings
} from './types';

const CONFIG_KEY = 'email-settings';

// ==================== SETTINGS MANAGEMENT ====================

export async function readEmailSettings(): Promise<EmailSettings> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY }
    });

    if (!config) {
      return defaultEmailSettings;
    }

  const parsed = JSON.parse(config.value) as Partial<EmailSettings>;
  return {
    ...defaultEmailSettings,
    ...parsed,
    imap: {
      ...defaultEmailSettings.imap,
      ...parsed.imap
    },
    smtp: {
      ...defaultEmailSettings.smtp,
      ...parsed.smtp
    },
    addresses: parsed.addresses ?? defaultEmailSettings.addresses,
    fromAliases: parsed.fromAliases ?? defaultEmailSettings.fromAliases,
    registrationTemplate: {
      ...defaultEmailSettings.registrationTemplate,
      ...(parsed as any).registrationTemplate
    },
    templates: (parsed as any).templates
      ? (parsed as any).templates
      : defaultEmailSettings.templates
  };
  } catch (error) {
    console.error('Error reading email settings:', error);
    return defaultEmailSettings;
  }
}

export async function writeEmailSettings(
  settings: Partial<EmailSettings>
): Promise<EmailSettings> {
  try {
    const current = await readEmailSettings();
  const updated: EmailSettings = {
    ...current,
    ...settings,
    imap: settings.imap ? { ...current.imap, ...settings.imap } : current.imap,
    smtp: settings.smtp ? { ...current.smtp, ...settings.smtp } : current.smtp,
    addresses: settings.addresses ?? current.addresses,
    fromAliases: settings.fromAliases ?? current.fromAliases,
    registrationTemplate: settings.registrationTemplate
      ? { ...current.registrationTemplate, ...settings.registrationTemplate }
      : current.registrationTemplate,
    templates: settings.templates ?? current.templates
  };

    await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: CONFIG_KEY, value: JSON.stringify(updated) }
    });

    return updated;
  } catch (error) {
    console.error('Error writing email settings:', error);
    throw error;
  }
}

// ==================== EMAIL ADDRESS MANAGEMENT ====================

export async function getEmailAddress(purpose: EmailPurpose): Promise<EmailAddress | null> {
  const settings = await readEmailSettings();
  return settings.addresses.find(
    addr => addr.purpose === purpose && addr.enabled && addr.email
  ) || null;
}

export async function getEmailAddressByPurpose(purpose: EmailPurpose): Promise<string | null> {
  const address = await getEmailAddress(purpose);
  return address?.email || null;
}

export async function addEmailAddress(address: Omit<EmailAddress, 'id'>): Promise<EmailSettings> {
  const settings = await readEmailSettings();
  const newAddress: EmailAddress = {
    ...address,
    id: `${address.purpose}-${Date.now()}`
  };

  settings.addresses.push(newAddress);
  return writeEmailSettings({ addresses: settings.addresses });
}

export async function updateEmailAddress(
  id: string,
  updates: Partial<EmailAddress>
): Promise<EmailSettings> {
  const settings = await readEmailSettings();
  const index = settings.addresses.findIndex(addr => addr.id === id);

  if (index === -1) {
    throw new Error('Email address not found');
  }

  settings.addresses[index] = { ...settings.addresses[index], ...updates };
  return writeEmailSettings({ addresses: settings.addresses });
}

export async function deleteEmailAddress(id: string): Promise<EmailSettings> {
  const settings = await readEmailSettings();
  settings.addresses = settings.addresses.filter(addr => addr.id !== id);
  return writeEmailSettings({ addresses: settings.addresses });
}

// ==================== IMAP CONNECTION TEST ====================

export async function testImapConnection(): Promise<{ success: boolean; error?: string }> {
  const settings = await readEmailSettings();
  const imap = settings.imap;

  if (!imap?.host || !imap.auth.user || !imap.auth.pass) {
    return { success: false, error: 'IMAP nie je nakonfigurovaný (host, user, pass).' };
  }

  const port = imap.port || 993;
  const timeout = 8000;

  return new Promise((resolve) => {
    const socket = imap.secure
      ? tls.connect(port, imap.host, { rejectUnauthorized: false })
      : net.createConnection({ host: imap.host, port });

    let stage: 'banner' | 'login' | 'logout' = 'banner';

    const cleanup = () => {
      socket.removeAllListeners();
      socket.end();
      socket.destroy();
    };

    const fail = (message: string) => {
      cleanup();
      resolve({ success: false, error: message });
    };

    const succeed = () => {
      cleanup();
      resolve({ success: true });
    };

    socket.setTimeout(timeout, () => fail('IMAP timeout'));
    socket.on('error', (err) => fail(err?.message || 'IMAP chyba'));

    socket.on('data', (buffer) => {
      const text = buffer.toString();
      if (stage === 'banner') {
        if (!text.toUpperCase().includes('OK')) {
          fail(`IMAP odmietnuté: ${text.trim()}`);
          return;
        }
        socket.write(`a1 LOGIN ${imap.auth.user} ${imap.auth.pass}\r\n`);
        stage = 'login';
      } else if (stage === 'login') {
        if (!text.toUpperCase().includes('OK')) {
          fail(`IMAP login failed: ${text.trim()}`);
          return;
        }
        socket.write('a2 LOGOUT\r\n');
        stage = 'logout';
        succeed();
      }
    });
  });
}

// ==================== SMTP TRANSPORTER ====================

let cachedTransporter: Transporter | null = null;
let cachedSmtp: EmailSettings['smtp'] | null = null;

async function getTransporter(): Promise<Transporter | null> {
  const settings = await readEmailSettings();
  const smtp = settings.smtp;

  if (!smtp.host || !smtp.auth.user) {
    return null;
  }

  if (cachedTransporter && cachedSmtp && JSON.stringify(cachedSmtp) === JSON.stringify(smtp)) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
    tls: smtp.tls,
    connectionTimeout: smtp.connectionTimeout,
    greetingTimeout: smtp.greetingTimeout
  });
  cachedSmtp = smtp;
  return cachedTransporter;
}

// ==================== SEND EMAIL ====================

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const settings = await readEmailSettings();

  if (!settings.enabled) {
    return { success: false, error: 'Emaily sú vypnuté v nastaveniach.' };
  }

  if (settings.testMode) {
    const recipient = settings.testModeRecipient || 'test@example.com';
    message.to = recipient;
    console.log('[Email][TEST] To:', recipient, 'Subject:', message.subject);
  }

  const transporter = await getTransporter();
  if (!transporter) {
    return { success: false, error: 'SMTP nie je nakonfigurované.' };
  }

  if (!message.from?.email && !settings.defaultFromEmail) {
    return { success: false, error: 'Chýba odosielateľská adresa.' };
  }

  const from = message.from
    ? `"${message.from.name || settings.defaultFromName}" <${message.from.email}>`
    : `"${settings.defaultFromName}" <${settings.defaultFromEmail}>`;

  let html = message.html || '';
  let text = message.text || '';

  if (settings.footerHtml && html) {
    html += `<br/><hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;"/>${settings.footerHtml}`;
  }
  if (settings.footerText && text) {
    text += `\n\n---\n${settings.footerText}`;
  }

  try {
    const result = await transporter.sendMail({
      from,
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      replyTo: message.replyTo || settings.defaultReplyTo,
      subject: message.subject,
      html: html || undefined,
      text: text || undefined
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email] send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Neznáma chyba' };
  }
}

export async function sendTestEmail(to: string, fromAlias?: string): Promise<EmailSendResult> {
  const settings = await readEmailSettings();
  const recipient = to || settings.testModeRecipient || settings.defaultFromEmail;
  if (!recipient) {
    return { success: false, error: 'Nie je zadaný príjemca test emailu ani predvolená adresa.' };
  }
  return sendEmail({
    to: recipient,
    from: fromAlias ? { email: fromAlias, name: settings.defaultFromName } : undefined,
    subject: 'Test email z e-shopu',
    html: `<p>Test IMAP/SMTP konfigurácie. ${new Date().toLocaleString('sk-SK')}</p>`,
    text: `Test IMAP/SMTP konfigurácie. ${new Date().toLocaleString('sk-SK')}`
  });
}

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = await getTransporter();
  if (!transporter) {
    return { success: false, error: 'SMTP nie je nakonfigurované.' };
  }
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Pripojenie zlyhalo' };
  }
}

export async function testPop3Connection(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'POP3 je vypnuté, k dispozícii je len IMAP/SMTP.' };
}

// ==================== HELPER FUNCTIONS ====================

export async function sendOrderConfirmation(
  to: string,
  orderData: {
    orderNumber: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    currency: string;
  }
): Promise<EmailSendResult> {
  return sendEmail({
    to,
    subject: `Potvrdenie objednávky #${orderData.orderNumber}`,
    text: `Objednávka #${orderData.orderNumber}, suma: ${orderData.total} ${orderData.currency}`
  });
}

// ==================== ADMIN INVITATION EMAIL ====================

export async function sendAdminInvitationEmail(
  to: string,
  token: string,
  adminName: string
): Promise<EmailSendResult> {
  const settings = await readEmailSettings();

  // Nájdi šablónu admin-invitation
  const template = settings.templates?.find(t => t.key === 'admin-invitation');

  // Zisti base URL z prostredia alebo použi default
  const envUrl = settings.publicBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  const normalizedBase =
    envUrl && envUrl.length > 0
      ? (envUrl.startsWith('http') ? envUrl : `https://${envUrl}`)
      : 'http://localhost:3000';
  const setPasswordUrl = `${normalizedBase}/admin/set-password?token=${token}`;

  const subject = template?.subject || 'Pozvánka do administrácie e-shopu';
  const title = template?.title || 'Boli ste pozvaní ako administrátor';
  const intro = template?.intro || 'Boli ste pridaní ako administrátor e-shopu. Kliknite na tlačidlo nižšie a nastavte si heslo.';
  const buttonLabel = template?.buttonLabel || 'Nastaviť heslo';
  const closing = template?.closing || 'Tento odkaz je platný 24 hodín.';

  const brandColor = settings.brandColor || '#1e293b';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 48px; margin-bottom: 16px;">` : ''}
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${brandColor};">${title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">
                Dobrý deň${adminName ? `, <strong>${adminName}</strong>` : ''},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
                ${intro}
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${setPasswordUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      ${buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #64748b;">
                Ak tlačidlo nefunguje, skopírujte tento odkaz do prehliadača:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.4; color: #94a3b8; word-break: break-all;">
                ${setPasswordUrl}
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                ${closing}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                ${settings.footerText || 'Tento email bol odoslaný automaticky.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
${title}

Dobrý deň${adminName ? `, ${adminName}` : ''},

${intro}

Nastaviť heslo: ${setPasswordUrl}

${closing}

---
${settings.footerText || 'Tento email bol odoslaný automaticky.'}
`;

  return sendEmail({
    to,
    subject,
    html,
    text
  });
}
