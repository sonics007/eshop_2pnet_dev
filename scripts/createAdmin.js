/**
 * Script pre vytvorenie admin používateľa
 *
 * Použitie: node scripts/createAdmin.js <email> <heslo> [meno]
 * Príklad: node scripts/createAdmin.js admin@firma.sk tajneHeslo123 "Admin"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.log('Použitie: node scripts/createAdmin.js <email> <heslo> [meno]');
    console.log('Príklad: node scripts/createAdmin.js admin@firma.sk tajneHeslo123 "Admin"');
    process.exit(1);
  }

  // Kontrola či email už existuje
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existing) {
    console.log(`Používateľ s emailom ${email} už existuje.`);

    // Ak je to admin, aktualizuj heslo
    if (existing.role === 'admin') {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash }
      });
      console.log('Heslo admina bolo aktualizované.');
    }
    process.exit(0);
  }

  // Vytvor nového admin používateľa
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      companyName: name || 'Admin',
      role: 'admin',
      twoFactorEnabled: false
    }
  });

  console.log(`Admin používateľ vytvorený:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Meno: ${user.companyName}`);
  console.log(`\nPrihláste sa na /admin.html s emailom alebo menom "${user.companyName}".`);
}

main()
  .catch((e) => {
    console.error('Chyba:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
