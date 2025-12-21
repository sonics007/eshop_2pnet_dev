'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  productCount?: number;
}

interface Category {
  id: number;
  name: string;
  productCount: number;
  subcategories: SubCategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [newSubcategoryName, setNewSubcategoryName] = useState<Record<number, string>>({});
  const [editingSubcategory, setEditingSubcategory] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setMessage({ type: 'error', text: 'Nepodarilo sa načítať kategórie' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setCategories([...categories, data.data]);
        setNewCategoryName('');
        setMessage({ type: 'success', text: 'Kategória vytvorená' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri vytváraní kategórie' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory || !editingCategory.name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory.name.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: data.data.name } : c));
        setEditingCategory(null);
        setMessage({ type: 'success', text: 'Kategória aktualizovaná' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri aktualizácii' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Naozaj chcete odstrániť túto kategóriu?')) return;
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.filter(c => c.id !== id));
        setMessage({ type: 'success', text: 'Kategória odstránená' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri mazaní' });
    }
  }

  async function handleAddSubcategory(categoryId: number) {
    const name = newSubcategoryName[categoryId]?.trim();
    if (!name) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c => 
          c.id === categoryId 
            ? { ...c, subcategories: [...c.subcategories, data.data] }
            : c
        ));
        setNewSubcategoryName({ ...newSubcategoryName, [categoryId]: '' });
        setMessage({ type: 'success', text: 'Podkategória vytvorená' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri vytváraní podkategórie' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSubcategory() {
    if (!editingSubcategory || !editingSubcategory.name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/subcategories/${editingSubcategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSubcategory.name.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c => ({
          ...c,
          subcategories: c.subcategories.map(s => 
            s.id === editingSubcategory.id ? { ...s, name: data.data.name } : s
          )
        })));
        setEditingSubcategory(null);
        setMessage({ type: 'success', text: 'Podkategória aktualizovaná' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri aktualizácii' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubcategory(id: number, categoryId: number) {
    if (!confirm('Naozaj chcete odstrániť túto podkategóriu?')) return;
    try {
      const response = await fetch(`/api/subcategories/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c => 
          c.id === categoryId
            ? { ...c, subcategories: c.subcategories.filter(s => s.id !== id) }
            : c
        ));
        setMessage({ type: 'success', text: 'Podkategória odstránená' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri mazaní' });
    }
  }

  const toggleExpand = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <AdminLayout activePanel="admin-categories">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Načítavam kategórie...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePanel="admin-categories">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Produkty</p>
        <h1 className="text-4xl font-semibold text-slate-900">Kategórie & Podkategórie</h1>
        <p className="mt-2 text-sm text-slate-500">
          Správa kategórií a podkategórií produktov
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl p-4 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Nová kategória</h2>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Názov kategórie"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={saving || !newCategoryName.trim()}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Pridať
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Existujúce kategórie</h2>
          
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Žiadne kategórie. Vytvorte prvú vyššie.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {categories.map(category => (
                <div key={category.id} className="rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => toggleExpand(category.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {expandedCategories.has(category.id) ? '▼' : '▶'}
                    </button>
                    
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-1 text-sm focus:border-slate-900 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 font-medium text-slate-900">{category.name}</span>
                    )}
                    
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      {category.productCount} produktov
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      {category.subcategories.length} podkategórií
                    </span>
                    
                    {editingCategory?.id === category.id ? (
                      <>
                        <button type="button" onClick={handleUpdateCategory} className="text-xs text-emerald-600 hover:text-emerald-800">Uložiť</button>
                        <button type="button" onClick={() => setEditingCategory(null)} className="text-xs text-slate-500 hover:text-slate-700">Zrušiť</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setEditingCategory({ id: category.id, name: category.name })} className="text-xs text-slate-500 hover:text-slate-700">Upraviť</button>
                        <button type="button" onClick={() => handleDeleteCategory(category.id)} className="text-xs text-rose-500 hover:text-rose-700">Odstrániť</button>
                      </>
                    )}
                  </div>

                  {expandedCategories.has(category.id) && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Podkategórie</p>
                      
                      {category.subcategories.length === 0 ? (
                        <p className="mb-3 text-sm text-slate-500">Žiadne podkategórie</p>
                      ) : (
                        <ul className="mb-4 space-y-2">
                          {category.subcategories.map(sub => (
                            <li key={sub.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                              {editingSubcategory?.id === sub.id ? (
                                <input
                                  type="text"
                                  value={editingSubcategory.name}
                                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-slate-900 focus:outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubcategory()}
                                  autoFocus
                                />
                              ) : (
                                <span className="flex-1 text-sm text-slate-700">{sub.name}</span>
                              )}
                              
                              {sub.productCount !== undefined && (
                                <span className="text-xs text-slate-400">{sub.productCount} produktov</span>
                              )}
                              
                              {editingSubcategory?.id === sub.id ? (
                                <>
                                  <button type="button" onClick={handleUpdateSubcategory} className="text-xs text-emerald-600 hover:text-emerald-800">Uložiť</button>
                                  <button type="button" onClick={() => setEditingSubcategory(null)} className="text-xs text-slate-500 hover:text-slate-700">Zrušiť</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => setEditingSubcategory({ id: sub.id, name: sub.name })} className="text-xs text-slate-500 hover:text-slate-700">Upraviť</button>
                                  <button type="button" onClick={() => handleDeleteSubcategory(sub.id, category.id)} className="text-xs text-rose-500 hover:text-rose-700">Odstrániť</button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubcategoryName[category.id] || ''}
                          onChange={(e) => setNewSubcategoryName({ ...newSubcategoryName, [category.id]: e.target.value })}
                          placeholder="Nová podkategória"
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubcategory(category.id)}
                          disabled={saving || !newSubcategoryName[category.id]?.trim()}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          Pridať
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
