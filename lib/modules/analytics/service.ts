/**
 * ANALYTICS MODULE - Service
 *
 * Služby pre sledovanie a vyhodnocovanie štatistík
 */

import { prisma } from '@/lib/prisma';
import type {
  SessionData,
  PageViewData,
  AnalyticsEventData,
  DashboardOverview,
  TopProduct,
  CountryStats,
  DeviceStats,
  TrafficSource,
  ConversionFunnel,
  SearchTerm,
  RealTimeData,
  TimeRange,
  DateRange
} from './types';

// ==================== HELPER FUNCTIONS ====================

function getDateRange(range: TimeRange, custom?: DateRange): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case '7days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start: weekAgo, end: now };
    }
    case '30days': {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { start: monthAgo, end: now };
    }
    case '90days': {
      const quarterAgo = new Date(today);
      quarterAgo.setDate(quarterAgo.getDate() - 90);
      return { start: quarterAgo, end: now };
    }
    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { start: yearAgo, end: now };
    }
    case 'custom':
      if (custom) return custom;
      return { start: today, end: now };
    default:
      return { start: today, end: now };
  }
}

function parseUserAgent(ua?: string): { browser: string; os: string; device: 'desktop' | 'mobile' | 'tablet' } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'desktop' };

  let browser = 'Unknown';
  let os = 'Unknown';
  let device: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  // Device detection
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) device = 'mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'tablet';

  return { browser, os, device };
}

// ==================== TRACKING FUNCTIONS ====================

/**
 * Vytvorí novú session alebo vráti existujúcu
 */
export async function createOrGetSession(data: SessionData): Promise<number> {
  const { browser, os, device } = parseUserAgent(data.userAgent);

  // Skús nájsť existujúcu session
  const existing = await prisma.analyticsSession.findUnique({
    where: { sessionId: data.sessionId }
  });

  if (existing) {
    // Aktualizuj endedAt
    await prisma.analyticsSession.update({
      where: { id: existing.id },
      data: { updatedAt: new Date() }
    });
    return existing.id;
  }

  // Vytvor novú session
  const session = await prisma.analyticsSession.create({
    data: {
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      userId: data.userId,
      country: data.country,
      countryName: data.countryName,
      city: data.city,
      region: data.region,
      userAgent: data.userAgent,
      device: data.device || device,
      browser: data.browser || browser,
      os: data.os || os,
      screenWidth: data.screenWidth,
      screenHeight: data.screenHeight,
      referrer: data.referrer,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign
    }
  });

  return session.id;
}

/**
 * Zaznamená zobrazenie stránky
 */
export async function trackPageView(data: PageViewData): Promise<void> {
  const session = await prisma.analyticsSession.findUnique({
    where: { sessionId: data.sessionId }
  });

  if (!session) {
    console.warn('Analytics: Session not found for page view:', data.sessionId);
    return;
  }

  await prisma.analyticsPageView.create({
    data: {
      sessionId: session.id,
      path: data.path,
      title: data.title,
      pageType: data.pageType,
      productId: data.productId,
      productSlug: data.productSlug,
      productName: data.productName,
      categoryId: data.categoryId,
      timeOnPage: data.timeOnPage,
      scrollDepth: data.scrollDepth
    }
  });

  // Aktualizuj produktovú štatistiku ak je produktová stránka
  if (data.productId && data.productSlug) {
    await updateProductStat(data.productId, data.productSlug, data.productName || '', 'view');
  }
}

/**
 * Zaznamená udalosť
 */
