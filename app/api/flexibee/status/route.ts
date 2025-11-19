import { NextResponse } from 'next/server';
import { readFlexibeeSettings } from '@/lib/flexibeeSettings';
import { isFlexibeeConfigured } from '@/lib/flexibee';

export async function GET() {
  const envConfig = {
    url: process.env.FLEXIBEE_URL?.trim() ?? '',
    company: process.env.FLEXIBEE_COMPANY?.trim() ?? '',
    username: process.env.FLEXIBEE_USERNAME?.trim() ?? '',
    password: process.env.FLEXIBEE_PASSWORD?.trim() ?? ''
  };
  const stored = await readFlexibeeSettings();
  const missing: string[] = [];
  if (!(envConfig.url || stored.url)) missing.push('FLEXIBEE_URL');
  if (!(envConfig.company || stored.company)) missing.push('FLEXIBEE_COMPANY');
  if (!(envConfig.username || stored.username)) missing.push('FLEXIBEE_USERNAME');
  if (!(envConfig.password || stored.password)) missing.push('FLEXIBEE_PASSWORD');

  return NextResponse.json({
    configured: missing.length === 0 && (await isFlexibeeConfigured()),
    missing
  });
}
