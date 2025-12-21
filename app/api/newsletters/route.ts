import { NextResponse } from 'next/server';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';
import {
  addNewsletter,
  deleteNewsletter,
  readNewsletters,
  updateNewsletter
} from '@/lib/modules/newsletters/service';

export async function GET() {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');
  const data = await readNewsletters();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  const payload = await request.json();
  if (!payload?.subject || !payload?.html) {
    return NextResponse.json({ success: false, error: 'Chýba subject alebo obsah' }, { status: 400 });
  }

  try {
    const created = await addNewsletter({
      title: payload.title || payload.subject,
      subject: payload.subject,
      html: payload.html,
      pdfUrl: payload.pdfUrl,
      fromEmail: payload.fromEmail,
      audience: payload.audience || 'customers',
      emails: Array.isArray(payload.emails) ? payload.emails : [],
      createdBy: admin.email
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Newsletter create error', error);
    return NextResponse.json({ success: false, error: 'Uloženie zlyhalo' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  const payload = await request.json();
  if (!payload?.id) {
    return NextResponse.json({ success: false, error: 'Chýba ID' }, { status: 400 });
  }
  try {
    const updated = await updateNewsletter(payload.id, {
      title: payload.title,
      subject: payload.subject,
      html: payload.html,
      pdfUrl: payload.pdfUrl,
      fromEmail: payload.fromEmail,
      audience: payload.audience,
      emails: Array.isArray(payload.emails) ? payload.emails : undefined
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Newsletter update error', error);
    return NextResponse.json({ success: false, error: 'Uloženie zlyhalo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');
  const payload = await request.json();
  if (!payload?.id) {
    return NextResponse.json({ success: false, error: 'Chýba ID' }, { status: 400 });
  }
  try {
    const result = await deleteNewsletter(payload.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Newsletter delete error', error);
    return NextResponse.json({ success: false, error: 'Vymazanie zlyhalo' }, { status: 500 });
  }
}