export async function trackEvent(data: AnalyticsEventData): Promise<void> {
  const session = await prisma.analyticsSession.findUnique({
    where: { sessionId: data.sessionId }
  });

  if (!session) {
    console.warn('Analytics: Session not found for event:', data.sessionId);
    return;
  }

  await prisma.analyticsEvent.create({
    data: {
      sessionId: session.id,
      eventType: data.eventType,
      productId: data.productId,
      productSlug: data.productSlug,
      productName: data.productName,
      productPrice: data.productPrice,
      quantity: data.quantity,
      orderId: data.orderId,
      orderTotal: data.orderTotal,
      searchQuery: data.searchQuery,
      searchResults: data.searchResults,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });

  // Aktualizuj produktovú štatistiku
  if (data.productId && data.productSlug) {
    if (data.eventType === 'add_to_cart') {
      await updateProductStat(data.productId, data.productSlug, data.productName || '', 'addToCart');
    } else if (data.eventType === 'purchase') {
      await updateProductStat(
        data.productId,
        data.productSlug,
        data.productName || '',
        'purchase',
        (data.productPrice || 0) * (data.quantity || 1)
      );
    }
  }

  // Zaznamená hľadanie
  if (data.eventType === 'search' && data.searchQuery) {
    await prisma.analyticsSearch.create({
      data: {
        query: data.searchQuery,
        resultsCount: data.searchResults || 0,
        sessionId: session.id
      }
    });
  }
}

/**
 * Aktualizuje čas na stránke
 */
export async function updatePageTime(
  sessionId: string,
  path: string,
  timeOnPage: number,
  scrollDepth?: number
): Promise<void> {
  const session = await prisma.analyticsSession.findUnique({
    where: { sessionId }
  });

  if (!session) return;

  // Nájdi posledné zobrazenie tejto stránky
  const pageView = await prisma.analyticsPageView.findFirst({
    where: {
      sessionId: session.id,
      path
    },
    orderBy: { createdAt: 'desc' }
  });

  if (pageView) {
    await prisma.analyticsPageView.update({
      where: { id: pageView.id },
      data: {
        exitedAt: new Date(),
        timeOnPage,
        scrollDepth: scrollDepth ?? pageView.scrollDepth
      }
    });
  }
}

/**
 * Ukončí session
 */
export async function endSession(sessionId: string): Promise<void> {
  const session = await prisma.analyticsSession.findUnique({
    where: { sessionId }
  });

  if (!session) return;

  const duration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);

  await prisma.analyticsSession.update({
    where: { id: session.id },
    data: {
      endedAt: new Date(),
      duration
    }
  });
}

// ==================== PRODUCT STATS ====================

async function updateProductStat(
  productId: number,
  productSlug: string,
  productName: string,
  action: 'view' | 'addToCart' | 'purchase',
  revenue?: number
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.analyticsProductStat.findUnique({
    where: {
      productId_date: {
        productId,
        date: today
      }
    }
  });

  if (existing) {
    const updateData: Record<string, number> = {};
    if (action === 'view') updateData.views = { increment: 1 } as any;
    if (action === 'addToCart') updateData.addToCart = { increment: 1 } as any;
    if (action === 'purchase') {
      updateData.purchases = { increment: 1 } as any;
      if (revenue) updateData.revenue = { increment: revenue } as any;
    }

    await prisma.analyticsProductStat.update({
      where: { id: existing.id },
      data: updateData
    });
  } else {
    await prisma.analyticsProductStat.create({
      data: {
        productId,
        productSlug,
        productName,
        date: today,
        views: action === 'view' ? 1 : 0,
        addToCart: action === 'addToCart' ? 1 : 0,
        purchases: action === 'purchase' ? 1 : 0,
        revenue: revenue || 0
      }
    });
  }
}

// ==================== DASHBOARD & REPORTS ====================

