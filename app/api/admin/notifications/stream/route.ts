import { NextResponse } from 'next/server';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';
import { registerAdminSubscriber } from '@/lib/adminNotificationsStream';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  const stream = new ReadableStream({
    start(controller) {
      // odoslať úvodný ping
      controller.enqueue(new TextEncoder().encode(': connected\n\n'));
      const { remove } = registerAdminSubscriber(controller, req.signal);
      req.signal.addEventListener('abort', remove, { once: true });
    },
    cancel() {
      // close handled by registerAdminSubscriber via abort
    }
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    }
  });
}
