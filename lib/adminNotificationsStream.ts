type AdminNotificationMessage = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type Subscriber = {
  send: (msg: AdminNotificationMessage) => void;
  close: () => void;
};

const encoder = new TextEncoder();

const getRegistry = (): Set<Subscriber> => {
  // @ts-expect-error attach to global to persist between route handlers in dev
  if (!globalThis.__adminNotifySubscribers) {
    // @ts-expect-error
    globalThis.__adminNotifySubscribers = new Set<Subscriber>();
  }
  // @ts-expect-error
  return globalThis.__adminNotifySubscribers as Set<Subscriber>;
};

export function broadcastAdminNotification(message: AdminNotificationMessage) {
  const subs = getRegistry();
  subs.forEach((sub) => {
    try {
      sub.send(message);
    } catch {
      // ignore broken subscriber
      subs.delete(sub);
      try {
        sub.close();
      } catch {
        // ignore
      }
    }
  });
}

export function registerAdminSubscriber(controller: ReadableStreamDefaultController, abortSignal?: AbortSignal) {
  const subs = getRegistry();

  const send = (msg: AdminNotificationMessage) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
  };

  const close = () => {
    try {
      controller.close();
    } catch {
      // ignore
    }
  };

  const subscriber: Subscriber = { send, close };
  subs.add(subscriber);

  const pingInterval = setInterval(() => {
    try {
      controller.enqueue(encoder.encode(': ping\n\n'));
    } catch {
      // ignore
    }
  }, 25000);

  const remove = () => {
    clearInterval(pingInterval);
    subs.delete(subscriber);
    close();
  };

  if (abortSignal) {
    abortSignal.addEventListener('abort', remove, { once: true });
  }

  return { send, remove };
}
