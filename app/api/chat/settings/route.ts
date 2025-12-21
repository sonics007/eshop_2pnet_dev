import { NextResponse } from 'next/server';
import { getChatSettings, saveChatSettings } from '@/lib/modules/chat/service';
import type { ChatSettings } from '@/lib/modules/chat';
import { withAdminAuth } from '@/lib/auth/middleware';

/**
 * GET /api/chat/settings
 *
 * Získanie nastavení chat modulu
 */
export async function GET() {
  try {
    const settings = await getChatSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get chat settings:', error);
    return NextResponse.json(
      { error: 'Chyba pri načítaní nastavení' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/settings
 *
 * Uloženie nastavení chat modulu
 */
export async function POST(request: Request) {
  return withAdminAuth(async () => {
    try {
      const payload = (await request.json()) as Partial<ChatSettings>;
      const updated = await saveChatSettings(payload);
      return NextResponse.json({ success: true, settings: updated });
    } catch (error) {
      console.error('Failed to save chat settings:', error);
      return NextResponse.json(
        { success: false, error: 'Chyba pri ukladaní nastavení' },
        { status: 500 }
      );
    }
  });
}
