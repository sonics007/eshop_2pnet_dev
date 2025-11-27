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

type ChatMessage = {
  id: number;
  direction: 'visitor' | 'agent';
  content: string;
  createdAt: string;
};

const DEFAULT_TIMEZONE = 'Europe/Bratislava';
const sessionStorageKey = 'chat-session-key';
const profileStorageKey = 'chat-profile-complete';

const copy = {
  sk: {
    button: 'Live chat',
    titleOnline: 'Sme online',
    titleOffline: 'Zanechajte spravu',
    name: 'Meno a priezvisko',
    phone: 'Telefon',
    email: 'E-mail',
    message: 'Vasa otazka',
    send: 'Odoslat spravu',
    sending: 'Odosielame...',
    success: 'Sprava bola odoslana. Ozveme sa co najskor.',
    error: 'Nepodarilo sa odoslat spravu. Skuste neskor.',
    offlineNote: 'Sprava pojde na e-mail administratora.',
    scheduleLabel: 'Online hodiny',
    scheduleTodayOnline: 'Dnes aktivne',
    scheduleTodayOffline: 'Dnes mimo pracovnych hodin',
    scheduleFallback: 'Online hodiny este nie su nastavene.',
    loading: 'Nacitavam nastavenie...',
    alwaysOnlineInfo: 'Podpora reaguje nonstop - sprava smeruje na admin e-mail.',
    empty: 'Napiste svoju otazku.'
  },
  cz: {
    button: 'Live chat',
    titleOnline: 'Jsme online',
    titleOffline: 'Zanechte zpravu',
    name: 'Jmeno a prijmeni',
    phone: 'Telefon',
    email: 'E-mail',
    message: 'Vase otazka',
    send: 'Odeslat zpravu',
    sending: 'Odesilame...',
    success: 'Zprava byla odeslana. Ozveme se co nejdrive.',
    error: 'Nepodarilo se odeslat zpravu. Zkuste to pozdeji.',
    offlineNote: 'Zpravu preposleme na e-mail administratora.',
    scheduleLabel: 'Online hodiny',
    scheduleTodayOnline: 'Dnes aktivni',
    scheduleTodayOffline: 'Dnes mimo pracovni dobu',
    scheduleFallback: 'Online hodiny zatim nejsou nastavene.',
    loading: 'Nacitam nastaveni...',
    alwaysOnlineInfo: 'Podpora je dostupna 24/7 - zprava ide na admin e-mail.',
    empty: 'Napiste svou otazku.'
  }
} as const;

const weekdayLabels = {
  sk: ['Nedela', 'Pondelok', 'Utorok', 'Streda', 'Stvrtok', 'Piatok', 'Sobota'],
  cz: ['Nedele', 'Pondeli', 'Utery', 'Streda', 'Ctvrtek', 'Patek', 'Sobota']
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
    // Použijeme sessionStorage cache pre rýchlejšie načítanie
    const cacheKey = 'chat-settings-cache';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        setSettings(JSON.parse(cached));
        setLoading(false);
        return;
      } catch { /* ignore */ }
    }
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/chat/settings');
        if (!response.ok) throw new Error('settings_http_error');
        const payload = (await response.json()) as ChatSettings;
        if (mounted) {
          setSettings(payload);
          sessionStorage.setItem(cacheKey, JSON.stringify(payload));
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
          if (!profileComplete && allMessages.some((message: ChatMessage) => message.direction === 'visitor')) {
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
  const showOfflineNote = !isOnline && !settings?.alwaysOnline;

  const handleChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || !sessionKey) return;
    if (!form.message.trim()) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
      return;
    }
    setStatus('sending');
    const endpoint = '/api/chat/send-email';
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
      setTimeout(() => setStatus('idle'), 1500);
    } catch (error) {
      console.error('Chat submit failed', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
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
              <p className="text-lg font-semibold text-slate-900">Live chat</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100"
              aria-label="Zavriet chat"
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
              <p className="mt-1 text-emerald-600">
                {text.scheduleTodayOnline}: {todaySlot.start} - {todaySlot.end}
              </p>
            ) : settings?.onlineHours?.length ? (
              <p className="mt-1 text-slate-600">{text.scheduleTodayOffline}</p>
            ) : (
              <p className="mt-1 text-slate-600">{text.scheduleFallback}</p>
            )}
          </div>

          {showOfflineNote && <p className="mt-2 text-xs text-slate-500">{text.offlineNote}</p>}

          <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
            {!profileComplete && (
              <>
                <input
                  value={form.name}
                  onChange={handleChange('name')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder={text.name}
                />
                <input
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder={text.phone}
                />
                <input
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder={text.email}
                />
              </>
            )}
            <textarea
              value={form.message}
              onChange={handleChange('message')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              rows={3}
              placeholder={text.message}
            />
            {messages.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                {messages.map((m) => (
                  <div key={m.id} className={`mb-1 ${m.direction === 'agent' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <span className="font-semibold">{m.direction === 'agent' ? 'Podpora: ' : 'Vy: '}</span>
                    {m.content}
                  </div>
                ))}
              </div>
            )}
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
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        <span>💬</span>
        {copy[language].button}
      </button>
    </div>
  );
}
