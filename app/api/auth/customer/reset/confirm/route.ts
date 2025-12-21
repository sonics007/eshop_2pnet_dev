import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json().catch(() => ({}));
    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token a nové heslo sú povinné.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Heslo musí mať aspoň 6 znakov.' }, { status: 400 });
    }

    // Primárne nájdi podľa presného kľúča, fallback na endsWith pre prípad, že token bol URL-dekodovaný inak
    const stored =
      (await prisma.config.findUnique({ where: { key: `reset-token-${token}` } })) ||
      (await prisma.config.findFirst({
        where: {
          key: {
            startsWith: 'reset-token-',
            endsWith: token
          }
        }
      }));
    if (!stored) {
      return NextResponse.json({ success: false, error: 'Token je neplatný alebo expirovaný.' }, { status: 400 });
    }

    const data = JSON.parse(stored.value) as { userId: number; expiresAt: string };
    if (!data?.userId || !data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
      await prisma.config.delete({ where: { key: stored.key } }).catch(() => null);
      return NextResponse.json({ success: false, error: 'Token je neplatný alebo expirovaný.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: data.userId }, data: { passwordHash } });
    await prisma.config.delete({ where: { key: stored.key } }).catch(() => null);

    return NextResponse.json({ success: true, message: 'Heslo bolo zmenené.' });
  } catch (error) {
    console.error('Reset confirm error:', error);
    return NextResponse.json({ success: false, error: 'Chyba servera' }, { status: 500 });
  }
}
