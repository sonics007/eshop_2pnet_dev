'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { LinkSettings } from '@/lib/modules/site/pages/links/types';
import { defaultLinkSettings } from '@/lib/modules/site/pages/links/types';

export default function LinksPage() {
  const [settings, setSettings] = useState<LinkSettings>(defaultLinkSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkValue, setNewLinkValue] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/site/links');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load link settings:', error);
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
      const response = await fetch('/api/site/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Nastavenia uložené' });
    } catch (error) {
      console.error('Failed to save link settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof LinkSettings>(field: K, value: LinkSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addFooterLink = () => {
    if (!newLinkLabel.trim() || !newLinkValue.trim()) return;
    setSettings(prev => ({
      ...prev,
      footerLinks: [...prev.footerLinks, { label: newLinkLabel.trim(), value: newLinkValue.trim() }]
    }));
    setNewLinkLabel('');
    setNewLinkValue('');
  };

  const removeFooterLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      footerLinks: prev.footerLinks.filter((_, i) => i !== index)
    }));
  };

  const updateFooterLink = (index: number, field: 'label' | 'value', value: string) => {
    setSettings(prev => ({
      ...prev,
      footerLinks: prev.footerLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  if (loading) {
    return (
      <AdminLayout activePanel="admin-links">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-links">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stránka</p>
        <h1 className="text-4xl font-semibold text-slate-900">Linky & odkazy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nastavenie odkazov loga a footer linkov
        </p>
      </div>

      <div className="space-y-6">
        {/* Logo linky */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Logo odkazy</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Hlavný odkaz loga (verejný web)
              <input
                type="text"
                value={settings.logoPrimaryLink}
                onChange={(e) => updateField('logoPrimaryLink', e.target.value)}
                placeholder="https://www.example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">Kam presmeruje kliknutie na logo na verejnej stránke</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Admin odkaz loga
              <input
                type="text"
                value={settings.logoAdminLink}
                onChange={(e) => updateField('logoAdminLink', e.target.value)}
                placeholder="/admin"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">Kam presmeruje kliknutie na logo v admin paneli</span>
            </label>
          </div>
        </section>

        {/* Footer linky */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Footer linky</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Odkazy zobrazené v pätičke stránky</p>

          <div className="mt-4 space-y-3">
            {settings.footerLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex-1 grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateFooterLink(i, 'label', e.target.value)}
                    placeholder="Názov linku"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={link.value}
                    onChange={(e) => updateFooterLink(i, 'value', e.target.value)}
                    placeholder="URL adresa"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFooterLink(i)}
                  className="text-xs text-rose-500 hover:text-rose-700"
                >
                  odstrániť
                </button>
              </div>
            ))}
            {settings.footerLinks.length === 0 && (
              <p className="text-sm text-slate-500">Žiadne footer linky. Pridajte nový pomocou formulára nižšie.</p>
            )}
          </div>

          {/* Pridať nový link */}
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Pridať nový link</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Názov (napr. Servis UPS)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={newLinkValue}
                onChange={(e) => setNewLinkValue(e.target.value)}
                placeholder="URL (napr. https://...)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={addFooterLink}
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
