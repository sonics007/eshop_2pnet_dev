import { NextResponse } from 'next/server';
import { readFlexibeeSettings, writeFlexibeeSettings } from '@/lib/flexibeeSettings';

export async function GET() {
  const settings = await readFlexibeeSettings();
  return NextResponse.json({
    url: settings.url,
    company: settings.company,
    username: settings.username,
    password: settings.password ? '••••••••' : ''
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; company?: string; username?: string; password?: string };
  const nextSettings = {
    url: body.url?.trim() ?? '',
    company: body.company?.trim() ?? '',
    username: body.username?.trim() ?? '',
    password: body.password?.trim() ?? ''
  };
  await writeFlexibeeSettings(nextSettings);
  return NextResponse.json({ success: true });
}
