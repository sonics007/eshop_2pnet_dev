import { NextResponse } from 'next/server';
import { getSessionMessages, getOrCreateSession } from '@/lib/modules/chat/service';

/**
 * GET /api/chat/session/[sessionKey]/messages
 *
 * Získanie histórie správ pre danú session
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionKey: string }> }
) {
  try {
    const { sessionKey } = await params;

    if (!sessionKey) {
      return NextResponse.json({ session: null, messages: [] });
    }

    // Získaj alebo vytvor session
    const session = await getOrCreateSession(sessionKey);

    // Získaj správy
    const messages = await getSessionMessages(sessionKey);

    return NextResponse.json({
      session: {
        sessionKey: session.sessionKey,
        status: session.status,
        visitorName: session.visitorName
      },
      messages: messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        content: message.content,
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    console.error('Failed to get session messages:', error);
    return NextResponse.json(
      { session: null, messages: [], error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
