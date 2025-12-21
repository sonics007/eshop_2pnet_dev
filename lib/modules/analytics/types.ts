/**
 * ANALYTICS MODULE - Types
 *
 * Typy pre analytiku a štatistiky eshopu
 */

// ==================== SESSION & TRACKING ====================

export interface SessionData {
  sessionId: string;
  visitorId?: string;
  userId?: number;
  country?: string;
  countryName?: string;
  city?: string;
  region?: string;
  userAgent?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface PageViewData {
  sessionId: string;
  path: string;
  title?: string;
  pageType?: 'home' | 'product' | 'category' | 'cart' | 'checkout' | 'account' | 'other';
  productId?: number;
  productSlug?: string;
  productName?: string;
  categoryId?: number;
  timeOnPage?: number;
  scrollDepth?: number;
}

export interface AnalyticsEventData {
  sessionId: string;
  eventType: EventType;
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

export type EventType =
  | 'view_product'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'update_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'
  | 'search'
  | 'click'
  | 'scroll'
  | 'video_play'
  | 'share'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'login'
  | 'signup';

// ==================== DASHBOARD STATS ====================

export interface DashboardOverview {
  // Dnešné štatistiky
  today: {
    sessions: number;
    pageViews: number;
    uniqueVisitors: number;
    avgSessionTime: number;
    bounceRate: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  };
  // Porovnanie s včerajškom (v %)
  comparison: {
    sessions: number;
    pageViews: number;
    uniqueVisitors: number;
    purchases: number;
    revenue: number;
  };
  // Aktuálne aktívni používatelia
  activeNow: number;
}

export interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

export interface CountryStats {
  country: string;
  countryName: string;
  sessions: number;
  percentage: number;
  revenue: number;
}

export interface DeviceStats {
  device: string;
  sessions: number;
  percentage: number;
}

export interface HourlyStats {
  hour: number;
  sessions: number;
  pageViews: number;
}

// ==================== PRODUCT ANALYTICS ====================

export interface TopProduct {
  productId: number;
  productSlug: string;
  productName: string;
  views: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number; // views -> purchases
  cartRate: number; // views -> add_to_cart
}

export interface ProductPerformance {
  productId: number;
  productSlug: string;
  productName: string;
  period: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  addToCart: number;
  purchases: number;
  revenue: number;
}

// ==================== CONVERSION FUNNEL ====================

export interface ConversionFunnel {
  period: string;
  steps: {
    name: string;
    count: number;
    percentage: number;
    dropoff: number;
  }[];
}

// ==================== SEARCH ANALYTICS ====================

export interface SearchTerm {
  query: string;
  count: number;
  avgResults: number;
  clickRate: number;
}

// ==================== TIME RANGE ====================

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | '90days' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// ==================== REAL-TIME ====================

export interface RealTimeData {
  activeVisitors: number;
  pageViewsLastMinute: number;
  topPages: { path: string; count: number }[];
  recentEvents: {
    type: EventType;
    productName?: string;
    timestamp: Date;
  }[];
}