/**
 * Prehľad pre dashboard
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Dnešné štatistiky
  const todaySessions = await prisma.analyticsSession.count({
    where: { startedAt: { gte: today } }
  });

  const todayPageViews = await prisma.analyticsPageView.count({
    where: { createdAt: { gte: today } }
  });

  const todayVisitors = await prisma.analyticsSession.groupBy({
    by: ['visitorId'],
    where: { startedAt: { gte: today }, visitorId: { not: null } }
  });

  const todayPurchases = await prisma.analyticsEvent.count({
    where: { eventType: 'purchase', createdAt: { gte: today } }
  });

  const todayRevenue = await prisma.analyticsEvent.aggregate({
    where: { eventType: 'purchase', createdAt: { gte: today } },
    _sum: { orderTotal: true }
  });

  const todayAvgDuration = await prisma.analyticsSession.aggregate({
    where: { startedAt: { gte: today }, duration: { not: null } },
    _avg: { duration: true }
  });

  // Bounce rate (sessions s len 1 page view)
  const todayBounceSessions = await prisma.analyticsSession.count({
    where: {
      startedAt: { gte: today },
      pageViews: { none: {} }
    }
  });

  // Včerajšie štatistiky pre porovnanie
  const yesterdaySessions = await prisma.analyticsSession.count({
    where: { startedAt: { gte: yesterday, lt: today } }
  });

  const yesterdayPageViews = await prisma.analyticsPageView.count({
    where: { createdAt: { gte: yesterday, lt: today } }
  });

  const yesterdayVisitors = await prisma.analyticsSession.groupBy({
    by: ['visitorId'],
    where: { startedAt: { gte: yesterday, lt: today }, visitorId: { not: null } }
  });

  const yesterdayPurchases = await prisma.analyticsEvent.count({
    where: { eventType: 'purchase', createdAt: { gte: yesterday, lt: today } }
  });

  const yesterdayRevenue = await prisma.analyticsEvent.aggregate({
    where: { eventType: 'purchase', createdAt: { gte: yesterday, lt: today } },
    _sum: { orderTotal: true }
  });

  // Aktívni používatelia (posledných 5 minút)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const activeNow = await prisma.analyticsSession.count({
    where: { updatedAt: { gte: fiveMinutesAgo } }
  });

  // Pomocná funkcia na výpočet zmeny v %
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    today: {
      sessions: todaySessions,
      pageViews: todayPageViews,
      uniqueVisitors: todayVisitors.length,
      avgSessionTime: Math.round(todayAvgDuration._avg?.duration || 0),
      bounceRate: todaySessions > 0 ? Math.round((todayBounceSessions / todaySessions) * 100) : 0,
      purchases: todayPurchases,
      revenue: todayRevenue._sum?.orderTotal || 0,
      conversionRate: todaySessions > 0 ? Math.round((todayPurchases / todaySessions) * 100 * 100) / 100 : 0
    },
    comparison: {
      sessions: calcChange(todaySessions, yesterdaySessions),
      pageViews: calcChange(todayPageViews, yesterdayPageViews),
      uniqueVisitors: calcChange(todayVisitors.length, yesterdayVisitors.length),
      purchases: calcChange(todayPurchases, yesterdayPurchases),
      revenue: calcChange(todayRevenue._sum?.orderTotal || 0, yesterdayRevenue._sum?.orderTotal || 0)
    },
    activeNow
  };
}

/**
 * Najpopulárnejšie produkty
 */
export async function getTopProducts(range: TimeRange = '30days', limit = 10): Promise<TopProduct[]> {
  const { start, end } = getDateRange(range);

  const stats = await prisma.analyticsProductStat.groupBy({
    by: ['productId', 'productSlug', 'productName'],
    where: { date: { gte: start, lte: end } },
    _sum: {
      views: true,
      addToCart: true,
      purchases: true,
      revenue: true
    },
    orderBy: { _sum: { views: 'desc' } },
    take: limit
  });

  return stats.map((stat) => ({
    productId: stat.productId,
    productSlug: stat.productSlug,
    productName: stat.productName,
    views: stat._sum.views || 0,
    addToCart: stat._sum.addToCart || 0,
    purchases: stat._sum.purchases || 0,
    revenue: stat._sum.revenue || 0,
    conversionRate: stat._sum.views
      ? Math.round((((stat._sum.purchases || 0) / stat._sum.views) * 100) * 100) / 100
      : 0,
    cartRate: stat._sum.views
      ? Math.round((((stat._sum.addToCart || 0) / stat._sum.views) * 100) * 100) / 100
      : 0
  }));
}

/**
 * Štatistiky podľa krajín
 */
