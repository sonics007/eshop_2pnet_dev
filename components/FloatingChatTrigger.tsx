'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import type { ChatScheduleEntry, ChatSettings } from '@/lib/chatSettingsShared';

type FormState = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

const DEFAULT_TIMEZONE = 'Europe/Bratislava';

const copy = {
  sk: {
    button: 'Live chat',
    titleOnline: 'Sme online',
    titleOffline: 'Zanechajte správu',
    name: 'Meno a priezvisko',
    phone: 'Telefón',
    email: 'E-mail',
    message: 'Vaša otázka',
    send: 'Odoslať správu',
    sending: 'Odosielame…',
    success: 'Správa bola odoslaná. Ozveme sa čo najskôr.',
    error: 'Nepodarilo sa odoslať správu. Skúste neskôr.',
    offlineNote: 'Momentálne sme offline. Správa pôjde na e-mail administrátora.',
    channelMissing: 'Komunikačný kanál zatiaľ nie je dokončený – použije sa e-mail.',
    scheduleLabel: 'Online hodiny',
    scheduleTodayOnline: 'Dnes aktívne',
    scheduleTodayOffline: 'Dnes mimo pracovných hodín',
    scheduleFallback: 'Online hodiny ešte nie sú nastavené.',
    loading: 'Načítavam nastavenie…',
    alwaysOnlineInfo: 'Podpora reaguje nonstop – správa smeruje priamo do vybraného kanála.',
    empty: 'Napíšte svoju otázku.'
  },
  cz: {
    button: 'Live chat',
    titleOnline: 'Jsme online',
    titleOffline: 'Zanechte zprávu',
    name: 'Jméno a příjmení',
    phone: 'Telefon',
    email: 'E-mail',
    message: 'Vaše otázka',
    send: 'Odeslat zprávu',
    sending: 'Odesíláme…',
    success: 'Zpráva byla odeslána. Ozveme se co nejdříve.',
    error: 'Nepodařilo se odeslat zprávu. Zkuste to později.',
    offlineNote: 'Právě nejsme online. Zprávu přepošleme na e-mail administrátora.',
    channelMissing: 'Komunikační kanál zatím není připraven – použije se e-mail.',
    scheduleLabel: 'Online hodiny',
    scheduleTodayOnline: 'Dnes aktivní',
    scheduleTodayOffline: 'Dnes mimo pracovní dobu',
    scheduleFallback: 'Online hodiny zatím nejsou nastavené.',
    loading: 'Načítám nastavení…',
    alwaysOnlineInfo: 'Podpora je dostupná 24/7 – zpráva jde přímo do zvoleného kanálu.',
    empty: 'Napište svou otázku.'
  }
} as const;

const weekdayLabels = {
  sk: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
  cz: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
} as const;

const weekdayMap: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

const initialForm: FormState = {
  name: '',
  phone: '',
  email: '',
  message: ''
};

type ChatMessage = {
  id: number;
  direction: 'visitor' | 'agent';
  content: string;
  createdAt: string;
};

const sessionStorageKey = 'chat-session-key';
const profileStorageKey = 'chat-profile-complete';

type ZonedSnapshot = {
  day: number;
  minutes: number;
};

function parseTimeToMinutes(value: string) {
  if (!value) return 0;
  const [hours = '0', minutes = '0'] = value.split(':');
  const h = Number.parseInt(hours, 10);
  const m = Number.parseInt(minutes, 10);
  return h * 60 + m;
}

function getZonedSnapshot(timezone: string, timestamp: number): ZonedSnapshot | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const parts = formatter.formatToParts(new Date(timestamp));
    let weekday = 'sun';
    let hours = 0;
    let minutes = 0;
    parts.forEach((part) => {
      if (part.type === 'weekday') {
        weekday = part.value.toLowerCase();
      }
      if (part.type === 'hour') {
        hours = Number.parseInt(part.value, 10);
      }
      if (part.type === 'minute') {
        minutes = Number.parseInt(part.value, 10);
      }
    });
    const day = weekdayMap[weekday.slice(0, 3)];
    if (typeof day === 'undefined') {
      return null;
    }
    return { day, minutes: hours * 60 + minutes };
  } catch {
    return null;
  }
}

function isSlotActive(slot: ChatScheduleEntry, snapshot: ZonedSnapshot) {
  const startMinutes = parseTimeToMinutes(slot.start);
  const endMinutes = parseTimeToMinutes(slot.end);
  return snapshot.day === slot.day && snapshot.minutes >= startMinutes && snapshot.minutes < endMinutes;
}

function resolveIsOnline(settings: ChatSettings | null, snapshot: ZonedSnapshot | null) {
  if (!settings) return true;
  if (settings.alwaysOnline) return true;
  if (!settings.onlineHours?.length || !snapshot) {
    return true;
  }
  return settings.onlineHours.some((slot) => isSlotActive(slot, snapshot));
}

function findTodaySlot(settings: ChatSettings | null, snapshot: ZonedSnapshot | null) {
  if (!snapshot || !settings?.onlineHours?.length || settings.alwaysOnline) return null;
  return settings.onlineHours.find((slot) => slot.day === snapshot.day) ?? null;
}

