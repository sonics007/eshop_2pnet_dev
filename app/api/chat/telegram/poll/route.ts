import { NextResponse } from 'next/server';
import { pollTelegramUpdates } from '@/lib/telegramPoll';

export async function GET() {
  try {
    const result = await pollTelegramUpdates();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Telegram poll failed', error);
    return NextResponse.json(
      { processed: 0, message: error instanceof Error ? error.message : 'getUpdates failed.' },
      { status: 500 }
    );
  }
}
