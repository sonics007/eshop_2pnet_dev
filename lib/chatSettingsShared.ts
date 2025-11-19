export type ChatScheduleEntry = {
  day: number; // 0 = nedeľa ... 6 = sobota
  start: string; // HH:mm
  end: string; // HH:mm
};

export type ChatSettings = {
  whatsappNumber: string;
  adminEmail: string;
  timezone?: string;
  onlineHours?: ChatScheduleEntry[];
  alwaysOnline?: boolean;
  channelType?: 'telegram' | 'messenger' | 'whatsapp' | 'imessage';
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramGroupId?: string;
  messengerPageToken?: string;
  messengerRecipientId?: string;
  imessageAddress?: string;
};

export const defaultChatSettings: ChatSettings = {
  whatsappNumber: '',
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
  channelType: 'telegram',
  telegramBotToken: '',
  telegramChatId: '',
  telegramGroupId: '',
  messengerPageToken: '',
  messengerRecipientId: '',
  imessageAddress: ''
};

export function mergeChatSettings(payload: Partial<ChatSettings> | null | undefined): ChatSettings {
  const base = payload ?? {};
  return {
    whatsappNumber: base.whatsappNumber ?? defaultChatSettings.whatsappNumber,
    adminEmail: base.adminEmail ?? defaultChatSettings.adminEmail,
    timezone: base.timezone ?? defaultChatSettings.timezone,
    onlineHours: base.onlineHours ?? defaultChatSettings.onlineHours,
    alwaysOnline: base.alwaysOnline ?? defaultChatSettings.alwaysOnline,
    channelType: ((): ChatSettings['channelType'] => {
      switch (base.channelType) {
        case 'messenger':
        case 'whatsapp':
        case 'imessage':
          return base.channelType;
        default:
          return 'telegram';
      }
    })(),
    telegramBotToken: base.telegramBotToken ?? defaultChatSettings.telegramBotToken,
    telegramChatId: base.telegramChatId ?? defaultChatSettings.telegramChatId,
    telegramGroupId: base.telegramGroupId ?? defaultChatSettings.telegramGroupId,
    messengerPageToken: base.messengerPageToken ?? defaultChatSettings.messengerPageToken,
    messengerRecipientId: base.messengerRecipientId ?? defaultChatSettings.messengerRecipientId,
    imessageAddress: base.imessageAddress ?? defaultChatSettings.imessageAddress
  };
}

