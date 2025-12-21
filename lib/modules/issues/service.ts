/**
 * ISSUES MODULE - Service
 *
 * Správa hlásení chýb/pripomienok
 */

import { prisma } from '@/lib/prisma';
import type { IssueCreateInput, IssueRecord, IssueUpdateInput, IssueStatus, IssueReply } from './types';
import { sendEmail } from '@/lib/modules/email';
import { readEmailSettings } from '@/lib/modules/email';

const statusMap: Record<string, IssueStatus> = {
  new: 'new',
  in_progress: 'in_progress',
  resolved: 'resolved'
};

function mapStatus(raw: string): IssueStatus {
  return statusMap[raw] ?? 'new';
}

let ensureRunning = false;
let ensured = false;

function getDbProvider(): 'sqlite' | 'postgres' | 'unknown' {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('file:')) return 'sqlite';
  if (url.startsWith('postgres')) return 'postgres';
  return 'unknown';
}

async function ensureIssueTable() {
  if (ensured || ensureRunning) return;
  ensureRunning = true;
  const provider = getDbProvider();

  try {
    if (provider === 'sqlite') {
      const exists = await prisma.$queryRaw<{ name: string }[]>`SELECT name FROM sqlite_master WHERE type='table' AND name='Issue'`;
      if (exists.length === 0) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Issue" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "createdBy" TEXT NOT NULL,
            "resolvedBy" TEXT,
            "resolutionNote" TEXT,
            "status" TEXT NOT NULL DEFAULT 'new',
            "priority" INTEGER NOT NULL DEFAULT 3,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "resolvedAt" DATETIME
          );
        `);
        await prisma.$executeRawUnsafe(`
          CREATE TRIGGER IF NOT EXISTS issue_updated_at
          AFTER UPDATE ON "Issue"
          BEGIN
            UPDATE "Issue" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
          END;
        `);
      }
    } else if (provider === 'postgres') {
      const exists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'Issue'
        ) as "exists";
      `;
      if (!exists[0]?.exists) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Issue" (
            "id" SERIAL PRIMARY KEY,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "createdBy" TEXT NOT NULL,
            "resolvedBy" TEXT,
            "resolutionNote" TEXT,
            "status" TEXT NOT NULL DEFAULT 'new',
            "priority" INTEGER NOT NULL DEFAULT 3,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "resolvedAt" TIMESTAMPTZ
          );
        `);
        await prisma.$executeRawUnsafe(`
          CREATE OR REPLACE FUNCTION issue_updated_at_fn()
          RETURNS trigger AS $$
          BEGIN
            NEW."updatedAt" = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);
        await prisma.$executeRawUnsafe(`
          DROP TRIGGER IF EXISTS issue_updated_at ON "Issue";
        `);
        await prisma.$executeRawUnsafe(`
          CREATE TRIGGER issue_updated_at
          BEFORE UPDATE ON "Issue"
          FOR EACH ROW
          EXECUTE FUNCTION issue_updated_at_fn();
        `);
      }

      // ensure resolutionNote column
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT;`).catch(() => null);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMPTZ;`).catch(() => null);
    }

    ensured = true;
  } catch (error) {
    console.error('Issue table ensure failed:', error);
  } finally {
    ensureRunning = false;
  }
}

function isMissingTableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;
    // Prisma: P2021 -> table or column does not exist
    if (code === 'P2021') return true;
  }
  // SQLite / other errors text
  const message = (error instanceof Error) ? error.message : '';
  return message.includes('no such table') || message.includes('does not exist');
}

async function cleanupExpiredResolved() {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    await prisma.issue.deleteMany({
      where: {
        resolvedAt: {
          lt: threshold
        }
      }
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      await ensureIssueTable();
      await prisma.issue.deleteMany({
        where: {
          resolvedAt: {
            lt: threshold
          }
        }
      });
    }
  }
}

export async function listIssues(): Promise<IssueRecord[]> {
  await ensureIssueTable();
  await cleanupExpiredResolved();
  let issues;
  try {
    issues = await prisma.issue.findMany({
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }]
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      await ensureIssueTable();
      issues = await prisma.issue.findMany({
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }]
      });
    } else {
      throw error;
    }
  }

  return issues.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    createdBy: i.createdBy,
    resolvedBy: i.resolvedBy,
    resolutionNote: (i as any).resolutionNote ?? null,
    resolutionReplies: safeParseReplies((i as any).resolutionReplies),
    resolutionLocked: (i as any).resolutionLocked ?? false,
    status: mapStatus(i.status),
    priority: i.priority,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null
  }));
}

