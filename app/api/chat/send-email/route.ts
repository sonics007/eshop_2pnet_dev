import { NextResponse } from 'next/server';
import { addVisitorMessage } from '@/lib/modules/chat/service';
import type { SendMessageRequest } from '@/lib/modules/chat';

/**
 * POST /api/chat/send-email
 *
 * Odoslanie správy od návštevníka cez interný chat.
 * Uloží správu do DB a odošle email notifikáciu adminovi.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const messageRequest: SendMessageRequest = {
      sessionKey: payload.sessionKey,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message
    };

    // Validácia
    if (!messageRequest.sessionKey) {
      return NextResponse.json(
        { success: false, error: 'Chýba session key' },
        { status: 400 }
      );
    }

    if (!messageRequest.message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Správa je prázdna' },
        { status: 400 }
      );
    }

    // Spracovanie správy
    const result = await addVisitorMessage(messageRequest);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionKey: result.sessionKey,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Chat send-email error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba servera' },
      { status: 500 }
    );
  }
}
