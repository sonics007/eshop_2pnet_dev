import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { getProductBySlug, getProductSlugs } from '@/lib/products.server';
import { ProductDetail } from '@/components/ProductDetail';

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return {
    title: product ? `${product.name} | 2Pnet` : 'Produkt',
    description: product?.description
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </div>
  );
}
