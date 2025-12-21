'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { AdminMenuSettings, AdminMenuItem } from '@/lib/modules/site/pages/admin-menu/types';
import { defaultAdminMenuSettings } from '@/lib/modules/site/pages/admin-menu/types';

export default function AdminMenuPage() {
  const [settings, setSettings] = useState<AdminMenuSettings>(defaultAdminMenuSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<Omit<AdminMenuItem, 'order'>>({
    id: '',
    label: '',
    href: '',
    icon: '',
    description: '',
    enabled: true
  });
  const [newSubItem, setNewSubItem] = useState<Record<string, Omit<AdminMenuItem, 'order'>>>({});

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/site/admin-menu');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load admin menu settings:', error);
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
      const response = await fetch('/api/site/admin-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Nastavenia uložené' });
    } catch (error) {
      console.error('Failed to save admin menu settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addItem = () => {
    if (!newItem.id.trim() || !newItem.label.trim() || !newItem.href.trim()) return;

    const maxOrder = Math.max(...settings.items.map(i => i.order), -1);
    setSettings(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, order: maxOrder + 1, children: [] }]
    }));
    setNewItem({ id: '', label: '', href: '', icon: '', description: '', enabled: true });
  };

  const removeItem = (id: string) => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof AdminMenuItem, value: string | boolean | number | AdminMenuItem[]) => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const sortedItems = [...settings.items].sort((a, b) => a.order - b.order);
    const index = sortedItems.findIndex(item => item.id === id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= sortedItems.length) return;

    const tempOrder = sortedItems[index].order;
    sortedItems[index].order = sortedItems[newIndex].order;
    sortedItems[newIndex].order = tempOrder;

    setSettings(prev => ({
      ...prev,
      items: sortedItems
    }));
  };

  // Podmenu funkcie
  const addSubItem = (parentId: string) => {
    const subItem = newSubItem[parentId];
    if (!subItem?.id?.trim() || !subItem?.label?.trim() || !subItem?.href?.trim()) return;

    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === parentId) {
          const children = item.children || [];
          const maxOrder = Math.max(...children.map(c => c.order), -1);
          return {
            ...item,
            children: [...children, { ...subItem, order: maxOrder + 1 }]
          };
        }
        return item;
      })
    }));
    setNewSubItem(prev => ({ ...prev, [parentId]: { id: '', label: '', href: '', icon: '', description: '', enabled: true } }));
  };

  const removeSubItem = (parentId: string, subId: string) => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: (item.children || []).filter(child => child.id !== subId)
          };
        }
        return item;
      })
    }));
  };

  const updateSubItem = (parentId: string, subId: string, field: keyof AdminMenuItem, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: (item.children || []).map(child =>
              child.id === subId ? { ...child, [field]: value } : child
            )
          };
        }
        return item;
      })
    }));
  };

  const moveSubItem = (parentId: string, subId: string, direction: 'up' | 'down') => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === parentId) {
          const children = [...(item.children || [])].sort((a, b) => a.order - b.order);
          const index = children.findIndex(c => c.id === subId);
          const newIndex = direction === 'up' ? index - 1 : index + 1;

          if (newIndex < 0 || newIndex >= children.length) return item;

          const tempOrder = children[index].order;
          children[index].order = children[newIndex].order;
          children[newIndex].order = tempOrder;

          return { ...item, children };
        }
        return item;
      })
    }));
  };

  const sortedItems = [...settings.items].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <AdminLayout activePanel="admin-admin-menu">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-admin-menu">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stránka</p>
        <h1 className="text-4xl font-semibold text-slate-900">Admin menu</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nastavenie položiek menu v admin paneli (vrátane podmenu)
        </p>
      </div>

      <div className="space-y-6">
        {/* Všeobecné nastavenia */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Všeobecné nastavenia</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showDashboard}
                onChange={(e) => setSettings(prev => ({ ...prev, showDashboard: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Zobraziť Dashboard ako prvú položku</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showLogout}
                onChange={(e) => setSettings(prev => ({ ...prev, showLogout: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Zobraziť tlačidlo Odhlásiť</span>
            </label>
          </div>
        </section>

        {/* Položky menu */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Položky menu</h2>
          <p className="mt-1 text-sm text-slate-500">Upravte poradie, viditeľnosť a podmenu položiek</p>

          <div className="mt-4 space-y-3">
            {sortedItems.map((item, index) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.has(item.id);
              const sortedChildren = [...(item.children || [])].sort((a, b) => a.order - b.order);
              const subItemForm = newSubItem[item.id] || { id: '', label: '', href: '', icon: '', description: '', enabled: true };

              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50">
                  {/* Hlavná položka */}
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                        className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === sortedItems.length - 1}
                        className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateItem(item.id, 'enabled', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </label>
                    <div className="flex-1 grid gap-2 md:grid-cols-5">
                      <input
                        type="text"
                        value={item.id}
                        onChange={(e) => updateItem(item.id, 'id', e.target.value)}
                        placeholder="ID"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                        placeholder="Názov"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => updateItem(item.id, 'href', e.target.value)}
                        placeholder="Odkaz"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.icon || ''}
                        onChange={(e) => updateItem(item.id, 'icon', e.target.value)}
                        placeholder="Ikona"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Popis"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {hasChildren ? `${item.children!.length} podmenu` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-700"
                    >
                      odstrániť
                    </button>
                  </div>

                  {/* Podmenu sekcia */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Podmenu</p>

                      {/* Existujúce podmenu položky */}
                      <div className="mt-3 space-y-2">
                        {sortedChildren.map((child, childIndex) => (
                          <div key={child.id} className="ml-4 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => moveSubItem(item.id, child.id, 'up')}
                                disabled={childIndex === 0}
                                className="text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-30"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSubItem(item.id, child.id, 'down')}
                                disabled={childIndex === sortedChildren.length - 1}
                                className="text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-30"
                              >
                                ▼
                              </button>
                            </div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={child.enabled}
                                onChange={(e) => updateSubItem(item.id, child.id, 'enabled', e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300"
                              />
                            </label>
                            <div className="flex-1 grid gap-2 md:grid-cols-5">
                              <input
                                type="text"
                                value={child.id}
                                onChange={(e) => updateSubItem(item.id, child.id, 'id', e.target.value)}
                                placeholder="ID"
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={child.label}
                                onChange={(e) => updateSubItem(item.id, child.id, 'label', e.target.value)}
                                placeholder="Názov"
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={child.href}
                                onChange={(e) => updateSubItem(item.id, child.id, 'href', e.target.value)}
                                placeholder="Odkaz"
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={child.icon || ''}
                                onChange={(e) => updateSubItem(item.id, child.id, 'icon', e.target.value)}
                                placeholder="Ikona"
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={child.description || ''}
                                onChange={(e) => updateSubItem(item.id, child.id, 'description', e.target.value)}
                                placeholder="Popis"
                                className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSubItem(item.id, child.id)}
                              className="text-[10px] text-rose-500 hover:text-rose-700"
                            >
                              odstrániť
                            </button>
                          </div>
                        ))}
                        {sortedChildren.length === 0 && (
                          <p className="ml-4 text-xs text-slate-400">Žiadne podmenu položky</p>
                        )}
                      </div>

                      {/* Pridať podmenu položku */}
                      <div className="ml-4 mt-3 rounded-lg border border-dashed border-slate-200 p-3">
                        <p className="text-xs font-medium text-slate-500">Pridať podmenu položku</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-6">
                          <input
                            type="text"
                            value={subItemForm.id}
                            onChange={(e) => setNewSubItem(prev => ({
                              ...prev,
                              [item.id]: { ...subItemForm, id: e.target.value }
                            }))}
                            placeholder="ID"
                            className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={subItemForm.label}
                            onChange={(e) => setNewSubItem(prev => ({
                              ...prev,
                              [item.id]: { ...subItemForm, label: e.target.value }
                            }))}
                            placeholder="Názov"
                            className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={subItemForm.href}
                            onChange={(e) => setNewSubItem(prev => ({
                              ...prev,
                              [item.id]: { ...subItemForm, href: e.target.value }
                            }))}
                            placeholder="Odkaz"
                            className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={subItemForm.icon || ''}
                            onChange={(e) => setNewSubItem(prev => ({
                              ...prev,
                              [item.id]: { ...subItemForm, icon: e.target.value }
                            }))}
                            placeholder="Ikona"
                            className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={subItemForm.description || ''}
                            onChange={(e) => setNewSubItem(prev => ({
                              ...prev,
                              [item.id]: { ...subItemForm, description: e.target.value }
                            }))}
                            placeholder="Popis"
                            className="rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => addSubItem(item.id)}
                            className="rounded border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            Pridať
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {sortedItems.length === 0 && (
              <p className="text-sm text-slate-500">Žiadne položky. Pridajte novú pomocou formulára nižšie.</p>
            )}
          </div>

          {/* Pridať novú hlavnú položku */}
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Pridať novú položku menu</p>
            <div className="mt-3 grid gap-3 md:grid-cols-6">
              <input
                type="text"
                value={newItem.id}
                onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                placeholder="ID"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                placeholder="Názov"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={newItem.href}
                onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                placeholder="Odkaz"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={newItem.icon || ''}
                onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                placeholder="Ikona"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={newItem.description || ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Popis"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={addItem}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Pridať
              </button>
            </div>
          </div>
        </section>

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
