import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/modules/chat/service';

/**
 * GET /api/chat/admin/sessions
 *
 * Získanie všetkých chat relácií pre admin panel
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'open' | 'closed' | null;

    const sessions = await getAllSessions(status || undefined);

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera', sessions: [] },
      { status: 500 }
    );
  }
}
