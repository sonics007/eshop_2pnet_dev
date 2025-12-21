import { NextResponse } from 'next/server';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';
import { sendNewsletter } from '@/lib/modules/newsletters/service';

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ success: false, error: 'Chýba ID newslettera' }, { status: 400 });
  }

  try {
    const result = await sendNewsletter(id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Newsletter send error', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Odoslanie zlyhalo' }, { status: 500 });
  }
}
