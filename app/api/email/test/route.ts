import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { testImapConnection, sendTestEmail, testSmtpConnection } from '@/lib/modules/email/service';

type TestPayload = {
  mode?: 'imap' | 'send' | 'smtp';
  to?: string;
  from?: string;
};

/**
 * POST /api/email/test
 * - mode: 'imap' (default) => overí IMAP pripojenie
 * - mode: 'smtp' => overí SMTP pripojenie (bez odoslania)
 * - mode: 'send' => pokus o testovací email (vráti chybu, ak SMTP nie je dostupné)
 */
export async function POST(request: Request) {
  return withAdminAuth(async () => {
    try {
      const payload = (await request.json().catch(() => ({}))) as TestPayload;
      const mode = payload.mode || 'imap';

      if (mode === 'imap') {
        const result = await testImapConnection();
        return NextResponse.json({
          ...result,
          message: result.success ? 'IMAP spojenie je funkčné.' : result.error
        });
      }

      if (mode === 'smtp') {
        const result = await testSmtpConnection();
        return NextResponse.json({
          ...result,
          message: result.success ? 'SMTP spojenie je funkčné.' : result.error
        });
      }

      if (mode === 'send') {
        const result = await sendTestEmail(payload.to || '', payload.from);
        return NextResponse.json({
          ...result,
          message: result.success ? 'Testovací email bol odoslaný.' : result.error
        });
      }

      return NextResponse.json({ success: false, error: 'Neznámy testovací režim' }, { status: 400 });
    } catch (error) {
      console.error('Error testing email:', error);
      return NextResponse.json(
        { success: false, error: 'Test emailu zlyhal' },
        { status: 500 }
      );
    }
  });
}
