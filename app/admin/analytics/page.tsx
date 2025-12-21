'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type {
  DashboardOverview,
  TopProduct,
  CountryStats,
  DeviceStats,
  TrafficSource,
  ConversionFunnel,
  SearchTerm,
  RealTimeData,
  TimeRange
} from '@/lib/modules/analytics/types';

type AnalyticsData = {
  overview: DashboardOverview;
  products: TopProduct[];
  countries: CountryStats[];
  devices: DeviceStats[];
  sources: TrafficSource[];
  funnel: ConversionFunnel;
  searches: SearchTerm[];
};

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Dnes' },
  { value: 'yesterday', label: 'Včera' },
  { value: '7days', label: '7 dní' },
  { value: '30days', label: '30 dní' },
  { value: '90days', label: '90 dní' }
];

// Formátovanie čísel
const formatNumber = (num: number) => new Intl.NumberFormat('sk-SK').format(num);
const formatCurrency = (num: number) =>
  new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(num);
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Stat Card komponent
function StatCard({
  title,
  value,
  change,
  format = 'number'
}: {
  title: string;
  value: number;
  change?: number;
  format?: 'number' | 'currency' | 'percent' | 'duration';
}) {
  const formattedValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value}%`;
      case 'duration':
        return formatDuration(value);
      default:
        return formatNumber(value);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{formattedValue()}</p>
      {change !== undefined && (
        <p className={`mt-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change >= 0 ? '+' : ''}
          {change}% oproti včerajšku
        </p>
      )}
    </div>
  );
}

