import { NextResponse } from 'next/server';
import { readAdminMenu, writeAdminMenu } from '@/lib/adminMenuStore';
import type { AdminMenuItem } from '@/lib/adminMenuDefaults';

type AdminMenuPayload = {
  menu: AdminMenuItem[];
};

export async function GET() {
  const menu = await readAdminMenu();
  return NextResponse.json({ menu });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminMenuPayload;
  if (!Array.isArray(payload.menu)) {
    return NextResponse.json({ success: false, message: 'Neplatný formát menu.' }, { status: 400 });
  }
  await writeAdminMenu(payload.menu);
  return NextResponse.json({ success: true });
}
