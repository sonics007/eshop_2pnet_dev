'use client';

/**
 * ADMIN MODULE - Layout Component
 *
 * Modulárny layout pre admin panel s dynamickým menu z registry
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAdminMenuSections, type AdminMenuSection } from '@/lib/modules';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePanel?: string;
  onPanelChange?: (panelId: string) => void;
}

export function AdminLayout({ children, activePanel, onPanelChange }: AdminLayoutProps) {
  const [menuSections] = useState<AdminMenuSection[]>(() => getAdminMenuSections());
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const toggleMenu = (moduleId: string) => {
    setOpenMenus(prev => {
      // Zatvor ostatné menu
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      newState[moduleId] = !prev[moduleId];
      return newState;
    });
  };

  const handlePanelClick = (panelId: string) => {
    setOpenMenus({});
    onPanelChange?.(panelId);
  };

  const isPanelInSection = (section: AdminMenuSection, panelId?: string): boolean => {
    if (!panelId) return false;
    return section.panels.some(p => p.id === panelId);
  };

  // Zoskup moduly do skupín pre lepšie zobrazenie
  const moduleGroups = [
    {
      label: 'Administrácia',
      modules: menuSections.filter(s => ['site-settings', 'logging'].includes(s.moduleId))
    },
    {
      label: 'Používatelia',
      modules: menuSections.filter(s => ['auth-customer', 'auth-admin'].includes(s.moduleId))
    },
    {
      label: 'E-shop',
      modules: menuSections.filter(s => ['products', 'orders', 'invoices'].includes(s.moduleId))
    },
    {
      label: 'Komunikácia',
      modules: menuSections.filter(s => ['chat'].includes(s.moduleId))
    },
    {
      label: 'Integrácie',
      modules: menuSections.filter(s => ['flexibee'].includes(s.moduleId))
    }
  ].filter(g => g.modules.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="text-4xl font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-2 text-sm text-slate-500">
          Administrácia obsahu, používateľov a nastavení
        </p>

        {/* Modulárne menu */}
        <div className="mt-6 flex flex-wrap gap-2">
          {moduleGroups.map((group) => (
            group.modules.length === 1 ? (
              // Jeden modul v skupine - zobraz priamo
              <div
                key={group.modules[0].moduleId}
                className="relative"
                ref={el => { menuRefs.current[group.modules[0].moduleId] = el; }}
              >
                {group.modules[0].panels.length === 1 && group.modules[0].panels[0].route ? (
                  <Link
                    href={group.modules[0].panels[0].route}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isPanelInSection(group.modules[0], activePanel)
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {group.modules[0].moduleName}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleMenu(group.modules[0].moduleId)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isPanelInSection(group.modules[0], activePanel) || openMenus[group.modules[0].moduleId]
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {group.modules[0].moduleName}
                    </button>
                    {openMenus[group.modules[0].moduleId] && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                        {group.modules[0].panels.map(panel => (
                          panel.route ? (
                            <Link
                              key={panel.id}
                              href={panel.route}
                              className="block w-full rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                              onClick={() => setOpenMenus({})}
                            >
                              {panel.label}
                              {panel.description && (
                                <span className="block text-xs text-slate-500">{panel.description}</span>
                              )}
                            </Link>
                          ) : (
                            <button
                              key={panel.id}
                              onClick={() => handlePanelClick(panel.id)}
                              className={`block w-full rounded-xl px-3 py-2 text-left ${
                                activePanel === panel.id
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {panel.label}
                              {panel.description && (
                                <span className={`block text-xs ${activePanel === panel.id ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {panel.description}
                                </span>
                              )}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Viac modulov v skupine - zobraz dropdown
              <div
                key={group.label}
                className="relative"
                ref={el => { menuRefs.current[group.label] = el; }}
              >
                <button
                  type="button"
                  onClick={() => toggleMenu(group.label)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    group.modules.some(m => isPanelInSection(m, activePanel)) || openMenus[group.label]
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {group.label}
                </button>
                {openMenus[group.label] && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                    {group.modules.map(module => (
                      <div key={module.moduleId} className="mb-2 last:mb-0">
                        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {module.moduleName}
                        </p>
                        {module.panels.map(panel => (
                          panel.route ? (
                            <Link
                              key={panel.id}
                              href={panel.route}
                              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                              onClick={() => setOpenMenus({})}
                            >
                              {panel.label}
                            </Link>
                          ) : (
                            <button
                              key={panel.id}
                              onClick={() => handlePanelClick(panel.id)}
                              className={`mt-1 block w-full rounded-xl px-3 py-2 text-left ${
                                activePanel === panel.id
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {panel.label}
                            </button>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
        </div>

        {/* Content area */}
        <div className="mt-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
