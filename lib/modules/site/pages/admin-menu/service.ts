/**
 * ADMIN MENU MODULE - Service
 * Služba pre správu admin menu nastavení
 *
 * Automaticky zlučuje nové položky z defaultov s uloženými nastaveniami
 */

import { prisma } from '@/lib/prisma';
import { AdminMenuSettings, AdminMenuItem, defaultAdminMenuSettings } from './types';

const CONFIG_KEY = 'admin-menu';

/**
 * Zlúči uložené položky s defaultnými - pridá nové položky z defaultov
 */
function mergeMenuItems(saved: AdminMenuItem[], defaults: AdminMenuItem[]): AdminMenuItem[] {
  const result: AdminMenuItem[] = [];
  const savedIds = new Set(saved.map(item => item.id));

  // Najprv pridaj všetky uložené položky
  for (const savedItem of saved) {
    const defaultItem = defaults.find(d => d.id === savedItem.id);

    // Zlúč children ak existujú
    let mergedChildren = savedItem.children;
    if (defaultItem?.children && savedItem.children) {
      mergedChildren = mergeMenuItems(savedItem.children, defaultItem.children);
    } else if (defaultItem?.children && !savedItem.children) {
      // Ak default má children ale saved nie, použi default children
      mergedChildren = defaultItem.children;
    }

    result.push({
      ...savedItem,
      // Ak default má description a saved nie, použi default
      description: savedItem.description || defaultItem?.description,
      children: mergedChildren
    });
  }

  // Ak nie sú uložené žiadne položky (prvé spustenie), pridaj celé default menu.
  // Inak rešpektuj explicitné vymazanie a nepridávaj späť chýbajúce položky.
  if (saved.length === 0) {
    for (const defaultItem of defaults) {
      result.push(defaultItem);
    }
  }

  return result;
}

export async function readAdminMenuSettings(): Promise<AdminMenuSettings> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY }
    });

    if (!config) {
      return defaultAdminMenuSettings;
    }

    const parsed = JSON.parse(config.value);

    // Spracuj oba formáty - starý (priamo array) aj nový (objekt s items)
    let savedItems: AdminMenuItem[];
    if (Array.isArray(parsed)) {
      // Starý formát - priamo array
      savedItems = parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      // Nový formát - objekt s items
      savedItems = parsed.items;
    } else {
      return defaultAdminMenuSettings;
    }

    // Zlúč uložené položky s defaultnými
    const mergedItems = mergeMenuItems(savedItems, defaultAdminMenuSettings.items);

    return {
      ...defaultAdminMenuSettings,
      items: mergedItems
    };
  } catch (error) {
    console.error('Error reading admin menu settings:', error);
    return defaultAdminMenuSettings;
  }
}

export async function writeAdminMenuSettings(settings: Partial<AdminMenuSettings>): Promise<AdminMenuSettings> {
  try {
    const current = await readAdminMenuSettings();
    const updated: AdminMenuSettings = {
      ...current,
      ...settings
    };

    await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: CONFIG_KEY, value: JSON.stringify(updated) }
    });

    return updated;
  } catch (error) {
    console.error('Error writing admin menu settings:', error);
    throw error;
  }
}
