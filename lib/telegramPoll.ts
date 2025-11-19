import { readChatSettings } from '@/lib/chatSettings';
import { addChatMessage } from '@/lib/chatSessions';
import { readConfig, writeConfig } from '@/lib/configStore';
import { prisma } from '@/lib/prisma';

const OFFSET_KEY = 'telegram-update-offset';
const sessionKeyRegex = /\[CS:([^\]]+)\]/i;
const replyCommandRegex = /^\/(?:reply|odpoved)\s+(\S+)\s+([\s\S]+)/i;

type TelegramChat = {
  id: number | string;
  title?: string;
  username?: string;
  type?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  caption?: string;
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  chat: TelegramChat;
  reply_to_message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type ParsedTelegramMessage = {
  sessionKey: string;
  content: string;
};

export type TelegramPollResult = {
  processed: number;
  nextOffset: number;
};

function normalizeId(value?: number | string | null) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function extractSessionKey(source?: string | null) {
  if (!source) return null;
  const match = source.match(sessionKeyRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function parseFromReply(message: TelegramMessage): ParsedTelegramMessage | null {
  if (!message.reply_to_message) return null;
  const targetKey = extractSessionKey(
    message.reply_to_message.text ?? message.reply_to_message.caption ?? ''
  );
  if (!targetKey) return null;
  const content = (message.text ?? message.caption ?? '').trim();
  if (!content) return null;
  return { sessionKey: targetKey, content };
}

function parseFromCommand(text: string): ParsedTelegramMessage | null {
  const match = text.match(replyCommandRegex);
  if (!match) return null;
  const [, key, rest] = match;
  const content = rest.trim();
  if (!content) return null;
  return { sessionKey: key.trim(), content };
}

function parseFromInline(text: string): ParsedTelegramMessage | null {
  const key = extractSessionKey(text);
  if (!key) return null;
  const content = text.replace(sessionKeyRegex, '').trim();
  if (!content) return null;
  return { sessionKey: key, content };
}

function parseMessagePayload(message: TelegramMessage): ParsedTelegramMessage | null {
  const text = (message.text ?? message.caption ?? '').trim();
  if (!text) return null;
  return parseFromReply(message) ?? parseFromCommand(text) ?? parseFromInline(text);
}

async function readOffset() {
  const stored = await readConfig<number>(OFFSET_KEY, 0);
  return Number.isFinite(stored) ? stored : 0;
}

async function saveOffset(value: number) {
  await writeConfig<number>(OFFSET_KEY, value);
}

export async function pollTelegramUpdates(): Promise<TelegramPollResult> {
  const settings = await readChatSettings();
  const token = settings.telegramBotToken?.trim();
  const allowedChats = [settings.telegramGroupId, settings.telegramChatId]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean);

  const currentOffset = await readOffset();

  if (!token || allowedChats.length === 0) {
    return { processed: 0, nextOffset: currentOffset };
  }

  const body: Record<string, unknown> = { allowed_updates: ['message'] };
  if (currentOffset > 0) {
    body.offset = currentOffset;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    const reason = data?.description || response.statusText || 'getUpdates failed.';
    throw new Error(`Telegram getUpdates error: ${reason}`);
  }

  const updates: TelegramUpdate[] = Array.isArray(data?.result) ? data.result : [];
  if (updates.length === 0) {
    return { processed: 0, nextOffset: currentOffset };
  }

  let processed = 0;
  let maxUpdateId = 0;

  for (const update of updates) {
    maxUpdateId = Math.max(maxUpdateId, update.update_id);
    const message = update.message;
    if (!message) continue;
    const chatId = normalizeId(message.chat?.id);
    if (!chatId || !allowedChats.includes(chatId)) {
      continue;
    }

    const parsed = parseMessagePayload(message);
    if (!parsed) continue;

    const session = await prisma.chatSession.findUnique({
      where: { sessionKey: parsed.sessionKey }
    });
    if (!session) continue;

    await addChatMessage(session.id, 'agent', parsed.content, {
      telegramMessageId: String(message.message_id),
      telegramUpdateId: String(update.update_id)
    });
    processed += 1;
  }

  const nextOffset = maxUpdateId > 0 ? maxUpdateId + 1 : currentOffset;
  if (nextOffset !== currentOffset) {
    await saveOffset(nextOffset);
  }

  return { processed, nextOffset };
}
