import { pollTelegramUpdates } from '@/lib/telegramPoll';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const interval = Number(process.env.TELEGRAM_POLL_INTERVAL ?? 5000);
  console.log('[telegram:poll] Starting loop (interval %d ms)...', interval);
  while (true) {
    try {
      const result = await pollTelegramUpdates();
      if (result.processed) {
        console.log(
          '[telegram:poll] %s processed=%d nextOffset=%d',
          new Date().toISOString(),
          result.processed,
          result.nextOffset
        );
      }
    } catch (error) {
      console.error('[telegram:poll] Error', error);
    }
    await sleep(interval);
  }
}

run();

