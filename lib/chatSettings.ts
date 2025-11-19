import path from 'path';
import { readConfig, writeConfig } from '@/lib/configStore';
import {
  defaultChatSettings,
  mergeChatSettings,
  type ChatSettings,
  type ChatScheduleEntry
} from '@/lib/chatSettingsShared';

const CONFIG_KEY = 'chat-settings';
const legacyPath = path.join(process.cwd(), 'data', 'chatSettings.json');

export async function readChatSettings(): Promise<ChatSettings> {
  const stored = await readConfig<ChatSettings>(CONFIG_KEY, defaultChatSettings, legacyPath);
  return mergeChatSettings(stored);
}

export async function writeChatSettings(settings: ChatSettings) {
  const value = mergeChatSettings(settings);
  await writeConfig(CONFIG_KEY, value);
}

export { defaultChatSettings, type ChatSettings, type ChatScheduleEntry } from '@/lib/chatSettingsShared';
