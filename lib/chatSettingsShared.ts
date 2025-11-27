export type ChatScheduleEntry = {
  day: number; // 0 = nedeľa ... 6 = sobota
  start: string; // HH:mm
  end: string; // HH:mm
};

// Tawk.to konfigurácia
export type TawkToSettings = {
  enabled: boolean;
  propertyId: string;
  widgetId: string;
};

export type ChatSettings = {
  // Základné nastavenia
  adminEmail: string;
  timezone?: string;

  // Online hodiny
  onlineHours?: ChatScheduleEntry[];
  alwaysOnline?: boolean;

  // Email nastavenia
  emailSubjectPrefix?: string;
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;

  // Tawk.to integrácia
  tawkTo?: TawkToSettings;
};

export const defaultTawkToSettings: TawkToSettings = {
  enabled: false,
  propertyId: '',
  widgetId: ''
};

export const defaultChatSettings: ChatSettings = {
  adminEmail: '',
  timezone: 'Europe/Bratislava',
  onlineHours: [
    { day: 1, start: '08:00', end: '16:00' },
    { day: 2, start: '08:00', end: '16:00' },
    { day: 3, start: '08:00', end: '16:00' },
    { day: 4, start: '08:00', end: '16:00' },
    { day: 5, start: '08:00', end: '15:00' }
  ],
  alwaysOnline: false,
  emailSubjectPrefix: '[Eshop Chat]',
  autoReplyEnabled: false,
  autoReplyMessage: 'Ďakujeme za vašu správu. Ozveme sa vám čo najskôr.',
  tawkTo: defaultTawkToSettings
};

export function mergeTawkToSettings(payload: Partial<TawkToSettings> | null | undefined): TawkToSettings {
  const base = payload ?? {};
  return {
    enabled: base.enabled ?? defaultTawkToSettings.enabled,
    propertyId: base.propertyId ?? defaultTawkToSettings.propertyId,
    widgetId: base.widgetId ?? defaultTawkToSettings.widgetId
  };
}

export function mergeChatSettings(payload: Partial<ChatSettings> | null | undefined): ChatSettings {
  const base = payload ?? {};
  return {
    adminEmail: base.adminEmail ?? defaultChatSettings.adminEmail,
    timezone: base.timezone ?? defaultChatSettings.timezone,
    onlineHours: base.onlineHours ?? defaultChatSettings.onlineHours,
    alwaysOnline: base.alwaysOnline ?? defaultChatSettings.alwaysOnline,
    emailSubjectPrefix: base.emailSubjectPrefix ?? defaultChatSettings.emailSubjectPrefix,
    autoReplyEnabled: base.autoReplyEnabled ?? defaultChatSettings.autoReplyEnabled,
    autoReplyMessage: base.autoReplyMessage ?? defaultChatSettings.autoReplyMessage,
    tawkTo: mergeTawkToSettings(base.tawkTo)
  };
}
