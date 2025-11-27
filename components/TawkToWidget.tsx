'use client';

/**
 * TAWK.TO WIDGET
 *
 * Dynamicky načítava tawk.to chat widget podľa nastavení.
 * Pridať do layout.tsx pre zobrazenie na všetkých stránkach.
 */

import { useEffect, useState } from 'react';
import type { TawkToSettings } from '@/lib/modules/chat';

// Deklarácia pre TypeScript
declare global {
  interface Window {
    Tawk_API?: {
      hideWidget?: () => void;
      showWidget?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      popup?: () => void;
      getWindowType?: () => string;
      getStatus?: () => string;
      isChatMaximized?: () => boolean;
      isChatMinimized?: () => boolean;
      isChatHidden?: () => boolean;
      isChatOngoing?: () => boolean;
      isVisitorEngaged?: () => boolean;
      onLoaded?: () => void;
      onBeforeLoaded?: () => void;
      onStatusChange?: (status: string) => void;
      onChatMaximized?: () => void;
      onChatMinimized?: () => void;
      onChatHidden?: () => void;
      onChatStarted?: () => void;
      onChatEnded?: () => void;
      setAttributes?: (attributes: Record<string, string>, callback?: (error?: Error) => void) => void;
      addEvent?: (event: string, metadata?: Record<string, string>, callback?: (error?: Error) => void) => void;
      addTags?: (tags: string[], callback?: (error?: Error) => void) => void;
      removeTags?: (tags: string[], callback?: (error?: Error) => void) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

interface TawkToWidgetProps {
  // Voliteľné - ak nie sú poskytnuté, načíta sa z API
  propertyId?: string;
  widgetId?: string;
}

export function TawkToWidget({ propertyId, widgetId }: TawkToWidgetProps) {
  const [settings, setSettings] = useState<TawkToSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Načítaj nastavenia z API ak nie sú poskytnuté
  useEffect(() => {
    if (propertyId && widgetId) {
      setSettings({ enabled: true, propertyId, widgetId });
      return;
    }

    // Použijeme rovnaký cache ako FloatingChatTrigger
    const cacheKey = 'chat-settings-cache';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.tawkTo) {
          setSettings(data.tawkTo);
          return;
        }
      } catch { /* ignore */ }
    }

    async function loadSettings() {
      try {
        const response = await fetch('/api/chat/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.tawkTo) {
            setSettings(data.tawkTo);
          }
        }
      } catch (error) {
        console.error('Failed to load tawk.to settings:', error);
      }
    }

    loadSettings();
  }, [propertyId, widgetId]);

  // Načítaj tawk.to script
  useEffect(() => {
    if (!settings?.enabled || !settings.propertyId || !settings.widgetId || loaded) {
      return;
    }

    // Skontroluj či už nie je načítaný
    if (window.Tawk_API) {
      setLoaded(true);
      return;
    }

    const scriptId = 'tawkto-script';
    if (document.getElementById(scriptId)) {
      setLoaded(true);
      return;
    }

    // Inicializácia tawk.to
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://embed.tawk.to/${settings.propertyId}/${settings.widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    script.onload = () => {
      setLoaded(true);
    };

    script.onerror = () => {
      // Tawk.to widget sa nepodarilo načítať
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      // Tawk.to nemá official unload, ale môžeme skryť widget
      if (window.Tawk_API?.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, [settings, loaded]);

  // Komponent nerenderuje nič vizuálne - tawk.to sa stará o vlastný UI
  return null;
}

export default TawkToWidget;
