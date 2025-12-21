/**
 * API: Analytics Tracking
 *
 * Endpoint pre zaznamenávanie návštevníckych dát
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createOrGetSession,
  trackPageView,
  trackEvent,
  updatePageTime,
  endSession
} from '@/lib/modules/analytics';

// Získa krajinu z IP adresy (jednoduchá implementácia)
async function getGeoFromIP(ip: string): Promise<{ country?: string; countryName?: string; city?: string }> {
  try {
    // Použijeme free geo IP službu
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city`, {
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.countryCode,
        countryName: data.country,
        city: data.city
      };
    }
  } catch {
    // Ticho zlyhaj - geolokácia nie je kritická
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Získaj IP adresu
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    switch (type) {
      case 'session': {
        // Získaj geolokáciu ak nie je poskytnutá
        let geoData = {};
        if (!data.country && ip !== '127.0.0.1' && !ip.startsWith('192.168') && !ip.startsWith('10.')) {
          geoData = await getGeoFromIP(ip);
        }

        const sessionId = await createOrGetSession({
          ...data,
          ...geoData
        });

        return NextResponse.json({ success: true, sessionId });
      }

      case 'pageview': {
        await trackPageView(data);
        return NextResponse.json({ success: true });
      }

      case 'event': {
        await trackEvent(data);
        return NextResponse.json({ success: true });
      }

      case 'pagetime': {
        await updatePageTime(data.sessionId, data.path, data.timeOnPage, data.scrollDepth);
        return NextResponse.json({ success: true });
      }

      case 'endsession': {
        await endSession(data.sessionId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Neznámy typ' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Vrátime success aj pri chybe - nechceme blokovať používateľa
    return NextResponse.json({ success: true });
  }
}
