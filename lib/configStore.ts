import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';

async function readLegacyFile<T>(legacyPath?: string): Promise<T | null> {
  if (!legacyPath) return null;
  try {
    const raw = await fs.readFile(legacyPath, 'utf-8');
    const sanitized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return JSON.parse(sanitized) as T;
  } catch {
    return null;
  }
}

function parseValue<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Unable to parse config value', error);
    return null;
  }
}

export async function readConfig<T>(key: string, defaultValue: T, legacyPath?: string): Promise<T> {
  const record = await prisma.config.findUnique({ where: { key } });
  if (record) {
    const parsed = parseValue<T>(record.value);
    if (parsed) {
      return parsed;
    }
  }
  const legacy = await readLegacyFile<T>(legacyPath);
  const value = legacy ?? defaultValue;
  await prisma.config.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) }
  });
  return value;
}

export async function writeConfig<T>(key: string, value: T) {
  await prisma.config.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) }
  });
}