export async function getCountryStats(range: TimeRange = '30days'): Promise<CountryStats[]> {
  const { start, end } = getDateRange(range);

  const stats = await prisma.analyticsSession.groupBy({
    by: ['country', 'countryName'],
    where: {
      startedAt: { gte: start, lte: end },
      country: { not: null }
    },
    _count: { id: true }
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);

  // Získaj revenue pre každú krajinu
  const withRevenue = await Promise.all(
    stats.map(async (stat) => {
      const revenue = await prisma.analyticsEvent.aggregate({
        where: {
          eventType: 'purchase',
          createdAt: { gte: start, lte: end },
          session: { country: stat.country }
        },
        _sum: { orderTotal: true }
      });

      return {
        country: stat.country || 'Unknown',
        countryName: stat.countryName || stat.country || 'Unknown',
        sessions: stat._count.id,
        percentage: Math.round((stat._count.id / total) * 100 * 100) / 100,
        revenue: revenue._sum?.orderTotal || 0
      };
    })
  );

  return withRevenue.sort((a, b) => b.sessions - a.sessions);
}

/**
 * Štatistiky podľa zariadení
 */
export async function getDeviceStats(range: TimeRange = '30days'): Promise<DeviceStats[]> {
  const { start, end } = getDateRange(range);

  const stats = await prisma.analyticsSession.groupBy({
    by: ['device'],
    where: { startedAt: { gte: start, lte: end } },
    _count: { id: true }
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);

  return stats.map((stat) => ({
    device: stat.device || 'unknown',
    sessions: stat._count.id,
    percentage: Math.round((stat._count.id / total) * 100 * 100) / 100
  })).sort((a, b) => b.sessions - a.sessions);
}

/**
 * Zdroje návštevnosti
 */
export async function getTrafficSources(range: TimeRange = '30days'): Promise<TrafficSource[]> {
  const { start, end } = getDateRange(range);

  const stats = await prisma.analyticsSession.groupBy({
    by: ['referrer'],
    where: { startedAt: { gte: start, lte: end } },
    _count: { id: true }
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);

  // Kategorizuj zdroje
  const sources: Record<string, number> = {
    direct: 0,
    google: 0,
    facebook: 0,
    instagram: 0,
    other: 0
  };

  stats.forEach((stat) => {
    const ref = (stat.referrer || '').toLowerCase();
    if (!ref || ref === 'null' || ref === 'undefined') {
      sources.direct += stat._count.id;
    } else if (ref.includes('google')) {
      sources.google += stat._count.id;
    } else if (ref.includes('facebook') || ref.includes('fb.')) {
      sources.facebook += stat._count.id;
    } else if (ref.includes('instagram')) {
      sources.instagram += stat._count.id;
    } else {
      sources.other += stat._count.id;
    }
  });

  return Object.entries(sources)
    .map(([source, sessions]) => ({
      source,
      sessions,
      percentage: Math.round((sessions / total) * 100 * 100) / 100
    }))
    .filter((s) => s.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);
}

/**
 * Konverzný lievik
 */
export async function getConversionFunnel(range: TimeRange = '30days'): Promise<ConversionFunnel> {
  const { start, end } = getDateRange(range);

  const sessions = await prisma.analyticsSession.count({
    where: { startedAt: { gte: start, lte: end } }
  });

  const productViews = await prisma.analyticsEvent.count({
    where: { eventType: 'view_product', createdAt: { gte: start, lte: end } }
  });

  const addToCart = await prisma.analyticsEvent.count({
    where: { eventType: 'add_to_cart', createdAt: { gte: start, lte: end } }
  });

  const checkouts = await prisma.analyticsEvent.count({
    where: { eventType: 'begin_checkout', createdAt: { gte: start, lte: end } }
  });

  const purchases = await prisma.analyticsEvent.count({
    where: { eventType: 'purchase', createdAt: { gte: start, lte: end } }
  });

  const steps = [
    { name: 'Návštevy', count: sessions },
    { name: 'Zobrazenie produktu', count: productViews },
    { name: 'Pridanie do košíka', count: addToCart },
    { name: 'Začatie checkout', count: checkouts },
    { name: 'Nákup', count: purchases }
  ];

  const base = steps[0].count || 1;

  return {
    period: range,
    steps: steps.map((step, index) => ({
      name: step.name,
      count: step.count,
      percentage: Math.round((step.count / base) * 100 * 100) / 100,
      dropoff: index > 0
        ? Math.round(((steps[index - 1].count - step.count) / (steps[index - 1].count || 1)) * 100)
        : 0
    }))
  };
}

/**
 * Najpopulárnejšie hľadania
 */
export async function getTopSearches(range: TimeRange = '30days', limit = 20): Promise<SearchTerm[]> {
  const { start, end } = getDateRange(range);

  const searches = await prisma.analyticsSearch.groupBy({
    by: ['query'],
    where: { createdAt: { gte: start, lte: end } },
    _count: { id: true },
    _avg: { resultsCount: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  // Získaj click rate pre každé hľadanie
  return await Promise.all(
    searches.map(async (search) => {
      const clicked = await prisma.analyticsSearch.count({
        where: {
          query: search.query,
          createdAt: { gte: start, lte: end },
          clickedResult: { not: null }
        }
      });

      return {
        query: search.query,
        count: search._count.id,
        avgResults: Math.round(search._avg?.resultsCount || 0),
        clickRate: Math.round((clicked / search._count.id) * 100)
      };
    })
  );
}

/**
 * Real-time dáta
 */
export async function getRealTimeData(): Promise<RealTimeData> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const activeVisitors = await prisma.analyticsSession.count({
    where: { updatedAt: { gte: fiveMinutesAgo } }
  });

  const pageViewsLastMinute = await prisma.analyticsPageView.count({
    where: { createdAt: { gte: oneMinuteAgo } }
  });

  const topPages = await prisma.analyticsPageView.groupBy({
    by: ['path'],
    where: { createdAt: { gte: fiveMinutesAgo } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const recentEvents = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: fiveMinutesAgo } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      eventType: true,
      productName: true,
      createdAt: true
    }
  });

  return {
    activeVisitors,
    pageViewsLastMinute,
    topPages: topPages.map((p) => ({ path: p.path, count: p._count.id })),
    recentEvents: recentEvents.map((e) => ({
      type: e.eventType as any,
      productName: e.productName || undefined,
      timestamp: e.createdAt
    }))
  };
}

/**
 * Denne agregované štatistiky - spúšťa sa cron job
 */
export async function aggregateDailyStats(date?: Date): Promise<void> {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const sessions = await prisma.analyticsSession.count({
    where: { startedAt: { gte: targetDate, lt: nextDay } }
  });

  const uniqueVisitors = await prisma.analyticsSession.groupBy({
    by: ['visitorId'],
    where: { startedAt: { gte: targetDate, lt: nextDay }, visitorId: { not: null } }
  });

  const pageViews = await prisma.analyticsPageView.count({
    where: { createdAt: { gte: targetDate, lt: nextDay } }
  });

  const avgDuration = await prisma.analyticsSession.aggregate({
    where: { startedAt: { gte: targetDate, lt: nextDay }, duration: { not: null } },
    _avg: { duration: true }
  });

  const bounceSessions = await prisma.analyticsSession.count({
    where: {
      startedAt: { gte: targetDate, lt: nextDay },
      pageViews: { none: {} }
    }
  });

  const addToCart = await prisma.analyticsEvent.count({
    where: { eventType: 'add_to_cart', createdAt: { gte: targetDate, lt: nextDay } }
  });

  const checkouts = await prisma.analyticsEvent.count({
    where: { eventType: 'begin_checkout', createdAt: { gte: targetDate, lt: nextDay } }
  });

  const purchases = await prisma.analyticsEvent.count({
    where: { eventType: 'purchase', createdAt: { gte: targetDate, lt: nextDay } }
  });

  const revenue = await prisma.analyticsEvent.aggregate({
    where: { eventType: 'purchase', createdAt: { gte: targetDate, lt: nextDay } },
    _sum: { orderTotal: true }
  });

  // Countries
  const countries = await prisma.analyticsSession.groupBy({
    by: ['country'],
    where: { startedAt: { gte: targetDate, lt: nextDay } },
    _count: { id: true }
  });

  // Devices
  const devices = await prisma.analyticsSession.groupBy({
    by: ['device'],
    where: { startedAt: { gte: targetDate, lt: nextDay } },
    _count: { id: true }
  });

  await prisma.analyticsDailyStat.upsert({
    where: { date: targetDate },
    update: {
      sessions,
      uniqueVisitors: uniqueVisitors.length,
      pageViews,
      avgSessionTime: Math.round(avgDuration._avg?.duration || 0),
      bounceRate: sessions > 0 ? Math.round((bounceSessions / sessions) * 100) : 0,
      addToCart,
      checkouts,
      purchases,
      revenue: revenue._sum?.orderTotal || 0,
      conversionRate: sessions > 0 ? Math.round((purchases / sessions) * 100 * 100) / 100 : 0,
      countriesJson: JSON.stringify(Object.fromEntries(countries.map((c) => [c.country || 'Unknown', c._count.id]))),
      devicesJson: JSON.stringify(Object.fromEntries(devices.map((d) => [d.device || 'unknown', d._count.id])))
    },
    create: {
      date: targetDate,
      sessions,
      uniqueVisitors: uniqueVisitors.length,
      pageViews,
      avgSessionTime: Math.round(avgDuration._avg?.duration || 0),
      bounceRate: sessions > 0 ? Math.round((bounceSessions / sessions) * 100) : 0,
      addToCart,
      checkouts,
      purchases,
      revenue: revenue._sum?.orderTotal || 0,
      conversionRate: sessions > 0 ? Math.round((purchases / sessions) * 100 * 100) / 100 : 0,
      countriesJson: JSON.stringify(Object.fromEntries(countries.map((c) => [c.country || 'Unknown', c._count.id]))),
      devicesJson: JSON.stringify(Object.fromEntries(devices.map((d) => [d.device || 'unknown', d._count.id])))
    }
  });
}
