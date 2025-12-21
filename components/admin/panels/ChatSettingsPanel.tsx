'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChatProvider, ChatSettings } from '@/lib/modules/chat';
import { createTawkToSnippet, defaultChatSettings } from '@/lib/modules/chat';

interface ChatSettingsPanelProps {
  onSave?: () => void;
}

export function ChatSettingsPanel({ onSave }: ChatSettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tawkSettings = settings?.tawkTo ?? defaultChatSettings.tawkTo;
  const chatwootSettings = settings?.chatwoot ?? defaultChatSettings.chatwoot;
  const activeProvider: ChatProvider = settings?.activeProvider ?? defaultChatSettings.activeProvider;

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/chat/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          throw new Error('Failed to load chat settings');
        }
      } catch (error) {
        console.error('Failed to load chat settings:', error);
        setSettings(defaultChatSettings);
        setMessage({ type: 'error', text: 'Nepodarilo sa načítať nastavenia, zobrazené sú predvolené hodnoty.' });
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

  const handleTawkChange = (field: 'enabled' | 'propertyId' | 'widgetId' | 'embedSnippet', value: string | boolean) => {
    setSettings((prev) => {
      const next = prev ?? defaultChatSettings;
      return {
        ...next,
        tawkTo: {
          ...next.tawkTo,
          [field]: value
        }
      };
    });
  };

  const handleChatwootChange = (
    field: 'enabled' | 'baseUrl' | 'websiteToken' | 'locale' | 'position' | 'hideMessageBubble' | 'embedSnippet',
    value: string | boolean
  ) => {
    setSettings((prev) => {
      const next = prev ?? defaultChatSettings;
      return {
        ...next,
        chatwoot: {
          ...next.chatwoot,
          [field]: value
        }
      };
    });
  };

  const handleProviderChange = (provider: ChatProvider) => {
    setSettings((prev) => ({
      ...(prev ?? defaultChatSettings),
      activeProvider: provider
    }));
  };

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

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setMessage({ type: 'success', text: 'Nastavenia uložené' });
      onSave?.();
    } catch (error) {
      console.error('Failed to save chat settings:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa uložiť nastavenia' });
    } finally {
      setSaving(false);
    }
  };

  const regenerateSnippet = () => {
    const snippet = createTawkToSnippet(tawkSettings.propertyId, tawkSettings.widgetId);
    handleTawkChange('embedSnippet', snippet);
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(tawkSettings.embedSnippet);
      setMessage({ type: 'success', text: 'Script skopírovaný' });
    } catch (error) {
      console.error('Copy failed', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa skopírovať script' });
    }
  };

  const previewUrl = useMemo(() => {
    return `https://embed.tawk.to/${tawkSettings.propertyId || 'PROPERTY_ID'}/${tawkSettings.widgetId || 'WIDGET_ID'}`;
  }, [tawkSettings.propertyId, tawkSettings.widgetId]);

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
    <section className="space-y-6">
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Aktívny live chat</h2>
        <p className="text-sm text-slate-500">
          Vyberte, ktorý poskytovateľ sa má načítať na verejných stránkach. Ostatní poskytovatelia môžu zostať nakonfigurovaní ako záloha.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              activeProvider === 'tawkTo' ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="chat-provider"
              className="mt-1 h-4 w-4"
              checked={activeProvider === 'tawkTo'}
              onChange={() => handleProviderChange('tawkTo')}
            />
            <span>
              <span className="font-semibold text-slate-900 block">Tawk.to</span>
              <span className="text-slate-500 text-xs">Cloudový live chat s rýchlou integráciou cez script.</span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              activeProvider === 'chatwoot' ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="chat-provider"
              className="mt-1 h-4 w-4"
              checked={activeProvider === 'chatwoot'}
              onChange={() => handleProviderChange('chatwoot')}
            />
            <span>
              <span className="font-semibold text-slate-900 block">Chatwoot</span>
              <span className="text-slate-500 text-xs">Open-source live chat hostovaný na vlastnej infraštruktúre.</span>
            </span>
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Návštevníkom sa momentálne načíta: <strong>{activeProvider === 'chatwoot' ? 'Chatwoot' : 'Tawk.to'}</strong>.
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tawk.to</h2>
            <p className="text-sm text-slate-500">
              Script generovaný priamo z Tawk.to. Aktivujte ho, ak chcete používať tento poskytovateľ.
            </p>
          </div>
          {activeProvider === 'tawkTo' && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Aktívny</span>
          )}
        </div>

      <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tawk-enabled"
            checked={tawkSettings.enabled}
            onChange={(e) => handleTawkChange('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="tawk-enabled" className="text-sm font-medium text-slate-700">
            Povoliť tawk.to widget na stránke
          </label>
        </div>

        <p className="text-xs text-slate-500">
          Všetky ďalšie nastavenia (farby, správy, agendi) spravujte v{' '}
          <a
            href="https://dashboard.tawk.to"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline-offset-2 hover:underline"
          >
            Tawk.to dashboarde
          </a>
          .
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Property ID</label>
          <input
            type="text"
            value={tawkSettings.propertyId}
            onChange={(e) => handleTawkChange('propertyId', e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
            placeholder="napr. 692b323c2e3bec197df6f9cb"
          />
          <p className="text-xs text-slate-400">Hodnota z URL: https://tawk.to/chat/&lt;PROPERTY_ID&gt;/&lt;WIDGET_ID&gt;</p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Widget ID</label>
          <input
            type="text"
            value={tawkSettings.widgetId}
            onChange={(e) => handleTawkChange('widgetId', e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
            placeholder="napr. 1jb8cq9d7"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        Widget sa načíta z: <code className="break-all font-mono text-slate-900">{previewUrl}</code>
      </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Embed script</h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={regenerateSnippet}
              >
                Generovať zo zadaných ID
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={copySnippet}
              >
                Kopírovať script
              </button>
            </div>
          </div>
          <textarea
            value={tawkSettings.embedSnippet}
            onChange={(e) => handleTawkChange('embedSnippet', e.target.value)}
            rows={8}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
          />
          <p className="text-xs text-slate-400">
            Script vložte do stránky, ak Tawk.to používate mimo hlavného layoutu (napr. v externých embedoch). V aplikácii sa načíta automaticky.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chatwoot</h2>
            <p className="text-sm text-slate-500">
              Self-hosted alebo cloudový live chat. Zadajte URL inštancie a token web widgetu.
            </p>
          </div>
          {activeProvider === 'chatwoot' && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Aktívny</span>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="chatwoot-enabled"
              checked={chatwootSettings.enabled}
              onChange={(e) => handleChatwootChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="chatwoot-enabled" className="text-sm font-medium text-slate-700">
              Povoliť Chatwoot widget
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Widget sa zobrazí iba v prípade, že je Chatwoot zvolený ako aktívny poskytovateľ a sú vyplnené údaje.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Base URL</label>
            <input
              type="text"
              value={chatwootSettings.baseUrl}
              onChange={(e) => handleChatwootChange('baseUrl', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
              placeholder="https://chat.yourcompany.com"
            />
            <p className="text-xs text-slate-400">URL inštancie Chatwoot (bez koncovej lomky).</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Website token</label>
            <input
              type="text"
              value={chatwootSettings.websiteToken}
              onChange={(e) => handleChatwootChange('websiteToken', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
              placeholder="napr. 6a0f0e1e-b8f9-4c"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Locale</label>
            <input
              type="text"
              value={chatwootSettings.locale}
              onChange={(e) => handleChatwootChange('locale', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="sk, cz, en…"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Pozícia</label>
            <select
              value={chatwootSettings.position}
              onChange={(e) => handleChatwootChange('position', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="right">Vpravo</option>
              <option value="left">Vľavo</option>
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={chatwootSettings.hideMessageBubble}
              onChange={(e) => handleChatwootChange('hideMessageBubble', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Skryť bublinu, kým sa neotvorí widget
          </label>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Vlastný embed script (voliteľné)</h3>
          <p className="text-xs text-slate-500">
            Ak máte vlastný embed script z Chatwoot dashboardu, vložte ho sem.
            Ak je vyplnený, použije sa namiesto automaticky generovaného scriptu.
          </p>
          <textarea
            value={chatwootSettings.embedSnippet || ''}
            onChange={(e) => handleChatwootChange('embedSnippet', e.target.value)}
            rows={8}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
            placeholder={`<script>\n  (function(d,t) {\n    var BASE_URL="http://10.10.40.13:3000";\n    ...\n  })(document,"script");\n</script>`}
          />
          <p className="text-xs text-slate-400">
            Skopírujte celý &lt;script&gt; tag z Chatwoot → Settings → Inboxes → Web Widget.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
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
