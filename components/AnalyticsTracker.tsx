'use client';

/**
 * ANALYTICS TRACKER
 *
 * Komponent pre sledovanie návštevníckych dát.
 * Pridajte do layout.tsx pre automatické sledovanie.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Generuje unikátne ID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Získa alebo vytvorí visitor ID (trvalé cookie)
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('_vid');
  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem('_vid', visitorId);
  }
  return visitorId;
}

// Získa alebo vytvorí session ID (session cookie)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('_sid');
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem('_sid', sessionId);
  }
  return sessionId;
}

// Parsuje UTM parametre
function getUtmParams(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source') || undefined,
    utmMedium: searchParams.get('utm_medium') || undefined,
    utmCampaign: searchParams.get('utm_campaign') || undefined
  };
}

// Detekuje typ zariadenia
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Detekuje typ stránky z URL
function getPageType(path: string): string {
  if (path === '/') return 'home';
  if (path.startsWith('/products/') || path.startsWith('/produkty/')) return 'product';
  if (path.startsWith('/category/') || path.startsWith('/kategorie/')) return 'category';
  if (path === '/cart' || path === '/kosik') return 'cart';
  if (path === '/checkout' || path === '/pokladna') return 'checkout';
  if (path.startsWith('/account') || path.startsWith('/ucet')) return 'account';
  if (path.startsWith('/admin')) return 'admin';
  return 'other';
}

// Odošle tracking dáta
async function sendTrack(type: string, data: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
      keepalive: true
    });
  } catch {
    // Ticho zlyhaj
  }
}

interface AnalyticsTrackerProps {
  // Product data pre produktové stránky
  productId?: number;
  productSlug?: string;
  productName?: string;
  categoryId?: number;
}

export function AnalyticsTracker({
  productId,
  productSlug,
  productName,
  categoryId
}: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sessionInitialized = useRef(false);
  const lastPath = useRef<string>('');
  const pageEnteredAt = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);

  // Inicializácia session
  const initSession = useCallback(async () => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const utm = getUtmParams(searchParams);

    await sendTrack('session', {
      sessionId,
      visitorId,
      userAgent: navigator.userAgent,
      device: getDeviceType(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      referrer: document.referrer || undefined,
      ...utm
    });
  }, [searchParams]);

  // Sledovanie page view
  const trackPageView = useCallback(async () => {
    const sessionId = getSessionId();
    const pageType = getPageType(pathname);

    // Nesleduj admin stránky
    if (pageType === 'admin') return;

    await sendTrack('pageview', {
      sessionId,
      path: pathname,
      title: document.title,
      pageType,
      productId,
      productSlug,
      productName,
      categoryId
    });

    pageEnteredAt.current = Date.now();
    maxScrollDepth.current = 0;
    lastPath.current = pathname;
  }, [pathname, productId, productSlug, productName, categoryId]);

  // Sledovanie scroll depth
  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrolled = window.scrollY;
    const depth = Math.round((scrolled / scrollHeight) * 100);
    maxScrollDepth.current = Math.max(maxScrollDepth.current, depth);
  }, []);

  // Odoslanie času na stránke pri odchode
  const sendPageTime = useCallback(() => {
    if (!pageEnteredAt.current || !lastPath.current) return;

    const timeOnPage = Math.round((Date.now() - pageEnteredAt.current) / 1000);
    const sessionId = getSessionId();

    sendTrack('pagetime', {
      sessionId,
      path: lastPath.current,
      timeOnPage,
      scrollDepth: maxScrollDepth.current
    });
  }, []);

  // Ukončenie session
  const endSession = useCallback(() => {
    sendPageTime();
    const sessionId = getSessionId();
    sendTrack('endsession', { sessionId });
  }, [sendPageTime]);

  // Inicializácia
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Sledovanie zmeny stránky
  useEffect(() => {
    // Odošli čas na predchádzajúcej stránke
    if (lastPath.current && lastPath.current !== pathname) {
      sendPageTime();
    }

    // Sleduj novú stránku
    trackPageView();
  }, [pathname, trackPageView, sendPageTime]);

  // Scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Cleanup pri zatvorení stránky
  useEffect(() => {
    const handleBeforeUnload = () => endSession();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendPageTime();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [endSession, sendPageTime]);

  return null;
}

// ==================== HELPER HOOKS ====================

/**
 * Hook pre sledovanie udalostí
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    async (
      eventType: string,
      data?: {
        productId?: number;
        productSlug?: string;
        productName?: string;
        productPrice?: number;
        quantity?: number;
        orderId?: number;
        orderTotal?: number;
        searchQuery?: string;
        searchResults?: number;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const sessionId = getSessionId();

      await sendTrack('event', {
        sessionId,
        eventType,
        ...data
      });
    },
    []
  );

  return { trackEvent };
}

// ==================== WRAPPER COMPONENT ====================

/**
 * Wrapper pre Suspense (searchParams potrebuje Suspense)
 */
import { Suspense } from 'react';

function AnalyticsTrackerInner(props: AnalyticsTrackerProps) {
  return <AnalyticsTracker {...props} />;
}

export function AnalyticsTrackerWrapper(props: AnalyticsTrackerProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner {...props} />
    </Suspense>
  );
}

export default AnalyticsTrackerWrapper;
