'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { MenuSettings, MenuItem } from '@/lib/modules/site/pages/menu/types';
import { defaultMenuSettings } from '@/lib/modules/site/pages/menu/types';

export default function MenuPage() {
  const [settings, setSettings] = useState<MenuSettings>(defaultMenuSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newMainItem, setNewMainItem] = useState<MenuItem>({ label: '', href: '' });
  const [newFooterItem, setNewFooterItem] = useState<MenuItem>({ label: '', href: '' });

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/site/menu');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load menu settings:', error);
        setMessage({ type: 'error', text: 'Nepodarilo sa načítať nastavenia' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/site/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Nastavenia uložené' });
    } catch (error) {
      console.error('Failed to save menu settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = (menuType: 'mainMenu' | 'footerMenu') => {
    const newItem = menuType === 'mainMenu' ? newMainItem : newFooterItem;
    if (!newItem.label.trim() || !newItem.href.trim()) return;

    setSettings(prev => ({
      ...prev,
      [menuType]: [...prev[menuType], { label: newItem.label.trim(), href: newItem.href.trim() }]
    }));

    if (menuType === 'mainMenu') {
      setNewMainItem({ label: '', href: '' });
    } else {
      setNewFooterItem({ label: '', href: '' });
    }
  };

  const removeMenuItem = (menuType: 'mainMenu' | 'footerMenu', index: number) => {
    setSettings(prev => ({
      ...prev,
      [menuType]: prev[menuType].filter((_, i) => i !== index)
    }));
  };

  const updateMenuItem = (menuType: 'mainMenu' | 'footerMenu', index: number, field: 'label' | 'href', value: string) => {
    setSettings(prev => ({
      ...prev,
      [menuType]: prev[menuType].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const moveMenuItem = (menuType: 'mainMenu' | 'footerMenu', index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setSettings(prev => {
      const items = [...prev[menuType]];
      if (newIndex < 0 || newIndex >= items.length) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, [menuType]: items };
    });
  };

  if (loading) {
    return (
      <AdminLayout activePanel="admin-navigation">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMenuEditor = (
    menuType: 'mainMenu' | 'footerMenu',
    title: string,
    description: string,
    items: MenuItem[],
    newItem: MenuItem,
    setNewItem: (item: MenuItem) => void
  ) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveMenuItem(menuType, i, 'up')}
                disabled={i === 0}
                className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveMenuItem(menuType, i, 'down')}
                disabled={i === items.length - 1}
                className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <div className="flex-1 grid gap-2 md:grid-cols-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateMenuItem(menuType, i, 'label', e.target.value)}
                placeholder="Názov položky"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={item.href}
                onChange={(e) => updateMenuItem(menuType, i, 'href', e.target.value)}
                placeholder="Odkaz (napr. /produkty)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => removeMenuItem(menuType, i)}
              className="text-xs text-rose-500 hover:text-rose-700"
            >
              odstrániť
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500">Žiadne položky. Pridajte novú pomocou formulára nižšie.</p>
        )}
      </div>

      {/* Pridať novú položku */}
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-600">Pridať novú položku</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
          <input
            type="text"
            value={newItem.label}
            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            placeholder="Názov (napr. Produkty)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
          <input
            type="text"
            value={newItem.href}
            onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
            placeholder="Odkaz (napr. /produkty)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => addMenuItem(menuType)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Pridať
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <AdminLayout activePanel="admin-navigation">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stránka</p>
        <h1 className="text-4xl font-semibold text-slate-900">Menu</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nastavenie hlavného menu a footer navigácie
        </p>
      </div>

      <div className="space-y-6">
        {/* Nastavenia */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Nastavenia</h2>
          <div className="mt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.mobileMenuEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, mobileMenuEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Povoliť mobilné menu</span>
            </label>
          </div>
        </section>

        {/* Hlavné menu */}
        {renderMenuEditor(
          'mainMenu',
          'Hlavné menu',
          'Položky zobrazené v hlavnej navigácii stránky',
          settings.mainMenu,
          newMainItem,
          setNewMainItem
        )}

        {/* Footer menu */}
        {renderMenuEditor(
          'footerMenu',
          'Footer menu',
          'Položky zobrazené v pätičke stránky',
          settings.footerMenu,
          newFooterItem,
          setNewFooterItem
        )}

        {/* Uložiť */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
          </button>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
