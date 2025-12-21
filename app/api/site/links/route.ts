import { NextResponse } from 'next/server';
import {
  readLinkSettings,
  writeLinkSettings,
  type LinkSettings
} from '@/lib/modules/site/pages/links';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

/**
 * GET /api/site/links
 * Načíta nastavenia linkov (verejné)
 */
export async function GET() {
  try {
    const settings = await readLinkSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading link settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read link settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/site/links
 * Zapíše nastavenia linkov - vyžaduje admin autentifikáciu
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const payload = await request.json() as Partial<LinkSettings>;
    const updated = await writeLinkSettings(payload);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error writing link settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to write link settings' },
      { status: 500 }
    );
  }
}
