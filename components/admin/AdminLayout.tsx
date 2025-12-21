'use client';

/**
 * ADMIN MODULE - Layout Component
 *
 * Modulárny layout pre admin panel s dynamickým menu z nastavení
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import type { AdminMenuSettings, AdminMenuItem } from '@/lib/modules/site/pages/admin-menu/types';
import { defaultAdminMenuSettings } from '@/lib/modules/site/pages/admin-menu/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePanel?: string;
  onPanelChange?: (panelId: string) => void;
}

export function AdminLayout({ children, activePanel, onPanelChange }: AdminLayoutProps) {
  const pathname = usePathname();
  const [menuSettings, setMenuSettings] = useState<AdminMenuSettings>(defaultAdminMenuSettings);
  const [menuLoading, setMenuLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [openIssuesCount, setOpenIssuesCount] = useState<number>(0);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Načítaj menu nastavenia z API
  useEffect(() => {
    async function loadMenuSettings() {
      try {
        const response = await fetch('/api/site/admin-menu', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMenuSettings(injectNewsletterIntoSettings(data.data));
          }
        }
        // 401 je očakávaný ak používateľ nie je prihlásený - ignoruj
        // Použije sa defaultné menu
      } catch {
        // Sieťová chyba - pokračuj s default nastaveniami
      } finally {
        setMenuLoading(false);
      }
    }
    loadMenuSettings();
  }, []);

  // Načítaj počet otvorených hlásení chýb
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loadIssuesCount = async () => {
      try {
        const response = await fetch('/api/issues', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            const openCount = data.data.filter((i: { status: string }) => i.status !== 'resolved').length;
            setOpenIssuesCount(openCount);
          }
        }
      } catch {
        // ignore
      } finally {
        timer = setTimeout(loadIssuesCount, 60_000);
      }
    };
    loadIssuesCount();
    return () => clearTimeout(timer);
  }, []);

  // Zatvor menu pri kliknutí mimo
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      Object.entries(menuRefs.current).forEach(([key, ref]) => {
        if (openMenus[key] && ref && !ref.contains(target)) {
          setOpenMenus(prev => ({ ...prev, [key]: false }));
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenus]);

  const toggleMenu = (itemId: string) => {
    setOpenMenus(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      newState[itemId] = !prev[itemId];
      return newState;
    });
  };

  const isActiveItem = (item: AdminMenuItem): boolean => {
    if (pathname === item.href) return true;
    if (item.children?.some(child => pathname === child.href)) return true;
    return false;
  };

  const sortedItems = [...menuSettings.items]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  const renderMenuItem = (item: AdminMenuItem, index: number) => {
    const hasChildren = item.children && item.children.filter(c => c.enabled).length > 0;
    const isActive = isActiveItem(item);
    const isOpen = openMenus[item.id];
    const sortedChildren = hasChildren
      ? [...item.children!].filter(c => c.enabled).sort((a, b) => a.order - b.order)
      : [];

    const shouldShowBadge = openIssuesCount > 0;

    if (hasChildren) {
      // Položka s podmenu
      return (
        <div
          key={item.id}
          className="relative"
          ref={el => { menuRefs.current[item.id] = el; }}
        >
          <button
            type="button"
            onClick={() => toggleMenu(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive || isOpen
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className={item.id === 'dev' && shouldShowBadge ? 'text-rose-700' : ''}>{item.label}</span>
              <span className="text-xs">▾</span>
              {item.id === 'dev' && shouldShowBadge && (
                <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                  {openIssuesCount}
                </span>
              )}
            </span>
          </button>
          {isOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
              {sortedChildren.map(child => {
                const isIssue = child.id === 'issues';
                const isIssueOpen = isIssue && openIssuesCount > 0;
                return (
                  <Link
                    key={child.id}
                    href={child.href}
                    className={`block w-full rounded-xl px-3 py-2 text-left transition ${
                      pathname === child.href
                        ? 'bg-slate-900 text-white'
                        : isIssueOpen
                          ? 'bg-rose-50 text-rose-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => setOpenMenus({})}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span>{child.label}</span>
                      {isIssueOpen && (
                        <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {openIssuesCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Jednoduchá položka bez podmenu
    return (
      <Link
        key={item.id}
        href={item.href}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          isActive
            ? 'bg-slate-900 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <NotificationCenter />

      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="text-4xl font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-2 text-sm text-slate-500">
          Administrácia obsahu, používateľov a nastavení
        </p>

        {/* Tlačidlo späť - zobrazí sa na podstránkach */}
        {pathname !== '/admin' && (
          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <span>←</span>
              <span>Späť</span>
            </Link>
          </div>
        )}

        {/* Dynamické menu z nastavení */}
        <div className={`${pathname !== '/admin' ? 'mt-4' : 'mt-6'} flex flex-wrap gap-2`}>
          {menuLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
              ))}
            </div>
          ) : (
            sortedItems.map((item, index) => renderMenuItem(item, index))
          )}
        </div>

        {/* Content area */}
        <div className="mt-8">
          {children}
        </div>
      </main>

      {/* Admin nepotrebuje komerčný footer, nechávame čistý spodok */}
    </div>
  );
}

function injectNewsletterIntoSettings(settings: AdminMenuSettings): AdminMenuSettings {
  const clone: AdminMenuSettings = JSON.parse(JSON.stringify(settings));
  const settingsIndex = clone.items.findIndex((i) => i.id === 'settings');
  if (settingsIndex === -1) return clone;
  const settingsItem = clone.items[settingsIndex];
  const hasNewsletter =
    settingsItem.children?.some((c) => c.id === 'newsletters') ?? false;
  if (!hasNewsletter) {
    const child = {
      id: 'newsletters',
      label: 'Newsletter',
      href: '/admin/newsletters',
      icon: 'send',
      enabled: true,
      order: 4.5,
      description: 'Tvorba a odosielanie newsletterov'
    };
    settingsItem.children = settingsItem.children
      ? [...settingsItem.children, child]
      : [child];
    settingsItem.children = settingsItem.children.sort((a, b) => a.order - b.order);
  }
  clone.items[settingsIndex] = settingsItem;
  return clone;
}
