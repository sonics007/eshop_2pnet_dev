/**
 * Test Database Helpers
 * Utility funkcie pre testovanie databázových operácií
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Samostatný Prisma client pre testy
let testPrisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      log: ['error']
    });
  }
  return testPrisma;
}

export async function closeTestPrisma(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * Vyčistí testovacie dáta z databázy
 */
export async function cleanupTestData(prisma: PrismaClient): Promise<void> {
  // Vymaž dáta v správnom poradí kvôli FK constraints
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.orderHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test.example.com'
      }
    }
  });
  await prisma.config.deleteMany({
    where: {
      key: {
        startsWith: 'test_'
      }
    }
  });
}

/**
 * Vytvorí testovacieho zákazníka
 */
export async function createTestCustomer(prisma: PrismaClient, overrides: Partial<{
  email: string;
  password: string;
  companyName: string;
  ico: string;
  dic: string;
}> = {}) {
  const email = overrides.email || `customer_${Date.now()}@test.example.com`;
  const password = overrides.password || 'testPassword123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      companyName: overrides.companyName || 'Test Company',
      ico: overrides.ico || '12345678',
      dic: overrides.dic || 'SK2012345678',
      role: 'user'
    }
  });

  return { user, password };
}

/**
 * Vytvorí testovacieho admina
 */
export async function createTestAdmin(prisma: PrismaClient, overrides: Partial<{
  email: string;
  password: string;
  companyName: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
}> = {}) {
  const email = overrides.email || `admin_${Date.now()}@test.example.com`;
  const password = overrides.password || 'adminPassword123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      companyName: overrides.companyName || 'Admin User',
      ico: '00000001',
      dic: 'SK0000000001',
      role: 'admin',
      twoFactorEnabled: overrides.twoFactorEnabled ?? false,
      twoFactorSecret: overrides.twoFactorSecret
    }
  });

  return { user, password };
}

/**
 * Vytvorí testovaciu kategóriu
 */
export async function createTestCategory(prisma: PrismaClient, name?: string) {
  return prisma.category.create({
    data: {
      name: name || `Test Category ${Date.now()}`
    }
  });
}

/**
 * Vytvorí testovaciu podkategóriu
 */
export async function createTestSubCategory(prisma: PrismaClient, categoryId: number, name?: string) {
  return prisma.subCategory.create({
    data: {
      name: name || `Test SubCategory ${Date.now()}`,
      categoryId
    }
  });
}

/**
 * Vytvorí testovací produkt
 */
export async function createTestProduct(prisma: PrismaClient, categoryId: number, overrides: Partial<{
  slug: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
}> = {}) {
  return prisma.product.create({
    data: {
      slug: overrides.slug || `test-product-${Date.now()}`,
      name: overrides.name || 'Test Product',
      price: overrides.price ?? 99.99,
      stock: overrides.stock ?? 100,
      active: overrides.active ?? true,
      categoryId
    }
  });
}

/**
 * Vytvorí testovaciu objednávku
 */
export async function createTestOrder(prisma: PrismaClient, overrides: Partial<{
  externalId: string;
  customerName: string;
  email: string;
  total: number;
  status: string;
  paymentMethod: string;
  userId: number;
}> = {}) {
  return prisma.order.create({
    data: {
      externalId: overrides.externalId || `ORD-${Date.now()}`,
      customerName: overrides.customerName || 'Test Customer',
      email: overrides.email || 'customer@test.example.com',
      total: overrides.total ?? 199.99,
      status: overrides.status || 'PRIJATA',
      paymentMethod: overrides.paymentMethod || 'Faktúra 14 dní',
      userId: overrides.userId
    }
  });
}

/**
 * Vytvorí testovaciu faktúru
 */
export async function createTestInvoice(prisma: PrismaClient, orderId?: number, overrides: Partial<{
  invoiceNumber: string;
  customerName: string;
  totalPrice: number;
}> = {}) {
  return prisma.invoice.create({
    data: {
      invoiceNumber: overrides.invoiceNumber || `INV-${Date.now()}`,
      variableSymbol: `VS-${Date.now()}`,
      supplierName: 'Test Supplier',
      supplierIco: '12345678',
      supplierDic: 'SK2012345678',
      supplierAddress: 'Test Address 1',
      customerName: overrides.customerName || 'Test Customer',
      customerIco: '87654321',
      customerAddress: 'Customer Address 1',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      supplyDate: new Date(),
      basePrice: (overrides.totalPrice ?? 100) / 1.2,
      vatValue: (overrides.totalPrice ?? 100) - (overrides.totalPrice ?? 100) / 1.2,
      totalPrice: overrides.totalPrice ?? 100,
      orderId
    }
  });
}
