import path from 'path';
import type { AdminMenuItem } from '@/lib/adminMenuDefaults';
import { defaultAdminMenu } from '@/lib/adminMenuDefaults';
import { readConfig, writeConfig } from '@/lib/configStore';

const CONFIG_KEY = 'admin-menu';
const legacyPath = path.join(process.cwd(), 'data', 'adminMenu.json');

export async function readAdminMenu(): Promise<AdminMenuItem[]> {
  const stored = await readConfig<AdminMenuItem[]>(CONFIG_KEY, defaultAdminMenu, legacyPath);
  return Array.isArray(stored) && stored.length ? stored : defaultAdminMenu;
}

export async function writeAdminMenu(menu: AdminMenuItem[]) {
  await writeConfig(CONFIG_KEY, menu);
}
