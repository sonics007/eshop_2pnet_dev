import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import {
  readEmailSettings,
  writeEmailSettings,
  type EmailSettings
} from '@/lib/modules/email';

/**
 * GET /api/email/settings
 * Načíta email nastavenia (len pre admin)
 */
export async function GET() {
  return withAdminAuth(async () => {
    try {
      const settings = await readEmailSettings();
      return NextResponse.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error reading email settings:', error);
      return NextResponse.json(
        { success: false, error: 'Chyba pri načítaní nastavení' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/email/settings
 * Uloží email nastavenia (len pre admin)
 */
export async function POST(request: Request) {
  return withAdminAuth(async () => {
    try {
      const payload = (await request.json()) as Partial<EmailSettings>;
      const updated = await writeEmailSettings(payload);
      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error writing email settings:', error);
      return NextResponse.json(
        { success: false, error: 'Chyba pri ukladaní nastavení' },
        { status: 500 }
      );
    }
  });
}
