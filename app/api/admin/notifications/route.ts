import { NextResponse } from 'next/server';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';
import { addAdminNotification, getAdminNotifications } from '@/lib/adminNotificationsStore';
import { broadcastAdminNotification } from '@/lib/adminNotificationsStream';

export async function GET() {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  try {
    const data = await getAdminNotifications();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to read admin notifications', error);
    return NextResponse.json({ success: false, error: 'Nepodarilo sa načítať notifikácie' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  try {
    const { message, type } = (await request.json()) as { message?: string; type?: 'success' | 'error' | 'info' };
    if (!message) {
      return NextResponse.json({ success: false, error: 'Chýba message' }, { status: 400 });
    }
    const data = await addAdminNotification(message, type ?? 'info');
    const latest = data[0];
    if (latest) {
      broadcastAdminNotification(latest);
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to store admin notification', error);
    return NextResponse.json({ success: false, error: 'Uloženie zlyhalo' }, { status: 500 });
  }
}
