/**
 * SEO Audit API
 */

import { NextResponse } from 'next/server';
import { runSeoAudit } from '@/lib/modules/seo';

export async function GET() {
  try {
    const result = await runSeoAudit();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error running SEO audit:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa spustiť SEO audit' },
      { status: 500 }
    );
  }
}
