/**
 * LEGACY CHAT SESSIONS
 *
 * Tento súbor je ponechaný pre spätnú kompatibilitu.
 * Nové funkcie používajú lib/modules/chat/service.ts
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export type ChatSessionInfo = {
  name?: string;
  email?: string;
  phone?: string;
};

export async function getOrCreateChatSession(sessionKey?: string, info?: ChatSessionInfo) {
  const key = sessionKey && sessionKey.trim().length ? sessionKey.trim() : randomUUID();
  const existing = await prisma.chatSession.findUnique({ where: { sessionKey: key } });
  const now = new Date();

  if (existing) {
    const updateData: Record<string, unknown> = { lastMessageAt: now };
    if (info?.name && info.name !== existing.visitorName) {
      updateData.visitorName = info.name;
    }
    if (info?.email && info.email !== existing.visitorEmail) {
      updateData.visitorEmail = info.email;
    }
    if (info?.phone && info.phone !== existing.visitorPhone) {
      updateData.visitorPhone = info.phone;
    }
    return prisma.chatSession.update({ where: { sessionKey: key }, data: updateData });
  }

  return prisma.chatSession.create({
    data: {
      sessionKey: key,
      visitorName: info?.name ?? null,
      visitorEmail: info?.email ?? null,
      visitorPhone: info?.phone ?? null,
      lastMessageAt: now,
      status: 'open'
    }
  });
}

export async function addChatMessage(
  sessionId: number,
  direction: 'visitor' | 'agent',
  content: string
) {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      direction,
      content
    }
  });
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { lastMessageAt: new Date() }
  });
  return message;
}

export async function getSessionMessages(sessionKey: string) {
  const session = await prisma.chatSession.findUnique({
    where: { sessionKey },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  return session;
}
