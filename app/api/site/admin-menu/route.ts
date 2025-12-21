import { NextResponse } from 'next/server';
import {
  readAdminMenuSettings,
  writeAdminMenuSettings,
  type AdminMenuSettings
} from '@/lib/modules/site/pages/admin-menu';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

/**
 * GET /api/site/admin-menu
 * Načíta nastavenia admin menu
 * - Pre prihlásených adminov: vracia uložené nastavenia
 * - Pre neprihlásených: vracia default nastavenia (bez 401 chyby)
 */
export async function GET() {
  const admin = await isAdminAuthenticated();

  try {
    // Ak nie je prihlásený, vráť default nastavenia
    // Toto zabráni 401 chybám v konzole pred prihlásením
    if (!admin) {
      const { defaultAdminMenuSettings } = await import('@/lib/modules/site/pages/admin-menu/types');
      return NextResponse.json({ success: true, data: defaultAdminMenuSettings });
    }

    const settings = await readAdminMenuSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading admin menu settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read admin menu settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/site/admin-menu
 * Zapíše nastavenia admin menu - vyžaduje admin autentifikáciu
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const payload = await request.json() as Partial<AdminMenuSettings>;
    const updated = await writeAdminMenuSettings(payload);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error writing admin menu settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to write admin menu settings' },
      { status: 500 }
    );
  }
}
