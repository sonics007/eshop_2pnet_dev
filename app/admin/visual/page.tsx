'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { VisualSettings } from '@/lib/modules/site/pages/visual/types';
import { defaultVisualSettings } from '@/lib/modules/site/pages/visual/types';

export default function VisualPage() {
  const [settings, setSettings] = useState<VisualSettings>(defaultVisualSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newCarouselUrl, setNewCarouselUrl] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/site/visual');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load visual settings:', error);
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
      const response = await fetch('/api/site/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Nastavenia uložené' });
    } catch (error) {
      console.error('Failed to save visual settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof VisualSettings>(field: K, value: VisualSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateHighlight = (index: number, field: 'metric' | 'title' | 'copy' | 'titleCz' | 'copyCz', value: string) => {
    setSettings(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
  };

  const addHighlight = () => {
    setSettings(prev => ({
      ...prev,
      highlights: [...prev.highlights, { metric: '', title: '', copy: '', titleCz: '', copyCz: '' }]
    }));
  };

  const removeHighlight = (index: number) => {
    setSettings(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const updateSecondaryHighlight = (index: number, field: 'metric' | 'title' | 'copy' | 'titleCz' | 'copyCz', value: string) => {
    setSettings(prev => ({
      ...prev,
      secondaryHighlights: (prev.secondaryHighlights || []).map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
  };

  const addSecondaryHighlight = () => {
    setSettings(prev => ({
      ...prev,
      secondaryHighlights: [...(prev.secondaryHighlights || []), { metric: '', title: '', copy: '', titleCz: '', copyCz: '' }]
    }));
  };

  const removeSecondaryHighlight = (index: number) => {
    setSettings(prev => ({
      ...prev,
      secondaryHighlights: (prev.secondaryHighlights || []).filter((_, i) => i !== index)
    }));
  };

  const addCarouselImage = () => {
    if (!newCarouselUrl.trim()) return;
    setSettings(prev => ({
      ...prev,
      carouselImages: [...prev.carouselImages, newCarouselUrl.trim()]
    }));
    setNewCarouselUrl('');
  };

  const removeCarouselImage = (url: string) => {
    setSettings(prev => ({
      ...prev,
      carouselImages: prev.carouselImages.filter(img => img !== url)
    }));
  };

  const updateCzTranslation = (field: 'title' | 'description' | 'primaryCtaLabel' | 'secondaryCtaLabel', value: string) => {
    setSettings(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        cz: {
          ...prev.translations?.cz,
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout activePanel="admin-visual">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-visual">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stránka</p>
        <h1 className="text-4xl font-semibold text-slate-900">Vizuál & pozadie</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nastavenie hero sekcie, pozadia a vizuálnych prvkov
        </p>
      </div>

      <div className="space-y-6">
        {/* Hero texty */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Hero sekcia</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Hlavný nadpis
              <input
                type="text"
                value={settings.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Popis
              <textarea
                rows={3}
                value={settings.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* Hero texty - CZ */}
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">🇨🇿 Hero sekcia - český preklad</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Hlavní nadpis (CZ)
              <input
                type="text"
                value={settings.translations?.cz?.title || ''}
                onChange={(e) => updateCzTranslation('title', e.target.value)}
                placeholder="Český preklad nadpisu..."
                className="mt-2 w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Popis (CZ)
              <textarea
                rows={3}
                value={settings.translations?.cz?.description || ''}
                onChange={(e) => updateCzTranslation('description', e.target.value)}
                placeholder="Český preklad popisu..."
                className="mt-2 w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* CTA tlačidlá */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">CTA tlačidlá</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600">Primárne tlačidlo</p>
              <label className="block text-sm text-slate-700">
                Text
                <input
                  type="text"
                  value={settings.primaryCtaLabel}
                  onChange={(e) => updateField('primaryCtaLabel', e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Odkaz
                <input
                  type="text"
                  value={settings.primaryCtaLink}
                  onChange={(e) => updateField('primaryCtaLink', e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600">Sekundárne tlačidlo</p>
              <label className="block text-sm text-slate-700">
                Text
                <input
                  type="text"
                  value={settings.secondaryCtaLabel}
                  onChange={(e) => updateField('secondaryCtaLabel', e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Odkaz
                <input
                  type="text"
                  value={settings.secondaryCtaLink}
                  onChange={(e) => updateField('secondaryCtaLink', e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
          </div>
        </section>

        {/* CTA tlačidlá - CZ */}
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">🇨🇿 CTA tlačidlá - český preklad</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Text primárního tlačítka (CZ)
              <input
                type="text"
                value={settings.translations?.cz?.primaryCtaLabel || ''}
                onChange={(e) => updateCzTranslation('primaryCtaLabel', e.target.value)}
                placeholder="Český preklad..."
                className="mt-1 w-full rounded-2xl border border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Text sekundárního tlačítka (CZ)
              <input
                type="text"
                value={settings.translations?.cz?.secondaryCtaLabel || ''}
                onChange={(e) => updateCzTranslation('secondaryCtaLabel', e.target.value)}
                placeholder="Český preklad..."
                className="mt-1 w-full rounded-2xl border border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* Pozadie */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Pozadie</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              URL obrázka pozadia
              <input
                type="text"
                value={settings.backgroundImage}
                onChange={(e) => updateField('backgroundImage', e.target.value)}
                placeholder="https://example.com/background.jpg"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-slate-700">Carousel obrázky</p>
              {settings.carouselImages.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {settings.carouselImages.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <span className="flex-1 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeCarouselImage(url)}
                        className="text-xs text-rose-500 hover:text-rose-700"
                      >
                        odstrániť
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-3">
                <input
                  type="text"
                  value={newCarouselUrl}
                  onChange={(e) => setNewCarouselUrl(e.target.value)}
                  placeholder="URL obrázka"
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCarouselImage}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Pridať
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights - Hero (tmavé pozadie) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Okienka v Hero sekcii</h2>
              <p className="text-xs text-slate-500">Zobrazujú sa na tmavom pozadí v hero časti</p>
            </div>
            <button
              type="button"
              onClick={addHighlight}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
            >
              + Pridať
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {settings.highlights.map((highlight, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-500">Highlight #{i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    odstrániť
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="block text-sm text-slate-700">
                    Metrika
                    <input
                      type="text"
                      value={highlight.metric}
                      onChange={(e) => updateHighlight(i, 'metric', e.target.value)}
                      placeholder="napr. 48h"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Názov
                    <input
                      type="text"
                      value={highlight.title}
                      onChange={(e) => updateHighlight(i, 'title', e.target.value)}
                      placeholder="napr. Servis do 48h"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Text
                    <input
                      type="text"
                      value={highlight.copy}
                      onChange={(e) => updateHighlight(i, 'copy', e.target.value)}
                      placeholder="Popis"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                </div>
                {/* CZ translations */}
                <div className="mt-3 grid gap-3 md:grid-cols-2 border-t border-blue-200 pt-3">
                  <label className="block text-sm text-blue-700">
                    🇨🇿 Název (CZ)
                    <input
                      type="text"
                      value={highlight.titleCz || ''}
                      onChange={(e) => updateHighlight(i, 'titleCz', e.target.value)}
                      placeholder="Český preklad názvu..."
                      className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-blue-700">
                    🇨🇿 Text (CZ)
                    <input
                      type="text"
                      value={highlight.copyCz || ''}
                      onChange={(e) => updateHighlight(i, 'copyCz', e.target.value)}
                      placeholder="Český preklad textu..."
                      className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            ))}
            {settings.highlights.length === 0 && (
              <p className="text-sm text-slate-500">Žiadne okienka. Kliknutím na tlačidlo pridajte nové.</p>
            )}
          </div>
        </section>

        {/* Secondary Highlights - Pod hero (biele pozadie) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Okienka pod Hero sekciou</h2>
              <p className="text-xs text-slate-500">Zobrazujú sa na bielom pozadí pod hero časťou</p>
            </div>
            <button
              type="button"
              onClick={addSecondaryHighlight}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
            >
              + Pridať
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {(settings.secondaryHighlights || []).map((highlight, i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-500">Okienko #{i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeSecondaryHighlight(i)}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    odstrániť
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="block text-sm text-slate-700">
                    Metrika
                    <input
                      type="text"
                      value={highlight.metric}
                      onChange={(e) => updateSecondaryHighlight(i, 'metric', e.target.value)}
                      placeholder="napr. 48h"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Názov
                    <input
                      type="text"
                      value={highlight.title}
                      onChange={(e) => updateSecondaryHighlight(i, 'title', e.target.value)}
                      placeholder="napr. Servis do 48h"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Text
                    <input
                      type="text"
                      value={highlight.copy}
                      onChange={(e) => updateSecondaryHighlight(i, 'copy', e.target.value)}
                      placeholder="Popis"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>
                </div>
                {/* CZ translations */}
                <div className="mt-3 grid gap-3 md:grid-cols-2 border-t border-blue-200 pt-3">
                  <label className="block text-sm text-blue-700">
                    🇨🇿 Název (CZ)
                    <input
                      type="text"
                      value={highlight.titleCz || ''}
                      onChange={(e) => updateSecondaryHighlight(i, 'titleCz', e.target.value)}
                      placeholder="Český preklad názvu..."
                      className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-blue-700">
                    🇨🇿 Text (CZ)
                    <input
                      type="text"
                      value={highlight.copyCz || ''}
                      onChange={(e) => updateSecondaryHighlight(i, 'copyCz', e.target.value)}
                      placeholder="Český preklad textu..."
                      className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            ))}
            {(settings.secondaryHighlights || []).length === 0 && (
              <p className="text-sm text-slate-500">Žiadne okienka. Kliknutím na tlačidlo pridajte nové.</p>
            )}
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
