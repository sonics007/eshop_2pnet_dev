'use client';

/**
 * CHAT WIDGET LOADER
 *
 * Dynamicky načítava Tawk.to alebo Chatwoot podľa admin nastavení.
 * Komponent nerenderuje UI; stará sa iba o inject scriptu a jeho viditeľnosť.
 */

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatProvider, ChatSettings, ChatwootSettings, TawkToSettings } from '@/lib/modules/chat';
import { createTawkToSnippet, defaultChatSettings } from '@/lib/modules/chat';

declare global {
  interface Window {
    Tawk_API?: {
      hideWidget?: () => void;
      showWidget?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      onLoaded?: () => void;
    };
    Tawk_LoadStart?: Date;
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      hide?: () => void;
      show?: () => void;
      toggle?: () => void;
    };
    chatwootSettings?: {
      locale?: string;
      position?: 'left' | 'right';
      hideMessageBubble?: boolean;
    };
  }
}

type ChatWidgetProps = {
  propertyId?: string;
  widgetId?: string;
  provider?: ChatProvider;
};

const normalizeSettings = (payload: Partial<ChatSettings> | null | undefined): ChatSettings | null => {
  if (!payload) return null;
  const activeProvider: ChatProvider = payload.activeProvider === 'chatwoot' ? 'chatwoot' : 'tawkTo';
  const tawk: TawkToSettings = {
    enabled: payload.tawkTo?.enabled ?? defaultChatSettings.tawkTo.enabled,
    propertyId: payload.tawkTo?.propertyId ?? defaultChatSettings.tawkTo.propertyId,
    widgetId: payload.tawkTo?.widgetId ?? defaultChatSettings.tawkTo.widgetId,
    embedSnippet:
      payload.tawkTo?.embedSnippet?.trim() ||
      createTawkToSnippet(
        payload.tawkTo?.propertyId ?? defaultChatSettings.tawkTo.propertyId,
        payload.tawkTo?.widgetId ?? defaultChatSettings.tawkTo.widgetId
      )
  };
  const chatwoot: ChatwootSettings = {
    enabled: payload.chatwoot?.enabled ?? defaultChatSettings.chatwoot.enabled,
    baseUrl: (payload.chatwoot?.baseUrl || defaultChatSettings.chatwoot.baseUrl).replace(/\/+$/, ''),
    websiteToken: payload.chatwoot?.websiteToken ?? defaultChatSettings.chatwoot.websiteToken,
    locale: payload.chatwoot?.locale ?? defaultChatSettings.chatwoot.locale,
    position: payload.chatwoot?.position === 'left' ? 'left' : 'right',
    hideMessageBubble: payload.chatwoot?.hideMessageBubble ?? defaultChatSettings.chatwoot.hideMessageBubble,
    embedSnippet: payload.chatwoot?.embedSnippet?.trim() || ''
  };
  return {
    activeProvider,
    tawkTo: tawk,
    chatwoot
  };
};