export async function createIssue(input: IssueCreateInput, createdBy: string): Promise<IssueRecord> {
  await ensureIssueTable();
  let issue;
  try {
    issue = await prisma.issue.create({
      data: {
        title: input.title,
        description: input.description,
        createdBy,
        priority: Math.min(Math.max(input.priority ?? 3, 1), 5),
        status: 'new'
      }
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      await ensureIssueTable();
      issue = await prisma.issue.create({
        data: {
          title: input.title,
          description: input.description,
          createdBy,
          priority: Math.min(Math.max(input.priority ?? 3, 1), 5),
          status: 'new'
        }
      });
    } else {
      throw error;
    }
  }

  const result: IssueRecord = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    createdBy: issue.createdBy,
    resolvedBy: issue.resolvedBy,
    resolutionNote: (issue as any).resolutionNote ?? null,
    resolutionReplies: safeParseReplies((issue as any).resolutionReplies),
    resolutionLocked: (issue as any).resolutionLocked ?? false,
    status: mapStatus(issue.status),
    priority: issue.priority,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : null
  };

  // potvrdenie zadávateľovi
  sendIssueNotification(result, {
    newIssue: true,
    statusChanged: false,
    noteChanged: false,
    newReply: false
  }).catch((err) => console.warn('Issue create notification failed:', err));

  return result;
}

export async function updateIssue(id: number, updates: IssueUpdateInput, actorEmail: string): Promise<IssueRecord> {
  await ensureIssueTable();
  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Issue not found');
  }

  const currentStatus = mapStatus(existing.status);
  const statusLocked = currentStatus === 'resolved' && Boolean((existing as any).resolutionLocked);

  let nextStatus = updates.status ? mapStatus(updates.status) : currentStatus;
  if (statusLocked) {
    nextStatus = currentStatus;
  }

  const resolvedAt =
    nextStatus === 'resolved'
      ? existing.resolvedAt || new Date()
      : null;

  let issue;
  const replies = safeParseReplies((existing as any).resolutionReplies);
  let newReplies = replies;
  if (updates.newReply && updates.newReply.trim()) {
    const reply: IssueReply = { author: actorEmail, text: updates.newReply.trim(), at: new Date().toISOString() };
    newReplies = [...replies, reply];
  }

  const noteChanged =
    typeof updates.resolutionNote === 'string' &&
    updates.resolutionNote !== (existing as any).resolutionNote;
  const statusChanged = nextStatus !== currentStatus;
  const resolutionLockedNext = Boolean(
    (existing as any).resolutionLocked ||
    updates.resolutionLocked ||
    nextStatus === 'resolved' ||
    noteChanged
  );

  try {
    issue = await prisma.issue.update({
      where: { id },
      data: {
        status: nextStatus,
        priority: existing.priority,
        resolvedBy: nextStatus === 'resolved' ? (existing.resolvedBy || updates.resolvedBy || actorEmail) : null,
        resolvedAt,
        resolutionNote: updates.resolutionNote ?? (existing as any).resolutionNote ?? null,
        resolutionReplies: newReplies.length ? JSON.stringify(newReplies) : JSON.stringify([]),
        resolutionLocked: resolutionLockedNext
      }
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      await ensureIssueTable();
    issue = await prisma.issue.update({
      where: { id },
      data: {
        status: nextStatus,
        priority: existing.priority,
        resolvedBy: nextStatus === 'resolved' ? (existing.resolvedBy || updates.resolvedBy || actorEmail) : null,
        resolvedAt,
        resolutionNote: updates.resolutionNote ?? (existing as any).resolutionNote ?? null,
        resolutionReplies: newReplies.length ? JSON.stringify(newReplies) : JSON.stringify([]),
        resolutionLocked: resolutionLockedNext
      }
    });
  } else {
    throw error;
  }
  }

  const result: IssueRecord = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    createdBy: issue.createdBy,
    resolvedBy: issue.resolvedBy,
    resolutionNote: (issue as any).resolutionNote ?? null,
    resolutionReplies: safeParseReplies((issue as any).resolutionReplies),
    resolutionLocked: (issue as any).resolutionLocked ?? false,
    status: mapStatus(issue.status),
    priority: issue.priority,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : null
  };

  if (statusChanged || noteChanged || (updates.newReply && updates.newReply.trim())) {
    sendIssueNotification(result, {
      statusChanged,
      noteChanged,
      newReply: Boolean(updates.newReply && updates.newReply.trim()),
      newIssue: false
    }).catch((err) => console.warn('Issue notification failed:', err));
  }

  return result;
}

