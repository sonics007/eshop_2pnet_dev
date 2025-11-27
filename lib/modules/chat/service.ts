/**
 * CHAT MODULE - Service Layer
 *
 * Biznis logika pre interný chat systém.
 * Server-only - nepoužívať na klientovi.
 */

import { prisma } from '@/lib/prisma';
import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultChatSettings, mergeChatSettings } from './types';
import type { ChatSettings, ChatSession, ChatMessage, SendMessageRequest, SendMessageResponse } from './types';

const CONFIG_KEY = 'chat-settings-v2';

// ===============================
// SETTINGS
// ===============================

export async function getChatSettings(): Promise<ChatSettings> {
  const stored = await readConfig<ChatSettings>(CONFIG_KEY, defaultChatSettings);
  return mergeChatSettings(stored);
}

export async function saveChatSettings(settings: Partial<ChatSettings>): Promise<ChatSettings> {
  const current = await getChatSettings();
  const merged = mergeChatSettings({ ...current, ...settings });
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}

// ===============================
// SESSIONS
// ===============================

export async function getOrCreateSession(sessionKey: string): Promise<ChatSession> {
  let session = await prisma.chatSession.findUnique({
    where: { sessionKey }
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        sessionKey,
        status: 'open'
      }
    });
  }

  return {
    id: session.id,
    sessionKey: session.sessionKey,
    visitorName: session.visitorName || undefined,
    visitorEmail: session.visitorEmail || undefined,
    visitorPhone: session.visitorPhone || undefined,
    status: session.status as 'open' | 'closed',
    lastMessageAt: session.lastMessageAt || undefined,
    createdAt: session.createdAt
  };
}

export async function updateSessionProfile(
  sessionKey: string,
  data: { name?: string; email?: string; phone?: string }
): Promise<void> {
  await prisma.chatSession.update({
    where: { sessionKey },
    data: {
      visitorName: data.name || undefined,
      visitorEmail: data.email || undefined,
      visitorPhone: data.phone || undefined
    }
  });
}

export async function getSessionMessages(sessionKey: string): Promise<ChatMessage[]> {
  const session = await prisma.chatSession.findUnique({
    where: { sessionKey },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!session) {
    return [];
  }

  return session.messages.map(m => ({
    id: m.id,
    sessionId: m.sessionId,
    direction: m.direction as 'visitor' | 'agent',
    content: m.content,
    createdAt: m.createdAt
  }));
}

export async function getAllSessions(status?: 'open' | 'closed'): Promise<ChatSession[]> {
  const sessions = await prisma.chatSession.findMany({
    where: status ? { status } : undefined,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  return sessions.map(s => ({
    id: s.id,
    sessionKey: s.sessionKey,
    visitorName: s.visitorName || undefined,
    visitorEmail: s.visitorEmail || undefined,
    visitorPhone: s.visitorPhone || undefined,
    status: s.status as 'open' | 'closed',
    lastMessageAt: s.lastMessageAt || undefined,
    createdAt: s.createdAt
  }));
}

// ===============================
// MESSAGES
// ===============================

export async function addVisitorMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  try {
    // Získaj alebo vytvor session
    const session = await getOrCreateSession(request.sessionKey);

    // Aktualizuj profil ak je poskytnutý
    if (request.name || request.email || request.phone) {
      await updateSessionProfile(request.sessionKey, {
        name: request.name,
        email: request.email,
        phone: request.phone
      });
    }

    // Vytvor správu
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        direction: 'visitor',
        content: request.message
      }
    });

    // Aktualizuj lastMessageAt
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date() }
    });

    // Odoslať email notifikáciu
    await sendEmailNotification(session, request.message, {
      name: request.name,
      email: request.email,
      phone: request.phone
    });

    return {
      success: true,
      sessionKey: request.sessionKey,
      messageId: message.id
    };
  } catch (error) {
    console.error('Failed to add visitor message:', error);
    return {
      success: false,
      sessionKey: request.sessionKey,
      error: 'Nepodarilo sa odoslať správu'
    };
  }
}

export async function addAgentMessage(sessionKey: string, content: string): Promise<SendMessageResponse> {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { sessionKey }
    });

    if (!session) {
      return {
        success: false,
        sessionKey,
        error: 'Relácia neexistuje'
      };
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        direction: 'agent',
        content
      }
    });

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date() }
    });

    return {
      success: true,
      sessionKey,
      messageId: message.id
    };
  } catch (error) {
    console.error('Failed to add agent message:', error);
    return {
      success: false,
      sessionKey,
      error: 'Nepodarilo sa odoslať správu'
    };
  }
}

// ===============================
// EMAIL NOTIFICATIONS
// ===============================

async function sendEmailNotification(
  session: ChatSession,
  message: string,
  visitor: { name?: string; email?: string; phone?: string }
): Promise<void> {
  const settings = await getChatSettings();

  if (!settings.adminEmail) {
    return;
  }

  // TODO: Implementovať skutočné odosielanie emailu cez SMTP
  // Pre teraz notifikácia nie je odoslaná - správy sú uložené v DB
  // a admin ich vidí v admin paneli
  void session;
  void message;
  void visitor;
}

// ===============================
// CLOSE SESSION
// ===============================

export async function closeSession(sessionKey: string): Promise<boolean> {
  try {
    await prisma.chatSession.update({
      where: { sessionKey },
      data: { status: 'closed' }
    });
    return true;
  } catch {
    return false;
  }
}
