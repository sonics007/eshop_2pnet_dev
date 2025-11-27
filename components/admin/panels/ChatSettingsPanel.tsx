'use client';

/**
 * CHAT MODULE - Admin Settings Panel
 *
 * Panel pre interný chat s tawk.to integráciou
 */

import { useState, useEffect } from 'react';
import type { ChatSettings, TawkToSettings } from '@/lib/modules/chat';
import { defaultTawkToSettings } from '@/lib/modules/chat';

const dayLabels = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

interface ChatSettingsPanelProps {
  onSave?: () => void;
}

export function ChatSettingsPanel({ onSave }: ChatSettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Načítaj nastavenia
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/chat/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load chat settings:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Uložiť nastavenia
  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/chat/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Nastavenia uložené' });
        onSave?.();
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save chat settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleFieldChange = (field: keyof ChatSettings, value: string | boolean) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleTawkToChange = (field: keyof TawkToSettings, value: string | boolean) => {
    setSettings(prev => {
      if (!prev) return prev;
      const tawkTo = prev.tawkTo ?? defaultTawkToSettings;
      return { ...prev, tawkTo: { ...tawkTo, [field]: value } };
    });
  };

  const toggleDaySlot = (day: number, enabled: boolean) => {
    setSettings(prev => {
      if (!prev) return prev;
      const hours = prev.onlineHours ?? [];
      if (!enabled) {
        return { ...prev, onlineHours: hours.filter(h => h.day !== day) };
      }
      const existing = hours.find(h => h.day === day);
      if (existing) return prev;
      return { ...prev, onlineHours: [...hours, { day, start: '08:00', end: '16:00' }] };
    });
  };

  const updateDaySlot = (day: number, field: 'start' | 'end', value: string) => {
    setSettings(prev => {
      if (!prev) return prev;
      const hours = prev.onlineHours ?? [];
      const existing = hours.find(h => h.day === day);
      const updated = existing
        ? hours.map(h => h.day === day ? { ...h, [field]: value } : h)
        : [...hours, { day, start: field === 'start' ? value : '08:00', end: field === 'end' ? value : '16:00' }];
      return { ...prev, onlineHours: updated };
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm text-rose-600">Nepodarilo sa načítať nastavenia</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">Interný chat</h2>
      <p className="text-sm text-slate-500">
        Nastavenia live chatu pre zákazníkov. Správy sa ukladajú do databázy a notifikácie sa posielajú na admin email.
      </p>

      {/* Admin email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          E-mail administrátora
        </label>
        <input
          type="email"
          value={settings.adminEmail ?? ''}
          onChange={(e) => handleFieldChange('adminEmail', e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="admin@firma.sk"
        />
        <p className="text-xs text-slate-500">
          Na tento email budú chodiť notifikácie o nových správach
        </p>
      </div>

      {/* Email prefix */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Prefix predmetu emailu
        </label>
        <input
          type="text"
          value={settings.emailSubjectPrefix ?? ''}
          onChange={(e) => handleFieldChange('emailSubjectPrefix', e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="[Eshop Chat]"
        />
      </div>

      {/* Online hours */}
      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="alwaysOnline"
            checked={!!settings.alwaysOnline}
            onChange={(e) => handleFieldChange('alwaysOnline', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="alwaysOnline" className="text-sm text-slate-700">
            Vždy online (bez rozpisu hodín)
          </label>
        </div>

        {!settings.alwaysOnline && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rozpis online hodín
            </p>
            {dayLabels.map((label, idx) => {
              const slot = settings.onlineHours?.find(h => h.day === idx);
              const enabled = !!slot;
              return (
                <div
                  key={label}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <label className="flex min-w-[120px] items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleDaySlot(idx, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {label}
                  </label>
                  <input
                    type="time"
                    value={slot?.start ?? '08:00'}
                    onChange={(e) => updateDaySlot(idx, 'start', e.target.value)}
                    disabled={!enabled}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="time"
                    value={slot?.end ?? '16:00'}
                    onChange={(e) => updateDaySlot(idx, 'end', e.target.value)}
                    disabled={!enabled}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-reply */}
      <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoReply"
            checked={!!settings.autoReplyEnabled}
            onChange={(e) => handleFieldChange('autoReplyEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="autoReply" className="text-sm text-slate-700">
            Automatická odpoveď
          </label>
        </div>
        {settings.autoReplyEnabled && (
          <textarea
            value={settings.autoReplyMessage ?? ''}
            onChange={(e) => handleFieldChange('autoReplyMessage', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            rows={3}
            placeholder="Ďakujeme za vašu správu. Ozveme sa vám čo najskôr."
          />
        )}
      </div>

      {/* Tawk.to integrácia */}
      <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tawkToEnabled"
            checked={!!settings.tawkTo?.enabled}
            onChange={(e) => handleTawkToChange('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="tawkToEnabled" className="text-sm font-medium text-slate-700">
            Povoliť tawk.to chat widget
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Tawk.to je bezplatný live chat. Získajte Property ID a Widget ID z{' '}
          <a
            href="https://dashboard.tawk.to"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
          >
            tawk.to dashboard
          </a>
          {' '}(Administration &rarr; Channels &rarr; Chat Widget).
        </p>

        {settings.tawkTo?.enabled && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Property ID
              </label>
              <input
                type="text"
                value={settings.tawkTo?.propertyId ?? ''}
                onChange={(e) => handleTawkToChange('propertyId', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="napr. 1234567890abcdef"
              />
              <p className="text-xs text-slate-400">
                Nájdete v URL: https://tawk.to/chat/[PROPERTY_ID]/[WIDGET_ID]
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Widget ID
              </label>
              <input
                type="text"
                value={settings.tawkTo?.widgetId ?? ''}
                onChange={(e) => handleTawkToChange('widgetId', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="napr. default alebo 1abcd2efg"
              />
            </div>

            {settings.tawkTo?.propertyId && settings.tawkTo?.widgetId && (
              <div className="rounded-lg bg-emerald-100 p-3 text-xs text-emerald-700">
                Widget bude načítaný z:{' '}
                <code className="font-mono">
                  https://embed.tawk.to/{settings.tawkTo.propertyId}/{settings.tawkTo.widgetId}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
        </button>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
