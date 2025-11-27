import { NextResponse } from 'next/server';
import {
  readMenuSettings,
  writeMenuSettings,
  type MenuSettings
} from '@/lib/modules/site/pages/menu';

/**
 * GET /api/site/menu
 * Načíta nastavenia menu
 */
export async function GET() {
  try {
    const settings = await readMenuSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading menu settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read menu settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/site/menu
 * Zapíše nastavenia menu
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json() as Partial<MenuSettings>;
    const updated = await writeMenuSettings(payload);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error writing menu settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to write menu settings' },
      { status: 500 }
    );
  }
}