export function ChatWidget({ propertyId, widgetId, provider: providerOverride }: ChatWidgetProps) {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [tawkLoaded, setTawkLoaded] = useState(false);
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');

  const tawkSettings = useMemo<TawkToSettings>(() => {
    const base = settings?.tawkTo ?? defaultChatSettings.tawkTo;
    if (propertyId && widgetId) {
      return {
        enabled: true,
        propertyId,
        widgetId,
        embedSnippet: createTawkToSnippet(propertyId, widgetId)
      };
    }
    return base;
  }, [settings?.tawkTo, propertyId, widgetId]);

  const chatwootSettings = settings?.chatwoot ?? defaultChatSettings.chatwoot;

  // Ak nie sú nastavenia načítané, nepoužívame default - čakáme na API
  const activeProvider: ChatProvider | null =
    providerOverride ?? (settingsLoaded ? settings?.activeProvider ?? null : null);

  // Load settings priamo z API – bez klientskych cache, aby sa zmeny prejavili okamžite
  useEffect(() => {
    let abort = false;

    async function load() {
      try {
        const response = await fetch('/api/chat/settings', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch chat settings');
        const data = await response.json();
        const normalized = normalizeSettings(data);
        if (!abort) {
          if (normalized) {
            setSettings(normalized);
          }
          setSettingsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load chat settings:', error);
        if (!abort) {
          setSettingsLoaded(true);
        }
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, []);

  // React to admin navigation to hide the active widget
  useEffect(() => {
    if (!isAdminPage) return;
    if (activeProvider === 'tawkTo') {
      window.Tawk_API?.hideWidget?.();
    } else if (activeProvider === 'chatwoot') {
      window.$chatwoot?.hide?.();
    }
  }, [isAdminPage, activeProvider]);

  // Load Tawk.to when active
  useEffect(() => {
    // Čakáme na načítanie nastavení
    if (activeProvider === null) {
      return;
    }

    // Ak nie je Tawk.to aktívny, úplne ho odstráň
    if (activeProvider !== 'tawkTo') {
      // Odstráň script z DOM
      const existingScript = document.getElementById('tawkto-script');
      if (existingScript) {
        existingScript.remove();
      }
      // Odstráň Tawk.to iframe a widget z DOM
      const tawkIframes = document.querySelectorAll('iframe[src*="tawk.to"]');
      tawkIframes.forEach((iframe) => iframe.remove());
      const tawkWidgets = document.querySelectorAll('[class*="tawk"], [id*="tawk"]');
      tawkWidgets.forEach((el) => el.remove());
      // Vyčisti window objekty
      if (window.Tawk_API) {
        delete window.Tawk_API;
      }
      if (window.Tawk_LoadStart) {
        delete window.Tawk_LoadStart;
      }
      setTawkLoaded(false);
      return;
    }

    if (isAdminPage) {
      window.Tawk_API?.hideWidget?.();
      return;
    }

    if (!tawkSettings.enabled || !tawkSettings.propertyId || !tawkSettings.widgetId || tawkLoaded) {
      if (window.Tawk_API?.showWidget) {
        window.Tawk_API.showWidget();
      }
      return;
    }

    if (window.Tawk_API) {
      setTawkLoaded(true);
      window.Tawk_API.showWidget?.();
      return;
    }

    const scriptId = 'tawkto-script';
    if (document.getElementById(scriptId)) {
      setTawkLoaded(true);
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    window.Tawk_API.onLoaded = () => {
      if (window.location.pathname.startsWith('/admin')) {
        window.Tawk_API?.hideWidget?.();
      }
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkSettings.propertyId}/${tawkSettings.widgetId}`;
    script.setAttribute('charset', 'UTF-8');
    script.setAttribute('crossorigin', '*');
    script.onload = () => setTawkLoaded(true);
    document.head.appendChild(script);

    return () => {
      window.Tawk_API?.hideWidget?.();
    };
  }, [activeProvider, isAdminPage, tawkSettings, tawkLoaded]);

  // Load Chatwoot when active
  useEffect(() => {
    // Čakáme na načítanie nastavení
    if (activeProvider === null) {
      return;
    }

    if (activeProvider !== 'chatwoot') {
      window.$chatwoot?.hide?.();
      return;
    }

    if (isAdminPage) {
      window.$chatwoot?.hide?.();
      return;
    }

    if (!chatwootSettings.enabled) {
      return;
    }

    const scriptId = 'chatwoot-sdk';

    // Ak máme vlastný embed snippet, použijeme ho
    if (chatwootSettings.embedSnippet?.trim()) {
      if (document.getElementById(scriptId)) {
        // Script už bol načítaný
        return;
      }

      // Extrahuj obsah scriptu (odstráň <script> tagy)
      const snippetContent = chatwootSettings.embedSnippet
        .replace(/<script[^>]*>/gi, '')
        .replace(/<\/script>/gi, '')
        .trim();

      if (!snippetContent) return;

      const script = document.createElement('script');
      script.id = scriptId;
      script.textContent = snippetContent;
      document.head.appendChild(script);

      return () => {
        window.$chatwoot?.hide?.();
      };
    }

    // Fallback: Štandardné načítanie cez SDK (vyžaduje baseUrl a websiteToken)
    if (!chatwootSettings.baseUrl || !chatwootSettings.websiteToken) {
      return;
    }

    const baseUrl = chatwootSettings.baseUrl.replace(/\/+$/, '');
    window.chatwootSettings = {
      locale: chatwootSettings.locale,
      position: chatwootSettings.position,
      hideMessageBubble: chatwootSettings.hideMessageBubble
    };
    const runSDK = () => {
      window.chatwootSDK?.run({
        websiteToken: chatwootSettings.websiteToken,
        baseUrl
      });
    };

    if (window.chatwootSDK) {
      runSDK();
      return;
    }

    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.onload = runSDK;
    script.onerror = () => {
      console.error('Chatwoot SDK failed to load');
    };
    document.head.appendChild(script);

    return () => {
      window.$chatwoot?.hide?.();
    };
  }, [activeProvider, chatwootSettings, isAdminPage]);

  return null;
}

export default ChatWidget;