export function FloatingChatTrigger() {
  const { language } = useLanguage();
  const text = copy[language];
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesFetcherRef = useRef<(() => Promise<void>) | null>(null);
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored = window.localStorage.getItem(sessionStorageKey);
    if (!stored) {
      const generated =
        typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function'
          ? window.crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      window.localStorage.setItem(sessionStorageKey, generated);
      stored = generated;
    }
    setSessionKey(stored);
    const profileStored = window.localStorage.getItem(profileStorageKey);
    if (profileStored === 'true') {
      setProfileComplete(true);
    }
  }, []);

  const markProfileComplete = () => {
    setProfileComplete(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(profileStorageKey, 'true');
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/chat/settings');
        if (!response.ok) throw new Error('settings_http_error');
        const payload = (await response.json()) as ChatSettings;
        if (mounted) {
          setSettings(payload);
        }
      } catch (error) {
        console.error('Chat settings load failed', error);
        if (mounted) {
          setSettings(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionKey) return;
    let active = true;
    let fetching = false;

    const fetchMessages = async () => {
      if (!sessionKey || fetching) return;
      fetching = true;
      try {
        const response = await fetch(`/api/chat/session/${sessionKey}/messages`);
        if (!response.ok) throw new Error('messages_fetch_failed');
        const data = await response.json();
        if (active) {
          const allMessages = data.messages ?? [];
          setMessages(allMessages);
          if (!profileComplete && allMessages.some((message) => message.direction === 'visitor')) {
            markProfileComplete();
          }
        }
      } catch (error) {
        if (active) {
          console.error('Chat messages fetch failed', error);
        }
      } finally {
        fetching = false;
      }
    };

    messagesFetcherRef.current = fetchMessages;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionKey, profileComplete]);

  useEffect(() => {
    const interval = window.setInterval(() => setTimestamp(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const timezone = settings?.timezone || DEFAULT_TIMEZONE;
  const snapshot = useMemo(() => getZonedSnapshot(timezone, timestamp), [timezone, timestamp]);
  const isOnline = useMemo(() => resolveIsOnline(settings, snapshot), [settings, snapshot]);
  const todaySlot = useMemo(() => findTodaySlot(settings, snapshot), [settings, snapshot]);
  const channelType = settings?.channelType === 'messenger' ? 'messenger' : 'telegram';
  const channelLabel = channelType === 'messenger' ? 'Messenger' : 'Telegram';
  const telegramTarget = settings?.telegramGroupId || settings?.telegramChatId;
  const channelReady =
    channelType === 'messenger'
      ? Boolean(settings?.messengerPageToken && settings?.messengerRecipientId)
      : Boolean(settings?.telegramBotToken && telegramTarget);
  const showOfflineNote = !isOnline && !settings?.alwaysOnline;

  const handleChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || !sessionKey) return;
    if (!form.message.trim()) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }
    setStatus('sending');
    const useLiveChannel = isOnline && channelReady;
    const endpoint = useLiveChannel
      ? channelType === 'messenger'
        ? '/api/chat/send-messenger'
        : '/api/chat/send-telegram'
      : '/api/chat/send-email';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sessionKey })
      });
      if (!response.ok) throw new Error('chat_request_failed');
      const data = await response.json().catch(() => ({}));
      if (data?.sessionKey && typeof data.sessionKey === 'string' && data.sessionKey !== sessionKey) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(sessionStorageKey, data.sessionKey);
        }
        setSessionKey(data.sessionKey);
      }
      if (!profileComplete) {
        markProfileComplete();
      }
      setStatus('success');
      setForm((prev) => ({ ...prev, message: '' }));
      messagesFetcherRef.current?.();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Chat submit failed', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-sm">
      {isOpen && (
        <div className="mb-3 w-80 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {isOnline ? text.titleOnline : text.titleOffline}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {channelLabel}
                {settings?.whatsappNumber ? ` · ${settings.whatsappNumber}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100"
              aria-label="Zavrieť chat"
            >
              ×
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">{text.scheduleLabel}</p>
            {loading ? (
              <p className="mt-1">{text.loading}</p>
            ) : settings?.alwaysOnline ? (
              <p className="mt-1">{text.alwaysOnlineInfo}</p>
            ) : todaySlot ? (
              <p className="mt-1">
                {(isOnline ? text.scheduleTodayOnline : text.scheduleTodayOffline) + ' '}
                {weekdayLabels[language][todaySlot.day]} {todaySlot.start} – {todaySlot.end}
              </p>
            ) : (
              <p className="mt-1">{text.scheduleFallback}</p>
            )}
          </div>

          {showOfflineNote && <p className="mt-3 text-xs text-slate-500">{text.offlineNote}</p>}
          {!channelReady && (
            <p className="mt-2 text-xs text-amber-600">{text.channelMissing}</p>
          )}

          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500">{text.empty}</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'visitor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.direction === 'visitor'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <span className="mt-1 block text-[10px] opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString(
                        language === 'cz' ? 'cs-CZ' : 'sk-SK',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            {!profileComplete && (
              <>
                <input
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder={text.name}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <input
                  required
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder={text.phone}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder={text.email}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </>
            )}
            <textarea
              required
              value={form.message}
              onChange={handleChange('message')}
              placeholder={text.message}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'sending' || !sessionKey}
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {status === 'sending' ? text.sending : text.send}
            </button>
            {status === 'success' && <p className="text-xs text-emerald-600">{text.success}</p>}
            {status === 'error' && <p className="text-xs text-rose-600">{text.error}</p>}
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} ring-2 ring-white/30`}
        ></span>
        {text.button}
      </button>
    </div>
  );
}




