export type AdminNotificationPayload = {
  message: string;
  type?: 'success' | 'error' | 'info';
};

export function emitAdminNotification(payload: AdminNotificationPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('admin-notify', {
      detail: payload
    })
  );
}

export async function postAdminNotification(payload: AdminNotificationPayload) {
  try {
    await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send admin notification', error);
  }
}
