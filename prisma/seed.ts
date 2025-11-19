import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { defaultSiteSettings } from '../lib/siteSettingsShared';
import { defaultChatSettings } from '../lib/chatSettingsShared';
import { defaultFlexibeeSettings } from '../lib/flexibeeSettings';
import { defaultInvoiceTemplate } from '../lib/invoiceTemplate';
import { defaultAdminMenu } from '../lib/adminMenuDefaults';

const prisma = new PrismaClient();

async function loadProducts() {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  const file = await readFile(filePath, 'utf-8');
  return JSON.parse(file) as Array<{
    slug: string;
    name: string;
    category: string;
    subCategory?: string;
    tagline?: string;
    price?: number;
    currency?: string;
    image?: string;
    specs?: string[];
    description?: string;
    badge?: string;
    billingPeriod?: string;
    promotion?: string;
  }>;
}

async function seedProducts() {
  const products = await loadProducts();

  for (const product of products) {
    const categoryName = product.category?.trim() || 'Nezaradené';
    let category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName }
      });
    }

    let subCategoryId: number | undefined = undefined;
    if (product.subCategory) {
      const existing = await prisma.subCategory.findFirst({
        where: {
          name: product.subCategory.trim(),
          categoryId: category.id
        }
      });
      const subCategory =
        existing ||
        (await prisma.subCategory.create({
          data: {
            name: product.subCategory.trim(),
            categoryId: category.id
          }
        }));
      subCategoryId = subCategory.id;
    }

    const galleryJson = JSON.stringify(product.image ? [product.image] : []);
    const specsJson = JSON.stringify(product.specs ?? []);
    const translationPayload = JSON.stringify({
      sk: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        promotion: product.promotion,
        badge: product.badge,
        specs: product.specs ?? []
      },
      cz: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        promotion: product.promotion,
        badge: product.badge,
        specs: product.specs ?? []
      }
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: product.price ?? 0,
        currency: product.currency ?? 'EUR',
        badge: product.badge,
        billingPeriod: product.billingPeriod,
        promotion: product.promotion,
        image: product.image,
        gallery: galleryJson,
        specs: specsJson,
        active: true,
        category: { connect: { id: category.id } },
        subCategory: subCategoryId ? { connect: { id: subCategoryId } } : { disconnect: true },
        translations: translationPayload
      },
      create: {
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: product.price ?? 0,
        currency: product.currency ?? 'EUR',
        badge: product.badge,
        billingPeriod: product.billingPeriod,
        promotion: product.promotion,
        image: product.image,
        gallery: galleryJson,
        specs: specsJson,
        active: true,
        category: { connect: { id: category.id } },
        subCategory: subCategoryId ? { connect: { id: subCategoryId } } : undefined,
        translations: translationPayload
      }
    });
  }
}

async function seedConfig() {
  await prisma.config.deleteMany();
  const entries: Array<{ key: string; value: unknown }> = [
    { key: 'site-settings', value: defaultSiteSettings },
    { key: 'chat-settings', value: defaultChatSettings },
    { key: 'flexibee-settings', value: defaultFlexibeeSettings },
    { key: 'invoice-template', value: defaultInvoiceTemplate },
    { key: 'admin-menu', value: defaultAdminMenu }
  ];
  for (const entry of entries) {
    await prisma.config.create({
      data: {
        key: entry.key,
        value: JSON.stringify(entry.value)
      }
    });
  }
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.orderHistory.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();

  await seedProducts();
  await seedConfig();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
