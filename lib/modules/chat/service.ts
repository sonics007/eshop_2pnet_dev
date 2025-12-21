/**
 * CHAT MODULE - Service Layer
 *
 * Biznis logika je zredukovaná na správu konfigurácie Tawk.to widgetu.
 */

import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultChatSettings, mergeChatSettings } from './types';
import type { ChatSettings } from './types';

const CONFIG_KEY = 'chat-settings-v2';

export async function getChatSettings(): Promise<ChatSettings> {
  const stored = await readConfig<ChatSettings>(CONFIG_KEY, defaultChatSettings);
  return mergeChatSettings(stored);
}

export async function saveChatSettings(settings: Partial<ChatSettings>): Promise<ChatSettings> {
  const current = await getChatSettings();
  const merged = mergeChatSettings({ ...current, ...settings });
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}
