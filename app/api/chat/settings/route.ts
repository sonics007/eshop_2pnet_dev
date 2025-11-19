import { NextResponse } from 'next/server';
import { readChatSettings, writeChatSettings, type ChatSettings } from '@/lib/chatSettings';

export async function GET() {
  const settings = await readChatSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ChatSettings;
  await writeChatSettings(payload);
  return NextResponse.json({ success: true });
}
