import { NextResponse } from 'next/server';
import {
  readVisualSettings,
  writeVisualSettings,
  type VisualSettings
} from '@/lib/modules/site/pages/visual';

/**
 * GET /api/site/visual
 * Načíta vizuálne nastavenia
 */
export async function GET() {
  try {
    const settings = await readVisualSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading visual settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read visual settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/site/visual
 * Zapíše vizuálne nastavenia
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json() as Partial<VisualSettings>;
    const updated = await writeVisualSettings(payload);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error writing visual settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to write visual settings' },
      { status: 500 }
    );
  }
}
