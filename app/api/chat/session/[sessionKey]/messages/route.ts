import { NextResponse } from 'next/server';
import { getSessionMessages } from '@/lib/chatSessions';

export async function GET(_request: Request, { params }: { params: { sessionKey: string } }) {
  const session = await getSessionMessages(params.sessionKey);
  if (!session) {
    return NextResponse.json({ session: null, messages: [] });
  }
  return NextResponse.json({
    session: {
      sessionKey: session.sessionKey,
      status: session.status,
      visitorName: session.visitorName
    },
    messages: session.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      content: message.content,
      createdAt: message.createdAt
    }))
  });
}
