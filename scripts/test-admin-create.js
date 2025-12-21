const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function testCreateAdmin() {
  const email = 'laco.krizo@gmail.com';
  const companyName = 'laco.krizo';

  console.log('Testing admin creation for:', email);

  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existing) {
    console.log('ERROR: User already exists:', existing);
    await prisma.$disconnect();
    return;
  }

  console.log('User does not exist, creating...');

  // Generate token
  const invitationToken = randomBytes(32).toString('hex');
  const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  console.log('Token generated:', invitationToken.substring(0, 20) + '...');

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: null,
        companyName: companyName,
        role: 'admin',
        twoFactorEnabled: false,
        invitationToken,
        invitationExpiry
      }
    });

    console.log('SUCCESS! User created:', user);
    console.log('');
    console.log('Set password URL:');
    console.log(`https://dev.krizo.eu/admin/set-password?token=${invitationToken}`);
  } catch (error) {
    console.error('ERROR creating user:', error);
  }

  await prisma.$disconnect();
}

testCreateAdmin();
