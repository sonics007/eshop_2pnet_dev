'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LANGUAGE_CURRENCY_MAP, type Product, type ProductCategory, type ProductTranslation } from '@/types/product';
import { useAdminAuth } from '@/lib/modules/auth';
import type { PricingSettings } from '@/lib/modules/site/pages/pricing/types';
import { emitAdminNotification, postAdminNotification } from '@/lib/adminNotifications';

type AdminProductForm = {
  id?: number;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  vatRate: number;
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
  vatRate: 20,
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
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
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
  const [uploading, setUploading] = useState(false);
  const uploadFolder = form.slug?.trim() ? `products/${form.slug.trim()}` : 'products';
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const translationCurrency =
    LANGUAGE_CURRENCY_MAP[translationTab]?.currency ?? LANGUAGE_CURRENCY_MAP.sk.currency;

  // Pomocná funkcia na výpočet CZK ceny
  const calculateCzkPrice = (eurPrice: number): number => {
    if (!pricingSettings) return Math.round(eurPrice * 25); // default fallback
    const converted = eurPrice * pricingSettings.eurToCzkRate;
    if (pricingSettings.roundTo <= 0) {
      return Math.round(converted);
    }
    if (pricingSettings.roundUp) {
      return Math.ceil(converted / pricingSettings.roundTo) * pricingSettings.roundTo;
    }
    return Math.round(converted / pricingSettings.roundTo) * pricingSettings.roundTo;
  };

  const updateGallery = (updater: (current: string[]) => string[]) => {
    setForm((prev) => ({
      ...prev,
      gallery: updater(prev.gallery ?? [])
    }));
  };

  const moveGalleryItem = (index: number, direction: 'up' | 'down') => {
    updateGallery((current) => {
      const next = [...current];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) {
        return current;
      }
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const setHeroFromGallery = (url: string) => {
    updateForm('image', url);
    setStatus('Hlavný obrázok bol aktualizovaný z galérie.');
  };

  const handleFileUpload = async (file: File, target: 'image' | 'gallery', folderOverride?: string) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folderOverride ?? uploadFolder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const result = await response.json();

      if (result.success && result.url) {
        if (target === 'image') {
          updateForm('image', result.url);
        } else {
          updateGallery((gallery) => (gallery.includes(result.url) ? gallery : [...gallery, result.url]));
        }
        setStatus(`Obrázok "${file.name}" bol nahraný.`);
      } else {
        throw new Error(result.error || 'Upload zlyhal');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Nahrávanie obrázka zlyhalo.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, categoryRes, pricingRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/site/pricing')
        ]);
        const productsPayload = await productRes.json();
        const categoriesPayload = await categoryRes.json();
        const pricingPayload = await pricingRes.json();
        setProducts(productsPayload.data ?? []);
        setFilteredProducts(productsPayload.data ?? []);
        setCategories(categoriesPayload.data ?? []);
        if (pricingPayload.success && pricingPayload.data) {
          setPricingSettings(pricingPayload.data);
        }
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
    setSelectedProductIds((prev) => prev.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

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
      vatRate: selectedProduct.vatRate ?? 20,
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

  const updateTranslation = (field: keyof ProductTranslation, value: string | string[] | number | undefined) => {
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
    if (!isAuthenticated) {
      setStatus('Pre uloženie zmien sa prosím prihláste do admin rozhrania.');
      return;
    }
    if (!form.slug || !form.name || !form.categoryId) {
      setStatus('Vyplňte prosím základné údaje a kategóriu.');
      return;
    }
    const enforcedTranslations = Object.fromEntries(
      Object.entries(form.translations ?? {}).map(([lang, value]) => {
        if (!value) {
          return [lang, value];
        }
        const forcedCurrency = LANGUAGE_CURRENCY_MAP[lang]?.currency;
        return [
          lang,
          forcedCurrency
            ? {
                ...value,
                currency: forcedCurrency
              }
            : value
        ];
      })
    );

    const payload = {
      ...form,
      gallery: form.gallery,
      specs: form.specs,
      translations: enforcedTranslations
    };
    try {
      const response = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        // Ak je chyba o autentifikácii, informuj používateľa o potrebe prihlásenia
        if (response.status === 401) {
          setStatus('Vaša session vypršala. Prosím, prihláste sa znova v novom okne a obnovte túto stránku.');
          return;
        }
        throw new Error(result.message || result.error || 'Neznáma chyba');
      }
      setStatus(`Produkt ${form.name} bol uložený.`);
      setSelectedProductId(result.product?.id ?? null);
      // Po uložení načítaj čerstvý zoznam, aby sa určite zobrazil
      try {
        const refresh = await fetch('/api/products', { cache: 'no-store' }).then((res) => res.json());
        const refreshedList: Product[] = refresh?.data ?? [];
        setProducts(refreshedList);
        setFilteredProducts(refreshedList);
        emitAdminNotification({
          message: form.id
            ? `Produkt ${form.name} bol upravený.`
            : `Produkt ${form.name} bol pridaný.`
          , type: 'success'
        });
        postAdminNotification({
          message: form.id
            ? `Produkt ${form.name} bol upravený.`
            : `Produkt ${form.name} bol pridaný.`,
          type: 'success'
        });
      } catch {
        // fallback na lokálnu aktualizáciu
        setProducts((prev) => {
          const next = form.id
            ? prev.map((p) => (p.id === result.product.id ? result.product : p))
            : [result.product, ...prev];
          setFilteredProducts(next);
          return next;
        });
        emitAdminNotification({
          message: form.id
            ? `Produkt ${form.name} bol upravený.`
            : `Produkt ${form.name} bol pridaný.`
          , type: 'success'
        });
        postAdminNotification({
          message: form.id
            ? `Produkt ${form.name} bol upravený.`
            : `Produkt ${form.name} bol pridaný.`,
          type: 'success'
        });
      }
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
        credentials: 'include',
        body: JSON.stringify({ name: newCategory.trim() })
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || payload.error);
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
        credentials: 'include',
        body: JSON.stringify({ name: newSubCategory.trim(), categoryId: subCategoryParent })
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || payload.error);
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
    const url = newGalleryUrl.trim();
    if (!url) return;
    updateGallery((gallery) => {
      if (gallery.includes(url)) {
        setStatus('Tento obrázok už je v galérii.');
        return gallery;
      }
      return [...gallery, url];
    });
    setNewGalleryUrl('');
  };

  const toggleSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectVisible = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allVisibleSelected = visibleIds.every((id) => selectedProductIds.includes(id));
    setSelectedProductIds(allVisibleSelected ? selectedProductIds.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selectedProductIds, ...visibleIds])));
  };

  const clearSelection = () => setSelectedProductIds([]);

  const deleteProducts = async (ids: number[], scopeLabel?: string) => {
    if (!isAuthenticated) {
      setStatus('Pre mazanie je potrebné prihlásenie do admin účtu.');
      return;
    }
    if (!ids.length) {
      setStatus('Vyberte aspoň jeden produkt na odstránenie.');
      return;
    }

    const labels = ids
      .map((id) => products.find((product) => product.id === id)?.name)
      .filter(Boolean);

    const caption =
      scopeLabel ||
      (ids.length === 1
        ? labels[0] ?? `produkt ID ${ids[0]}`
        : `${ids.length} produktov`);

    const confirmed = window.confirm(`Naozaj chcete vymazať ${caption}? Táto akcia je nezvratná.`);
    if (!confirmed) return;

    try {
      setStatus(`Odstraňujem ${caption}…`);

      for (const id of ids) {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          if (response.status === 401) {
            setStatus('Vaša session vypršala. Prihláste sa znova a skúste odstrániť produkty ešte raz.');
            return;
          }
          throw new Error(payload?.message || payload?.error || 'Mazanie zlyhalo');
        }
      }

      setProducts((prev) => prev.filter((product) => !ids.includes(product.id)));
      setFilteredProducts((prev) => prev.filter((product) => !ids.includes(product.id)));
      setSelectedProductIds((prev) => prev.filter((id) => !ids.includes(id)));

      if (selectedProductId && ids.includes(selectedProductId)) {
        setSelectedProductId(null);
        setForm(emptyForm);
      }

      setStatus(`Vymazaných ${ids.length} produktov.`);
      emitAdminNotification({
        message: ids.length === 1 ? `Produkt ${caption} bol vymazaný.` : `${ids.length} produktov bolo vymazaných.`,
        type: 'error'
      });
      postAdminNotification({
        message: ids.length === 1 ? `Produkt ${caption} bol vymazaný.` : `${ids.length} produktov bolo vymazaných.`,
        type: 'error'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      setStatus('Mazanie produktov zlyhalo. Skúste to znova.');
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) {
      setStatus('Pre mazanie je potrebné prihlásenie.');
      return;
    }
    if (!selectedProductId) {
      setStatus('Vyberte produkt, ktorý chcete odstrániť.');
      return;
    }

    const target = products.find((product) => product.id === selectedProductId);
    const confirmationLabel = target?.name ?? 'produkt';
    const confirmed = window.confirm(`Naozaj chcete vymazať ${confirmationLabel}? Táto akcia je nezvratná.`);
    if (!confirmed) return;

    try {
      setStatus(`Odstraňujem ${confirmationLabel}…`);
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload?.message || payload?.error || 'Mazanie zlyhalo');
      }

      setProducts((prev) => prev.filter((product) => product.id !== selectedProductId));
      setFilteredProducts((prev) => prev.filter((product) => product.id !== selectedProductId));
      setSelectedProductId(null);
      setSelectedProductIds((prev) => prev.filter((id) => id !== selectedProductId));
      setForm(emptyForm);
      setStatus(`Produkt ${confirmationLabel} bol odstránený.`);
      emitAdminNotification({
        message: `Produkt ${confirmationLabel} bol vymazaný.`,
        type: 'error'
      });
      postAdminNotification({
        message: `Produkt ${confirmationLabel} bol vymazaný.`,
        type: 'error'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      setStatus('Mazanie produktu zlyhalo. Skúste to znova.');
    }
  };

  const handleDeleteSelected = () => deleteProducts(selectedProductIds);
  const handleDeleteAll = () => deleteProducts(products.map((product) => product.id), 'všetky produkty');

  const visibleSelectionCount = filteredProducts.filter((product) => selectedProductIds.includes(product.id)).length;
  const allVisibleSelected = filteredProducts.length > 0 && visibleSelectionCount === filteredProducts.length;

  if (authLoading) {
    return (
      <AdminLayout activePanel="admin-products">
        <p className="rounded-3xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-card">
          Overujem prístupové oprávnenia…
        </p>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout activePanel="admin-products">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-card">
          <p className="text-base font-semibold text-slate-900">Pre správu produktov je potrebné prihlásiť sa.</p>
          <p className="mt-2 text-sm text-slate-500">
            Otvorte si prosím administráciu, prihláste sa a potom obnovte túto stránku.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Prejsť na prihlásenie
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-products">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Backoffice</p>
          <h1 className="text-4xl font-semibold text-slate-900">Správa produktov</h1>
          <p className="mt-2 text-sm text-slate-500">
            Import z DB, preklady a štruktúra kategórií pripravená pre ďalšie jazyky (HU/DE).
          </p>
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
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                {selectedProductIds.length} označených
              </span>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 disabled:opacity-40"
                  onClick={handleDeleteSelected}
                  disabled={!selectedProductIds.length}
                >
                  Vymazať vybrané
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 disabled:opacity-40"
                  onClick={clearSelection}
                  disabled={!selectedProductIds.length}
                >
                  Zrušiť výber
                </button>
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 disabled:opacity-40"
                  onClick={handleDeleteAll}
                  disabled={!products.length}
                >
                  Vymazať všetky
                </button>
              </div>
            </div>
            <div className="mt-4 max-h-[520px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-slate-500">Načítavam...</p>
              ) : (
                <table className="min-w-full text-sm text-slate-600">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 w-12">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                          checked={allVisibleSelected}
                          onChange={toggleSelectVisible}
                          aria-label="Vybrať / zrušiť výber viditeľných produktov"
                        />
                      </th>
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
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-slate-900"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleSelection(product.id);
                            }}
                            aria-label={`Označiť produkt ${product.name}`}
                          />
                        </td>
                        <td className="py-3 font-semibold">{product.name}</td>
                        <td className="py-3">{product.category}</td>
                        <td className="py-3">
                          <div className="text-xs">
                            <div>{currencyFormat(product.price, product.currency)}</div>
                            <div className="opacity-60">
                              s DPH: {currencyFormat(product.price * (1 + (product.vatRate ?? 20) / 100), product.currency)}
                            </div>
                          </div>
                        </td>
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
                URL identifikátor (slug)
                <input
                  value={form.slug}
                  onChange={(event) => updateForm('slug', event.target.value)}
                  placeholder="napr. moj-produkt"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Krátky popis
                <input
                  value={form.tagline}
                  onChange={(event) => updateForm('tagline', event.target.value)}
                  placeholder="Stručný popis produktu"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <div className="text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-4">
                  <span>Cena bez DPH (EUR)</span>
                  <select
                    value={form.vatRate}
                    onChange={(event) => updateForm('vatRate', Number(event.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs focus:border-slate-900 focus:outline-none"
                  >
                    <option value={0}>0% DPH</option>
                    <option value={10}>10% DPH</option>
                    <option value={20}>20% DPH</option>
                    <option value={21}>21% DPH</option>
                    <option value={23}>23% DPH</option>
                  </select>
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateForm('price', Number(event.target.value))}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                {form.price > 0 && (
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="font-medium">S DPH: </span>
                    <span className="text-slate-900 font-semibold">
                      {currencyFormat(form.price * (1 + form.vatRate / 100), form.currency)}
                    </span>
                  </div>
                )}
              </div>
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
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">
                Obrázok (hero)
                <div className="mt-2 flex gap-2">
                  <input
                    value={form.image}
                    onChange={(event) => updateForm('image', event.target.value)}
                    placeholder="URL obrázka alebo nahrajte súbor"
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                    {uploading ? 'Nahrávam...' : 'Nahrať'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length) {
                          handleFileUpload(files[0], 'image', uploadFolder);
                          files.slice(1).forEach((file) => handleFileUpload(file, 'gallery', uploadFolder));
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {form.image && (
                  <div className="mt-3 relative h-40 w-full rounded-2xl border border-slate-200 overflow-hidden">
                    <Image src={form.image} alt="Hero preview" fill className="object-cover" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs text-rose-500 hover:bg-white"
                      onClick={() => updateForm('image', '')}
                    >
                      odstrániť
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Promo štítok
                <input
                  value={form.badge}
                  onChange={(event) => updateForm('badge', event.target.value)}
                  placeholder="napr. Novinka, Akcia, -20%"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Promo text
                <input
                  value={form.promotion}
                  onChange={(event) => updateForm('promotion', event.target.value)}
                  placeholder="Propagačný text k produktu"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            {form.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.gallery.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative h-28 rounded-2xl border border-slate-200 overflow-hidden">
                    <Image src={url} alt={form.name || 'product'} fill className="object-cover" />
                    <div className="absolute inset-x-2 top-2 flex items-center justify-between text-[11px] font-semibold">
                      <button
                        type="button"
                        className="rounded-full bg-white/80 px-2 py-0.5 text-slate-700 hover:bg-white"
                        onClick={() => setHeroFromGallery(url)}
                      >
                        Hlavný
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-full bg-white/80 px-2 py-0.5 text-slate-700 disabled:opacity-50"
                          disabled={index === 0}
                          onClick={() => moveGalleryItem(index, 'up')}
                          aria-label="Presunúť vľavo"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-white/80 px-2 py-0.5 text-slate-700 disabled:opacity-50"
                          disabled={index === form.gallery.length - 1}
                          onClick={() => moveGalleryItem(index, 'down')}
                          aria-label="Presunúť vpravo"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="absolute right-2 bottom-2 rounded-full bg-white/85 px-2 text-xs font-semibold text-rose-600 hover:bg-white"
                      onClick={() =>
                        updateGallery((gallery) => gallery.filter((_, itemIndex) => itemIndex !== index))
                      }
                    >
                      odstrániť
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Pridať do galérie</p>
              <div className="flex gap-2">
                <input
                  placeholder="URL nového obrázka"
                  value={newGalleryUrl}
                  onChange={(event) => setNewGalleryUrl(event.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
                <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" onClick={addImage}>
                  Pridať URL
                </button>
                <label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                  {uploading ? 'Nahrávam...' : 'Nahrať súbory'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      files.forEach((file) => handleFileUpload(file, 'gallery', uploadFolder));
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
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

            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-700 mb-3">Jazykové verzie (voliteľné)</p>
              <p className="text-xs text-slate-500 mb-4">Pre český trh môžete zadať preklad a cenu v CZK. Ak nevyplníte, použije sa základný text a cena.</p>
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
                  Krátky popis ({translationTab})
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
                {translationTab === 'cz' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Cena pre CZ (CZK)
                      <input
                        type="number"
                        min={0}
                        value={form.translations?.[translationTab]?.price ?? ''}
                        onChange={(event) => updateTranslation('price', event.target.value ? Number(event.target.value) : undefined)}
                        placeholder={form.price ? `Auto: ${calculateCzkPrice(form.price).toLocaleString('cs-CZ')} CZK` : 'Zadajte vlastnú cenu alebo nechajte prázdne'}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </label>
                    {form.price > 0 && (
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span>
                          Prepočet: {form.price} EUR × {pricingSettings?.eurToCzkRate ?? 25} = <strong>{calculateCzkPrice(form.price).toLocaleString('cs-CZ')} CZK</strong>
                        </span>
                        {!form.translations?.cz?.price && (
                          <button
                            type="button"
                            onClick={() => updateTranslation('price', calculateCzkPrice(form.price))}
                            className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                          >
                            Použiť
                          </button>
                        )}
                        {form.translations?.cz?.price && (
                          <button
                            type="button"
                            onClick={() => updateTranslation('price', undefined)}
                            className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                          >
                            Vymazať manuálnu
                          </button>
                        )}
                        <Link
                          href="/admin/settings/pricing"
                          className="ml-auto text-xs text-blue-600 hover:underline"
                        >
                          Nastaviť kurz
                        </Link>
                      </div>
                    )}
                  </div>
                )}
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
              {selectedProductId && (
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-6 py-3 font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={handleDelete}
                >
                  Vymazať produkt
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
    </AdminLayout>
  );
}
