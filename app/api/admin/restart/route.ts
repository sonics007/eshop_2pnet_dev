import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/middleware';

/**
 * POST /api/admin/restart
 * Dev-only helper: vráti správu, v produkcii by mal reštart riadiť process manager.
 */
export async function POST() {
  return withAdminAuth(async () => {
    // Nevoláme process.exit v dev, aby sme neodpojili používateľa bez kontroly.
    return NextResponse.json({
      success: true,
      message: 'Reštart požadovaný. Ak bežíte v dev, prosím ručne reštartujte server (npm run dev).'
    });
  });
}
