/**
 * API: Analytics Dashboard
 *
 * Endpoint pre získanie dashboard štatistík
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardOverview,
  getTopProducts,
  getCountryStats,
  getDeviceStats,
  getTrafficSources,
  getConversionFunnel,
  getTopSearches,
  getRealTimeData,
  type TimeRange
} from '@/lib/modules/analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section') || 'overview';
    const range = (searchParams.get('range') || '30days') as TimeRange;
    const limit = parseInt(searchParams.get('limit') || '10');

    let data;

    switch (section) {
      case 'overview':
        data = await getDashboardOverview();
        break;

      case 'products':
        data = await getTopProducts(range, limit);
        break;

      case 'countries':
        data = await getCountryStats(range);
        break;

      case 'devices':
        data = await getDeviceStats(range);
        break;

      case 'sources':
        data = await getTrafficSources(range);
        break;

      case 'funnel':
        data = await getConversionFunnel(range);
        break;

      case 'searches':
        data = await getTopSearches(range, limit);
        break;

      case 'realtime':
        data = await getRealTimeData();
        break;

      case 'all':
        // Vráť všetko pre dashboard
        const [overview, products, countries, devices, sources, funnel, searches] = await Promise.all([
          getDashboardOverview(),
          getTopProducts(range, 10),
          getCountryStats(range),
          getDeviceStats(range),
          getTrafficSources(range),
          getConversionFunnel(range),
          getTopSearches(range, 10)
        ]);

        data = {
          overview,
          products,
          countries,
          devices,
          sources,
          funnel,
          searches
        };
        break;

      default:
        return NextResponse.json({ success: false, error: 'Neznáma sekcia' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Nepodarilo sa načítať štatistiky' }, { status: 500 });
  }
}
