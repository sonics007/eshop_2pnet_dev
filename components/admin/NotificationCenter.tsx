'use client';

import { useEffect, useRef, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info';

export type AdminNotification = {
  id: string;
  message: string;
  type?: NotificationType;
};

export const ADMIN_NOTIFY_EVENT = 'admin-notify';

export function NotificationCenter() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushItem = (item: AdminNotification) => {
    const id = item.id || `${Date.now()}-${Math.random()}`;
    if (seenIds.current.has(id)) return;
    const next = { ...item, id, type: item.type || 'info' };
    seenIds.current.add(id);
    setItems((prev) => [...prev, next]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 5500);
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    const poll = async () => {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          data.data.forEach((item: AdminNotification) => pushItem(item));
        }
      } catch {
        // ignore
      }
    };
    poll();
    pollingRef.current = setInterval(poll, 10000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AdminNotification>).detail;
      if (!detail?.message) return;
      pushItem(detail);
    };

    window.addEventListener(ADMIN_NOTIFY_EVENT, handler as EventListener);
    return () => window.removeEventListener(ADMIN_NOTIFY_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/admin/notifications/stream');

    es.onmessage = (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data) as AdminNotification;
        if (!parsed?.id || seenIds.current.has(parsed.id)) return;
        pushItem(parsed);
      } catch {
        // ignore malformed
      }
    };

    es.onopen = () => {
      stopPolling();
    };

    es.onerror = () => {
      es.close();
      // fallback na polling pri probléme (napr. QUIC/H3)
      startPolling();
      // Silent retry SSE after delay
      setTimeout(() => {
        stopPolling();
        const retry = new EventSource('/api/admin/notifications/stream');
        retry.onmessage = es.onmessage;
        retry.onerror = es.onerror;
        retry.onopen = es.onopen;
      }, 5000);
    };

    return () => {
      es.close();
      stopPolling();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex max-w-sm flex-col gap-2">
      {items.map((item) => {
        const colorClasses =
          item.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : item.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-slate-200 bg-white text-slate-900';
        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg ${colorClasses}`}
          >
            {item.message}
          </div>
        );
      })}
    </div>
  );
}
