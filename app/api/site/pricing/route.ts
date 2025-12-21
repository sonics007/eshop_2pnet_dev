/**
 * API: Pricing Settings (konverzný kurz EUR → CZK)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPricingSettings, savePricingSettings } from '@/lib/modules/site/pages/pricing';

export async function GET() {
  try {
    const settings = await getPricingSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Failed to get pricing settings:', error);
    return NextResponse.json({ success: false, error: 'Nepodarilo sa načítať nastavenia' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validácia
    if (body.eurToCzkRate !== undefined) {
      const rate = Number(body.eurToCzkRate);
      if (isNaN(rate) || rate <= 0) {
        return NextResponse.json({ success: false, error: 'Neplatný konverzný kurz' }, { status: 400 });
      }
      body.eurToCzkRate = rate;
    }

    if (body.roundTo !== undefined) {
      const roundTo = Number(body.roundTo);
      if (isNaN(roundTo) || roundTo < 0) {
        return NextResponse.json({ success: false, error: 'Neplatná hodnota zaokrúhľovania' }, { status: 400 });
      }
      body.roundTo = roundTo;
    }

    const updated = await savePricingSettings(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to save pricing settings:', error);
    return NextResponse.json({ success: false, error: 'Nepodarilo sa uložiť nastavenia' }, { status: 500 });
  }
}
