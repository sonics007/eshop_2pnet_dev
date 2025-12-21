import { NextResponse } from 'next/server';
import {
  readVisualSettings,
  writeVisualSettings,
  type VisualSettings
} from '@/lib/modules/site/pages/visual';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

/**
 * GET /api/site/visual
 * Načíta vizuálne nastavenia (verejné - potrebné pre frontend)
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
 * Zapíše vizuálne nastavenia - vyžaduje admin autentifikáciu
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

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
