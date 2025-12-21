const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const config = await prisma.config.findUnique({ where: { key: 'email-settings' } });
  if (!config) {
    console.log('Email settings nie sú nakonfigurované!');
    return;
  }
  const settings = JSON.parse(config.value);
  console.log('=== SMTP Konfigurácia ===');
  console.log('Host:', settings.smtp?.host || '(chýba)');
  console.log('Port:', settings.smtp?.port || '(chýba)');
  console.log('Secure:', settings.smtp?.secure);
  console.log('User:', settings.smtp?.auth?.user || '** CHÝBA! **');
  console.log('Pass:', settings.smtp?.auth?.pass ? '***nastavené***' : '** CHÝBA! **');
  console.log('');
  console.log('=== From nastavenia ===');
  console.log('Default From Email:', settings.defaultFromEmail || '** CHÝBA! **');
  console.log('Default From Name:', settings.defaultFromName || '(chýba)');
  console.log('');
  console.log('=== Stav ===');
  console.log('Enabled:', settings.enabled);
  console.log('Test mode:', settings.testMode);
  await prisma.$disconnect();
}
check();
