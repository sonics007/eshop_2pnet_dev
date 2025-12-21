import { NextResponse } from 'next/server';
import { readConfig, writeConfig } from '@/lib/configStore';

const CONFIG_KEY = 'navbar-labels';
const navKeys = ['home', 'products', 'contact'] as const;

type NavKey = (typeof navKeys)[number];
type NavLabels = {
  sk: Partial<Record<NavKey, string>>;
  cz: Partial<Record<NavKey, string>>;
};

const defaultLabels: NavLabels = { sk: {}, cz: {} };

async function readLabels(): Promise<NavLabels> {
  const stored = await readConfig<NavLabels>(CONFIG_KEY, defaultLabels);
  return {
    sk: stored?.sk ?? {},
    cz: stored?.cz ?? {}
  };
}

export async function GET() {
  const labels = await readLabels();
  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<NavLabels> | null;
  const current = await readLabels();

  const next: NavLabels = {
    sk: { ...current.sk, ...(payload?.sk ?? {}) },
    cz: { ...current.cz, ...(payload?.cz ?? {}) }
  };

  // Vyfiltruj len povolené kľúče
  navKeys.forEach((key) => {
    if (next.sk[key]?.trim() === '') delete next.sk[key];
    if (next.cz[key]?.trim() === '') delete next.cz[key];
  });

  await writeConfig(CONFIG_KEY, next);
  return NextResponse.json(next);
}
