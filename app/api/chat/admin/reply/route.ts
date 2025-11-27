import { NextResponse } from 'next/server';
import { addAgentMessage } from '@/lib/modules/chat/service';

/**
 * POST /api/chat/admin/reply
 *
 * Odoslanie odpovede od admina do chat relácie
 */
export async function POST(request: Request) {
  try {
    const { sessionKey, message } = await request.json();

    if (!sessionKey) {
      return NextResponse.json(
        { success: false, error: 'Chýba session key' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Správa je prázdna' },
        { status: 400 }
      );
    }

    const result = await addAgentMessage(sessionKey, message);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
