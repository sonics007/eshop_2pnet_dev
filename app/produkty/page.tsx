import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { getProducts } from '@/lib/products.server';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Portfólio</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Kompletná ponuka 2Pnet</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Vyberte si hardvér, sieťové komponenty, služby alebo manažované riešenia. Filtre nižšie vám
          pomôžu zúžiť výber na konkrétne potreby.
        </p>
        <ProductGrid products={products} />
      </main>
      <Footer />
    </div>
  );
}
