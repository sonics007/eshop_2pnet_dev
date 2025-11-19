import { NextResponse } from 'next/server';
import { readChatSettings } from '@/lib/chatSettings';
import { addChatMessage, getOrCreateChatSession } from '@/lib/chatSessions';
import { prisma } from '@/lib/prisma';

type ChatPayload = {
  sessionKey?: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as ChatPayload;
  if (!payload.message?.trim()) {
    return NextResponse.json({ success: false, message: 'Správa je prázdna.' }, { status: 400 });
  }

  const settings = await readChatSettings();
  if (!settings.messengerPageToken || !settings.messengerRecipientId) {
    return NextResponse.json(
      { success: false, message: 'Messenger nie je nakonfigurovaný.' },
      { status: 400 }
    );
  }

  const session = await getOrCreateChatSession(payload.sessionKey, {
    name: payload.name,
    email: payload.email,
    phone: payload.phone
  });

  const storedMessage = await addChatMessage(session.id, 'visitor', payload.message.trim());
  const prefix = `[CS:${session.sessionKey}]`;
  const senderLabel = payload.name?.trim()?.length ? payload.name.trim() : 'Návštevník';
  const text = [
    `${prefix} Nová správa z e-shop chatu`,
    `Meno: ${senderLabel}`,
    payload.phone ? `Telefón: ${payload.phone}` : '',
    payload.email ? `E-mail: ${payload.email}` : '',
    '---',
    payload.message.trim()
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${settings.messengerPageToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: settings.messengerRecipientId },
          message: { text }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.error) {
      const message = data?.error?.message || response.statusText || 'Messenger API odmietlo požiadavku.';
      console.error('Messenger API error', data);
      return NextResponse.json({ success: false, message }, { status: 502 });
    }

    const messageId = data?.message_id ? String(data.message_id) : undefined;
    if (messageId) {
      await prisma.chatMessage.update({
        where: { id: storedMessage.id },
        data: { telegramMessageId: messageId }
      });
    }

    return NextResponse.json({ success: true, sessionKey: session.sessionKey });
  } catch (error) {
    console.error('Messenger request failed', error);
    return NextResponse.json(
      { success: false, message: 'Nepodarilo sa odoslať správu do Messengeru.' },
      { status: 500 }
    );
  }
}
