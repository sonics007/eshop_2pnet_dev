import { readConfig, writeConfig } from '@/lib/configStore';

export type StoredAdminNotification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: number;
};

const CONFIG_KEY = 'admin-notifications';
const MAX_ITEMS = 50;

async function readStore(): Promise<StoredAdminNotification[]> {
  const stored = await readConfig<StoredAdminNotification[]>(CONFIG_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export async function addAdminNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const current = await readStore();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const next = [{ id, message, type, createdAt: Date.now() }, ...current].slice(0, MAX_ITEMS);
  await writeConfig(CONFIG_KEY, next);
  return next;
}

export async function getAdminNotifications(): Promise<StoredAdminNotification[]> {
  return readStore();
}
