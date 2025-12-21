/**
 * SEO Global Settings API
 */

import { NextRequest, NextResponse } from 'next/server';
import { readSeoGlobalSettings, writeSeoGlobalSettings } from '@/lib/modules/seo';

export async function GET() {
  try {
    const settings = await readSeoGlobalSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa načítať SEO nastavenia' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await writeSeoGlobalSettings(body);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error saving SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa uložiť SEO nastavenia' },
      { status: 500 }
    );
  }
}
