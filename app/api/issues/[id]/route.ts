import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/jwt';
import { updateIssue } from '@/lib/modules/issues/service';
import type { IssueUpdateInput } from '@/lib/modules/issues/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await verifyAdminAccess();
  try {
    const updates = (await request.json()) as IssueUpdateInput;
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const pathId = segments[segments.length - 1];
    const idRaw = (await params)?.id ?? pathId ?? '';
    const id = parseInt(idRaw, 10);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Neplatné ID' }, { status: 400 });
    }
    const issue = await updateIssue(id, updates, admin?.email || 'system');
    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    console.error('Update issue error:', error);
    const message = error instanceof Error ? error.message : 'Chyba pri úprave hlásenia.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