function safeParseReplies(raw: any): IssueReply[] {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) return raw as IssueReply[];
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? (parsed as IssueReply[]) : [];
  } catch {
    return [];
  }
}

async function sendIssueNotification(
  issue: IssueRecord,
  change: { statusChanged: boolean; noteChanged: boolean; newReply: boolean; newIssue?: boolean }
) {
  if (!issue.createdBy || !issue.createdBy.includes('@')) return;
  const settings = await readEmailSettings();
  const issueTemplate =
    (settings.templates || []).find((t) => t.key === 'issue') || (settings.templates || [])[0];
  const from =
    issueTemplate?.fromEmail ||
    (settings.fromAliases || []).find((a) => a.includes('noreply')) ||
    settings.defaultFromEmail ||
    issue.resolvedBy ||
    'no-reply@example.com';

  const subject = change.newIssue
    ? `${issueTemplate?.subject || 'Prijatie hlásenia'} #${issue.id}`
    : change.statusChanged
      ? `${issueTemplate?.subject || 'Aktualizácia hlásenia'} #${issue.id}: ${issue.status === 'resolved' ? 'Vyriešené' : 'Aktualizované'}`
      : change.newReply
        ? `${issueTemplate?.subject || 'Aktualizácia hlásenia'} #${issue.id} – Nová reakcia`
        : `${issueTemplate?.subject || 'Aktualizácia hlásenia'} #${issue.id}`;

  const repliesHtml = (issue.resolutionReplies || [])
    .map((r) => `<li><strong>${r.author}</strong> (${formatDate(r.at)}): ${r.text}</li>`)
    .join('');

  const buttonUrl = issueTemplate?.buttonUrl || '/admin/issues';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 12px;">
      <h1 style="color:#0f172a; font-size:20px; margin-bottom: 8px;">${issueTemplate?.title || (change.newIssue ? 'Prijali sme vaše hlásenie' : 'Aktualizácia hlásenia')}</h1>
      <p style="color:#334155; font-size:14px; line-height:1.6;">${issueTemplate?.intro || ''}</p>
      <div style="margin:16px 0; padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
        <p style="margin:4px 0;"><strong>ID:</strong> #${issue.id}</p>
        <p style="margin:4px 0;"><strong>Názov:</strong> ${issue.title}</p>
        ${issue.description ? `<p style="margin:4px 0;"><strong>Popis:</strong> ${issue.description}</p>` : ''}
        <p style="margin:4px 0;"><strong>Priorita:</strong> ${issue.priority}</p>
        <p style="margin:4px 0;"><strong>Stav:</strong> ${issue.status}</p>
        ${issue.resolutionNote ? `<p style="margin:4px 0;"><strong>Komentár po oprave:</strong><br/>${issue.resolutionNote}</p>` : ''}
        ${repliesHtml ? `<p style="margin:4px 0;"><strong>Reakcie:</strong></p><ul style="margin:0 0 0 18px; padding:0;">${repliesHtml}</ul>` : ''}
      </div>
      <div style="text-align:center; margin: 20px 0;">
        <a href="${buttonUrl}" style="display:inline-block; background:#0f172a; color:white; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">
          ${issueTemplate?.buttonLabel || 'Zobraziť hlásenie'}
        </a>
      </div>
      <p style="color:#475569;font-size:12px; line-height:1.6;">${issueTemplate?.closing || 'Tento email bol vygenerovaný automaticky.'}</p>
    </div>
  `;

  await sendEmail({
    to: issue.createdBy,
    from: { email: from, name: settings.defaultFromName || 'Eshop' },
    subject,
    html,
    text: `Hlásenie #${issue.id}\nPriorita: ${issue.priority}\nStav: ${issue.status}\n${
      issue.resolutionNote ? `Komentár: ${issue.resolutionNote}\n` : ''
    }${issue.resolutionReplies?.map((r) => `- ${r.author}: ${r.text}`).join('\n') || ''}`
  });
}

// Trigger notification for newly vytvorené hlásenie
