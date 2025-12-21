/**
 * CHAT MODULE - Types
 *
 * Konfigurácia live chatu je zjednotená pre viacerých poskytovateľov (Tawk.to, Chatwoot).
 * Backend uchováva iba nastavenia widgetov a aktívneho poskytovateľa.
 */

export type ChatProvider = 'tawkTo' | 'chatwoot';

export type TawkToSettings = {
  enabled: boolean;
  propertyId: string;
  widgetId: string;
  embedSnippet: string;
};

export type ChatwootSettings = {
  enabled: boolean;
  baseUrl: string;
  websiteToken: string;
  locale: string;
  position: 'left' | 'right';
  hideMessageBubble: boolean;
  embedSnippet?: string; // Voliteľný vlastný embed snippet
};

export type ChatSettings = {
  activeProvider: ChatProvider;
  tawkTo: TawkToSettings;
  chatwoot: ChatwootSettings;
};

const DEFAULT_PROPERTY_ID = '692b323c2e3bec197df6f9cb';
const DEFAULT_WIDGET_ID = '1jb8cq9d7';
const DEFAULT_CHATWOOT_BASE_URL = 'https://app.chatwoot.com';

export function createTawkToSnippet(propertyId: string, widgetId: string): string {
  return [
    '<!--Start of Tawk.to Script-->',
    '<script type="text/javascript">',
    'var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();',
    '(function(){',
    "var s1=document.createElement('script'),s0=document.getElementsByTagName('script')[0];",
    's1.async=true;',
    `s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';`,
    "s1.charset='UTF-8';",
    "s1.setAttribute('crossorigin','*');",
    's0.parentNode.insertBefore(s1,s0);',
    '})();',
    '</script>',
    '<!--End of Tawk.to Script-->'
  ].join('\n');
}

export const defaultTawkToSettings: TawkToSettings = {
  enabled: true,
  propertyId: DEFAULT_PROPERTY_ID,
  widgetId: DEFAULT_WIDGET_ID,
  embedSnippet: createTawkToSnippet(DEFAULT_PROPERTY_ID, DEFAULT_WIDGET_ID)
};

export const defaultChatwootSettings: ChatwootSettings = {
  enabled: false,
  baseUrl: DEFAULT_CHATWOOT_BASE_URL,
  websiteToken: '',
  locale: 'sk',
  position: 'right',
  hideMessageBubble: false,
  embedSnippet: ''
};

export const defaultChatSettings: ChatSettings = {
  activeProvider: 'tawkTo',
  tawkTo: defaultTawkToSettings,
  chatwoot: defaultChatwootSettings
};

export function mergeTawkToSettings(payload: Partial<TawkToSettings> | null | undefined): TawkToSettings {
  const propertyId = payload?.propertyId?.trim() || defaultTawkToSettings.propertyId;
  const widgetId = payload?.widgetId?.trim() || defaultTawkToSettings.widgetId;
  const enabled = payload?.enabled ?? defaultTawkToSettings.enabled;
  const embedSnippet = payload?.embedSnippet?.trim() || createTawkToSnippet(propertyId, widgetId);

  return {
    enabled,
    propertyId,
    widgetId,
    embedSnippet
  };
}

export function mergeChatwootSettings(payload: Partial<ChatwootSettings> | null | undefined): ChatwootSettings {
  const rawBase = payload?.baseUrl?.trim() || defaultChatwootSettings.baseUrl;
  const baseUrl = rawBase.replace(/\/+$/, '');
  return {
    enabled: payload?.enabled ?? defaultChatwootSettings.enabled,
    baseUrl: baseUrl || defaultChatwootSettings.baseUrl,
    websiteToken: payload?.websiteToken?.trim() || defaultChatwootSettings.websiteToken,
    locale: payload?.locale?.trim() || defaultChatwootSettings.locale,
    position: payload?.position === 'left' ? 'left' : 'right',
    hideMessageBubble: payload?.hideMessageBubble ?? defaultChatwootSettings.hideMessageBubble,
    embedSnippet: payload?.embedSnippet?.trim() || ''
  };
}

export function mergeChatSettings(payload: Partial<ChatSettings> | null | undefined): ChatSettings {
  const activeProvider: ChatProvider =
    payload?.activeProvider === 'chatwoot' ? 'chatwoot' : 'tawkTo';
  return {
    activeProvider,
    tawkTo: mergeTawkToSettings(payload?.tawkTo),
    chatwoot: mergeChatwootSettings(payload?.chatwoot)
  };
}
