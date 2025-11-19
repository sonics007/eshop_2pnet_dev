import { HomeContent } from '@/components/HomeContent';
import { readSiteSettings } from '@/lib/siteSettings';
import { getFeaturedProducts, getProducts } from '@/lib/products.server';

export default async function HomePage() {
  const [siteSettings, products, featuredProducts] = await Promise.all([
    readSiteSettings(),
    getProducts(),
    getFeaturedProducts()
  ]);

  return <HomeContent siteSettings={siteSettings} products={products} featuredProducts={featuredProducts} />;
}
