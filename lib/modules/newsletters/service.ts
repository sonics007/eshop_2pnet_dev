import { prisma } from '@/lib/prisma';
import { readConfig, writeConfig } from '@/lib/configStore';
import { sendEmail } from '@/lib/modules/email/service';
import type { User } from '@prisma/client';

export type NewsletterAudience = 'all' | 'admins' | 'customers' | 'custom';

export type Newsletter = {
  id: string;
  title: string;
  subject: string;
  html: string;
  pdfUrl?: string;
  fromEmail?: string;
  audience: NewsletterAudience;
  emails: string[];
  createdAt: number;
  createdBy?: string;
  // optional stored pdf path
  pdfLocalPath?: string;
};

const CONFIG_KEY = 'newsletters';

export async function readNewsletters(): Promise<Newsletter[]> {
  const stored = await readConfig<Newsletter[]>(CONFIG_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored;
}

export async function addNewsletter(newsletter: Omit<Newsletter, 'id' | 'createdAt'>) {
  const current = await readNewsletters();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const next: Newsletter = { ...newsletter, id, createdAt: Date.now() };
  const updated = [next, ...current].slice(0, 100); // limit posledných 100
  await writeConfig(CONFIG_KEY, updated);
  return next;
}

export async function getNewsletterById(id: string) {
  const list = await readNewsletters();
  return list.find((n) => n.id === id) || null;
}

export async function updateNewsletter(
  id: string,
  payload: Partial<Omit<Newsletter, 'id' | 'createdAt'>>
) {
  const list = await readNewsletters();
  const index = list.findIndex((n) => n.id === id);
  if (index === -1) throw new Error('Newsletter sa nenašiel');

  const updated = { ...list[index], ...payload };
  const next = [...list];
  next[index] = updated;
  await writeConfig(CONFIG_KEY, next);
  return updated;
}

export async function deleteNewsletter(id: string) {
  const list = await readNewsletters();
  const next = list.filter((n) => n.id !== id);
  await writeConfig(CONFIG_KEY, next);
  return { deleted: list.length - next.length };
}

export async function sendNewsletter(id: string) {
  const newsletter = await getNewsletterById(id);
  if (!newsletter) throw new Error('Newsletter sa nenašiel');

  let recipients: string[] = [];

  if (newsletter.audience === 'custom') {
    recipients = newsletter.emails;
  } else {
    const role =
      newsletter.audience === 'admins'
        ? 'admin'
        : newsletter.audience === 'customers'
          ? 'user'
          : undefined;

    const users: User[] = await prisma.user.findMany({
      where: role ? { role } : {},
      select: { email: true }
    });
    recipients = users.map((u) => u.email).filter(Boolean);
  }

  // uniq + clean
  const uniqueRecipients = Array.from(new Set(recipients.map((e) => e.toLowerCase().trim()))).filter(Boolean);
  if (!uniqueRecipients.length) {
    throw new Error('Nie sú žiadni adresáti');
  }

  // Väčšina emailových klientov PDF neembeddeduje, preto vždy pridaj funkčný link.
  const htmlFallback = newsletter.pdfUrl
    ? `<p style="margin-top:16px;"><a href="${newsletter.pdfUrl}" target="_blank" rel="noopener">Otvoriť PDF</a></p>`
    : '';

  const html =
    (newsletter.html && `${newsletter.html}${htmlFallback ? `<div>${htmlFallback}</div>` : ''}`) ||
    (newsletter.pdfUrl ? `<div>${htmlFallback}</div>` : '');

  const fromEmail = newsletter.fromEmail;

  // Odosielaj po dávkach, aby sa znížilo riziko limitov
  const chunkSize = 20;
  for (let i = 0; i < uniqueRecipients.length; i += chunkSize) {
    const chunk = uniqueRecipients.slice(i, i + chunkSize);
    await sendEmail({
      to: chunk,
      subject: newsletter.subject,
      from: fromEmail ? { email: fromEmail, name: newsletter.title || 'Newsletter' } : undefined,
      html
    });
  }

  return { sent: uniqueRecipients.length };
}