// Progress bar komponent
function ProgressBar({ value, max, label, sublabel }: { value: number; max: number; label: string; sublabel?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-slate-500">{sublabel || formatNumber(value)}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Funnel step komponent
function FunnelStep({
  name,
  count,
  percentage,
  dropoff,
  isLast
}: {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(count)}</p>
        <p className="text-xs text-slate-500">{percentage}% z celku</p>
      </div>
      {!isLast && dropoff > 0 && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
          -{dropoff}%
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [realtime, setRealtime] = useState<RealTimeData | null>(null);
  const [range, setRange] = useState<TimeRange>('30days');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'traffic' | 'funnel'>('overview');

  // Načítaj dáta
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/dashboard?section=all&range=${range}`);
        const payload = await response.json();
        if (payload.success) {
          setData(payload.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [range]);

  // Real-time dáta (každých 30 sekúnd)
  useEffect(() => {
    async function loadRealtime() {
      try {
        const response = await fetch('/api/analytics/dashboard?section=realtime');
        const payload = await response.json();
        if (payload.success) {
          setRealtime(payload.data);
        }
      } catch (error) {
        console.error('Failed to load realtime:', error);
      }
    }

    loadRealtime();
    const interval = setInterval(loadRealtime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <AdminLayout activePanel="admin-analytics">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-500">Načítavam analytiku...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-analytics">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analytika</p>
          <h1 className="text-4xl font-semibold text-slate-900">Štatistiky eshopu</h1>
          <p className="mt-2 text-sm text-slate-500">
            Prehľad návštevnosti, konverzií a produktovej analytiky
          </p>
        </div>

        {/* Real-time indicator */}
        {realtime && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-700">
              {realtime.activeVisitors} aktívnych práve teraz
            </span>
          </div>
        )}
      </div>

      {/* Time range selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {timeRanges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              range === r.value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {[
          { id: 'overview', label: 'Prehľad' },
          { id: 'products', label: 'Produkty' },
          { id: 'traffic', label: 'Návštevnosť' },
          { id: 'funnel', label: 'Konverzie' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Main stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Návštevy"
                  value={data.overview.today.sessions}
                  change={data.overview.comparison.sessions}
                />
                <StatCard
                  title="Zobrazenia stránok"
                  value={data.overview.today.pageViews}
                  change={data.overview.comparison.pageViews}
                />
                <StatCard
                  title="Objednávky"
                  value={data.overview.today.purchases}
                  change={data.overview.comparison.purchases}
                />
                <StatCard
                  title="Tržby"
                  value={data.overview.today.revenue}
                  change={data.overview.comparison.revenue}
                  format="currency"
                />
              </div>

              {/* Secondary stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Unikátni návštevníci" value={data.overview.today.uniqueVisitors} />
                <StatCard title="Priem. čas na stránke" value={data.overview.today.avgSessionTime} format="duration" />
                <StatCard title="Bounce rate" value={data.overview.today.bounceRate} format="percent" />
                <StatCard title="Konverzný pomer" value={data.overview.today.conversionRate} format="percent" />
              </div>

              {/* Top products preview */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Najpopulárnejšie produkty</h2>
                <div className="mt-4 space-y-3">
                  {data.products.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{product.productName}</p>
                        <p className="text-xs text-slate-500">
                          {formatNumber(product.views)} zobrazení · {formatNumber(product.purchases)} nákupov
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Produktová analytika</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-4">#</th>
                        <th className="pb-3 pr-4">Produkt</th>
                        <th className="pb-3 pr-4 text-right">Zobrazenia</th>
                        <th className="pb-3 pr-4 text-right">Do košíka</th>
                        <th className="pb-3 pr-4 text-right">Nákupy</th>
                        <th className="pb-3 pr-4 text-right">Tržby</th>
                        <th className="pb-3 text-right">Konverzia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.map((product, index) => (
                        <tr key={product.productId} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-500">{index + 1}</td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900">{product.productName}</p>
                            <p className="text-xs text-slate-500">{product.productSlug}</p>
                          </td>
                          <td className="py-3 pr-4 text-right font-medium">{formatNumber(product.views)}</td>
                          <td className="py-3 pr-4 text-right">
                            {formatNumber(product.addToCart)}
                            <span className="ml-1 text-xs text-slate-400">({product.cartRate}%)</span>
                          </td>
                          <td className="py-3 pr-4 text-right">{formatNumber(product.purchases)}</td>
                          <td className="py-3 pr-4 text-right font-semibold">{formatCurrency(product.revenue)}</td>
                          <td className="py-3 text-right">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                product.conversionRate >= 3
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : product.conversionRate >= 1
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {product.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Searches */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Čo ľudia hľadajú</h2>
                <div className="mt-4 space-y-3">
                  {data.searches.map((search) => (
                    <div key={search.query} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">&ldquo;{search.query}&rdquo;</p>
                        <p className="text-xs text-slate-500">
                          {formatNumber(search.count)}× hľadané · Ø {search.avgResults} výsledkov
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                        {search.clickRate}% kliknutí
                      </span>
                    </div>
                  ))}
                  {data.searches.length === 0 && (
                    <p className="text-center text-sm text-slate-500">Zatiaľ žiadne hľadania</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRAFFIC TAB */}
          {activeTab === 'traffic' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Countries */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Krajiny</h2>
                <div className="mt-4 space-y-4">
                  {data.countries.slice(0, 10).map((country) => (
                    <ProgressBar
                      key={country.country}
                      label={`${country.countryName} (${country.country})`}
                      value={country.sessions}
                      max={data.countries[0]?.sessions || 1}
                      sublabel={`${country.percentage}% · ${formatCurrency(country.revenue)}`}
                    />
                  ))}
                  {data.countries.length === 0 && (
                    <p className="text-center text-sm text-slate-500">Zatiaľ žiadne dáta</p>
                  )}
                </div>
              </div>

              {/* Devices */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Zariadenia</h2>
                <div className="mt-4 space-y-4">
                  {data.devices.map((device) => (
                    <ProgressBar
                      key={device.device}
                      label={device.device === 'desktop' ? 'Počítač' : device.device === 'mobile' ? 'Mobil' : 'Tablet'}
                      value={device.sessions}
                      max={data.devices[0]?.sessions || 1}
                      sublabel={`${device.percentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Traffic sources */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-semibold text-slate-900">Zdroje návštevnosti</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {data.sources.map((source) => (
                    <div key={source.source} className="rounded-xl bg-slate-50 p-4 text-center">
                      <p className="text-2xl font-bold text-slate-900">{formatNumber(source.sessions)}</p>
                      <p className="mt-1 text-sm font-medium capitalize text-slate-600">{source.source}</p>
                      <p className="text-xs text-slate-400">{source.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FUNNEL TAB */}
          {activeTab === 'funnel' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Konverzný lievik</h2>
                <p className="mt-1 text-sm text-slate-500">Sledovanie cesty zákazníka od návštevy po nákup</p>

                <div className="mt-6 grid gap-6 sm:grid-cols-5">
                  {data.funnel.steps.map((step, index) => (
                    <FunnelStep
                      key={step.name}
                      name={step.name}
                      count={step.count}
                      percentage={step.percentage}
                      dropoff={step.dropoff}
                      isLast={index === data.funnel.steps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Conversion insights */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">View-to-Cart</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.funnel.steps[1]?.count && data.funnel.steps[2]?.count
                      ? Math.round((data.funnel.steps[2].count / data.funnel.steps[1].count) * 100)
                      : 0}
                    %
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Zobrazenia → Košík</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Cart-to-Purchase</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.funnel.steps[2]?.count && data.funnel.steps[4]?.count
                      ? Math.round((data.funnel.steps[4].count / data.funnel.steps[2].count) * 100)
                      : 0}
                    %
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Košík → Nákup</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overall</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {data.overview.today.conversionRate}%
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Celková konverzia</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
