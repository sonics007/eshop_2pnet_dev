'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import type { Product, ProductCategory, ProductTranslation } from '@/types/product';

type AdminProductForm = {
  id?: number;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  categoryId?: number;
  subCategoryId?: number;
  billingPeriod: string;
  image: string;
  gallery: string[];
  specs: string[];
  description: string;
  promotion: string;
  badge: string;
  stock: number;
  discount: number;
  active: boolean;
  translations: Record<string, ProductTranslation>;
};

const languageTabs = [
  { code: 'sk', label: 'Slovenčina' },
  { code: 'cz', label: 'Čeština' }
] as const;

const emptyForm: AdminProductForm = {
  slug: '',
  name: '',
  tagline: '',
  price: 0,
  currency: 'EUR',
  categoryId: undefined,
  subCategoryId: undefined,
  billingPeriod: '',
  image: '',
  gallery: [],
  specs: [],
  description: '',
  promotion: '',
  badge: '',
  stock: 0,
  discount: 0,
  active: true,
  translations: {
    sk: {},
    cz: {}
  }
};

const currencyFormat = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('sk-SK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminProductForm>(emptyForm);
  const [translationTab, setTranslationTab] = useState<(typeof languageTabs)[number]['code']>('sk');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [subCategoryParent, setSubCategoryParent] = useState<number | undefined>();
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newSpec, setNewSpec] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
        const productsPayload = await productRes.json();
        const categoriesPayload = await categoryRes.json();
        setProducts(productsPayload.data ?? []);
        setFilteredProducts(productsPayload.data ?? []);
        setCategories(categoriesPayload.data ?? []);
      } catch (error) {
        console.error(error);
        setStatus('Nepodarilo sa načítať produkty alebo kategórie. Skontrolujte API.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredProducts(products);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredProducts(
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(lower) ||
          product.slug.toLowerCase().includes(lower) ||
          product.category.toLowerCase().includes(lower)
      )
    );
  }, [search, products]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((product) => product.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setForm(emptyForm);
      setTranslationTab('sk');
      return;
    }
    setForm({
      id: selectedProduct.id,
      slug: selectedProduct.slug,
      name: selectedProduct.name,
      tagline: selectedProduct.tagline ?? '',
      price: selectedProduct.price,
      currency: selectedProduct.currency,
      categoryId: selectedProduct.categoryId,
      subCategoryId: selectedProduct.subCategoryId,
      billingPeriod: selectedProduct.billingPeriod ?? '',
      image: selectedProduct.image ?? '',
      gallery: selectedProduct.gallery ?? [],
      specs: selectedProduct.specs ?? [],
      description: selectedProduct.description ?? '',
      promotion: selectedProduct.promotion ?? '',
      badge: selectedProduct.badge ?? '',
      stock: selectedProduct.stock ?? 0,
      discount: selectedProduct.discount ?? 0,
      active: selectedProduct.active,
      translations: {
        sk: selectedProduct.translations?.sk ?? {},
        cz: selectedProduct.translations?.cz ?? {}
      }
    });
    setTranslationTab('sk');
  }, [selectedProduct]);

  const updateForm = (field: keyof AdminProductForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTranslation = (field: keyof ProductTranslation, value: string | string[]) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [translationTab]: {
          ...(prev.translations?.[translationTab] ?? {}),
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!form.slug || !form.name || !form.categoryId) {
      setStatus('Vyplňte prosím základné údaje a kategóriu.');
      return;
    }
    const payload = {
      ...form,
      gallery: form.gallery,
      specs: form.specs,
      translations: form.translations
    };
    try {
      const response = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? 'unknown');
      }
      setStatus(`Produkt ${form.name} bol uložený.`);
      setSelectedProductId(result.product?.id ?? null);
      setProducts((prev) => {
        const next = form.id ? prev.map((p) => (p.id === result.product.id ? result.product : p)) : [result.product, ...prev];
        setFilteredProducts(next);
        return next;
      });
    } catch (error) {
      console.error(error);
      setStatus('Ukladanie zlyhalo. Skúste znova.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message);
      setCategories(payload.data);
      setNewCategory('');
      setStatus('Kategória bola pridaná.');
    } catch (error) {
      console.error(error);
      setStatus('Kategóriu sa nepodarilo pridať (duplicitný názov?).');
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !subCategoryParent) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubCategory.trim(), categoryId: subCategoryParent })
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message);
      setCategories(payload.data);
      setNewSubCategory('');
      setStatus('Podkategória bola pridaná.');
    } catch (error) {
      console.error(error);
      setStatus('Podkategóriu sa nepodarilo pridať.');
    }
  };

  const addSpec = () => {
    if (!newSpec.trim()) return;
    updateForm('specs', [...form.specs, newSpec.trim()]);
    setNewSpec('');
  };

  const addImage = () => {
    if (!newGalleryUrl.trim()) return;
    updateForm('gallery', [...form.gallery, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-[1500px] px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Backoffice</p>
            <h1 className="text-4xl font-semibold text-slate-900">Správa produktov</h1>
            <p className="mt-2 text-sm text-slate-500">
              Import z DB, preklady a štruktúra kategórií pripravená pre ďalšie jazyky (HU/DE).
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
              ← Späť do admin panelu
            </Link>
          </div>
        </div>

        {status && <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{status}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr,2fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filtrovať podľa názvu alebo kategórie"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-2 text-sm"
                onClick={() => {
                  setSearch('');
                  setFilteredProducts(products);
                }}
              >
                Vyčistiť
              </button>
            </div>
            <div className="mt-4 max-h-[520px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-slate-500">Načítavam...</p>
              ) : (
                <table className="min-w-full text-sm text-slate-600">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2">Vybrať</th>
                      <th className="pb-2">Produkt</th>
                      <th className="pb-2">Kategória</th>
                      <th className="pb-2">Cena</th>
                      <th className="pb-2">Aktívny</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`cursor-pointer border-t border-slate-100 text-sm transition ${
                          selectedProductId === product.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="radio"
                            name="product-selection"
                            checked={selectedProductId === product.id}
                            onChange={() => setSelectedProductId(product.id)}
                          />
                        </td>
                        <td className="py-3 font-semibold">{product.name}</td>
                        <td className="py-3">{product.category}</td>
                        <td className="py-3">{currencyFormat(product.price, product.currency)}</td>
                        <td className="py-3">{product.active ? 'Áno' : 'Nie'}</td>
                      </tr>
                    ))}
                    {!filteredProducts.length && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Žiadne produkty
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
              onClick={() => {
                setSelectedProductId(null);
                setForm(emptyForm);
              }}
            >
              + Nový produkt
            </button>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedProductId ? 'Upraviť produkt' : 'Nový produkt'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Názov
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => updateForm('slug', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Tagline
                <input
                  value={form.tagline}
                  onChange={(event) => updateForm('tagline', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Cena
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => updateForm('price', Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Kategória
                <select
                  value={form.categoryId ?? ''}
                  onChange={(event) => updateForm('categoryId', Number(event.target.value) || undefined)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">-- vyberte --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Podkategória
                <select
                  value={form.subCategoryId ?? ''}
                  onChange={(event) => updateForm('subCategoryId', Number(event.target.value) || undefined)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">-- vyberte --</option>
                  {categories
                    .find((category) => category.id === form.categoryId)
                    ?.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Popis
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Obrázok (hero)
                <input
                  value={form.image}
                  onChange={(event) => updateForm('image', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Promo badge
                <input
                  value={form.badge}
                  onChange={(event) => updateForm('badge', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Promo text
                <input
                  value={form.promotion}
                  onChange={(event) => updateForm('promotion', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            {form.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.gallery.map((url) => (
                  <div key={url} className="relative h-28 rounded-2xl border border-slate-200">
                    <Image src={url} alt={form.name || 'product'} fill className="rounded-2xl object-cover" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/80 px-2 text-xs text-rose-500"
                      onClick={() => updateForm('gallery', form.gallery.filter((item) => item !== url))}
                    >
                      odstrániť
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="URL nového obrázka"
                value={newGalleryUrl}
                onChange={(event) => setNewGalleryUrl(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" onClick={addImage}>
                Pridať do galérie
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Technické parametre</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {form.specs.map((spec) => (
                  <li key={spec} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                    <span>{spec}</span>
                    <button type="button" className="text-rose-500 text-xs" onClick={() => updateForm('specs', form.specs.filter((item) => item !== spec))}>
                      odstrániť
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr,auto]">
                <input
                  placeholder="Nový parameter"
                  value={newSpec}
                  onChange={(event) => setNewSpec(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  onClick={addSpec}
                >
                  Pridať parameter
                </button>
              </div>
            </div>

            <div>
              <div className="flex gap-2">
                {languageTabs.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      translationTab === lang.code ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'
                    }`}
                    onClick={() => setTranslationTab(lang.code)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Názov ({translationTab})
                  <input
                    value={form.translations?.[translationTab]?.name ?? ''}
                    onChange={(event) => updateTranslation('name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Tagline ({translationTab})
                  <input
                    value={form.translations?.[translationTab]?.tagline ?? ''}
                    onChange={(event) => updateTranslation('tagline', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Popis ({translationTab})
                  <textarea
                    rows={3}
                    value={form.translations?.[translationTab]?.description ?? ''}
                    onChange={(event) => updateTranslation('description', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => updateForm('active', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Produkt je aktívny
              </label>
            </div>
            <div className="flex gap-4">
              <button type="button" className="rounded-full bg-brand-accent px-6 py-3 font-semibold text-slate-900" onClick={handleSave}>
                {selectedProductId ? 'Uložiť zmeny' : 'Pridať produkt'}
              </button>
              {selectedProductId && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-600"
                  onClick={() => {
                    setSelectedProductId(null);
                    setForm(emptyForm);
                  }}
                >
                  Zrušiť
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="mt-10 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card md:grid-cols-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Nová kategória</h3>
            <div className="mt-3 flex gap-3">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Názov kategórie"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                onClick={handleAddCategory}
              >
                Pridať
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Nová podkategória</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                value={subCategoryParent ?? ''}
                onChange={(event) => setSubCategoryParent(Number(event.target.value) || undefined)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="">-- Kategória --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={newSubCategory}
                onChange={(event) => setNewSubCategory(event.target.value)}
                placeholder="Názov podkategórie"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm md:col-span-2"
                onClick={handleAddSubCategory}
              >
                Pridať
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
