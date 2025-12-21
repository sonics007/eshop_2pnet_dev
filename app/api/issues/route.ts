import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/jwt';
import { createIssue, listIssues } from '@/lib/modules/issues/service';
import type { IssueCreateInput } from '@/lib/modules/issues/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await listIssues();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Issues list error:', error);
    const message = error instanceof Error ? error.message : 'Nepodarilo sa načítať zoznam chýb.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdminAccess();
  try {
    const payload = (await request.json()) as IssueCreateInput;
    if (!payload.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Názov je povinný.' }, { status: 400 });
    }
    const createdBy = admin?.email || 'guest';
    const issue = await createIssue(payload, createdBy);
    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    console.error('Create issue error:', error);
    const message = error instanceof Error ? error.message : 'Chyba pri vytváraní hlásenia.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
