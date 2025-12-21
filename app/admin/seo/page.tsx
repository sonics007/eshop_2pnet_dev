'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type {
  SeoGlobalSettings,
  SeoPageData,
  SeoRedirect,
  SeoRobotsRule,
  SeoAuditResult
} from '@/lib/modules/seo/types';

type TabId = 'global' | 'pages' | 'redirects' | 'robots' | 'sitemap' | 'audit';

export default function SeoAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('global');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [globalSettings, setGlobalSettings] = useState<SeoGlobalSettings | null>(null);
  const [pages, setPages] = useState<SeoPageData[]>([]);
  const [redirects, setRedirects] = useState<SeoRedirect[]>([]);
  const [robotsRules, setRobotsRules] = useState<SeoRobotsRule[]>([]);
  const [sitemapUrls, setSitemapUrls] = useState<any[]>([]);
  const [auditResult, setAuditResult] = useState<SeoAuditResult | null>(null);

  // Form states
  const [editingPage, setEditingPage] = useState<SeoPageData | null>(null);
  const [editingRedirect, setEditingRedirect] = useState<Partial<SeoRedirect> | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<SeoRobotsRule> | null>(null);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'global', label: 'Globálne nastavenia' },
    { id: 'pages', label: 'Stránky' },
    { id: 'redirects', label: 'Presmerovania' },
    { id: 'robots', label: 'Robots.txt' },
    { id: 'sitemap', label: 'Sitemap' },
    { id: 'audit', label: 'SEO Audit' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'global':
          const settingsRes = await fetch('/api/seo/settings');
          const settingsData = await settingsRes.json();
          if (settingsData.success) setGlobalSettings(settingsData.data);
          break;
        case 'pages':
          const pagesRes = await fetch('/api/seo/pages');
          const pagesData = await pagesRes.json();
          if (pagesData.success) setPages(pagesData.data);
          break;
        case 'redirects':
          const redirectsRes = await fetch('/api/seo/redirects');
          const redirectsData = await redirectsRes.json();
          if (redirectsData.success) setRedirects(redirectsData.data);
          break;
        case 'robots':
          const robotsRes = await fetch('/api/seo/robots');
          const robotsData = await robotsRes.json();
          if (robotsData.success) setRobotsRules(robotsData.data);
          break;
        case 'sitemap':
          const sitemapRes = await fetch('/api/seo/sitemap');
          const sitemapData = await sitemapRes.json();
          if (sitemapData.success) setSitemapUrls(sitemapData.data);
          break;
        case 'audit':
          const auditRes = await fetch('/api/seo/audit');
          const auditData = await auditRes.json();
          if (auditData.success) setAuditResult(auditData.data);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ==================== GLOBAL SETTINGS ====================

  const saveGlobalSettings = async () => {
    if (!globalSettings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/seo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Nastavenia boli uložené');
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri ukladaní');
    }
    setSaving(false);
  };

  // ==================== PAGES ====================

  const savePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    try {
      const res = await fetch('/api/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Stránka bola uložená');
        setEditingPage(null);
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri ukladaní');
    }
    setSaving(false);
  };

  const deletePage = async (path: string) => {
    if (!confirm('Naozaj chcete odstrániť SEO nastavenia pre túto stránku?')) return;
    try {
      const res = await fetch(`/api/seo/pages?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Stránka bola odstránená');
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri odstraňovaní');
    }
  };

  // ==================== REDIRECTS ====================

  const saveRedirect = async () => {
    if (!editingRedirect) return;
    setSaving(true);
    try {
      const method = editingRedirect.id ? 'PUT' : 'POST';
      const res = await fetch('/api/seo/redirects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRedirect)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Presmerovanie bolo uložené');
        setEditingRedirect(null);
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri ukladaní');
    }
    setSaving(false);
  };

  const deleteRedirect = async (id: number) => {
    if (!confirm('Naozaj chcete odstrániť toto presmerovanie?')) return;
    try {
      const res = await fetch(`/api/seo/redirects?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Presmerovanie bolo odstránené');
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri odstraňovaní');
    }
  };

  // ==================== ROBOTS RULES ====================

  const saveRule = async () => {
    if (!editingRule) return;
    setSaving(true);
    try {
      const method = editingRule.id ? 'PUT' : 'POST';
      const res = await fetch('/api/seo/robots', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Pravidlo bolo uložené');
        setEditingRule(null);
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri ukladaní');
    }
    setSaving(false);
  };

  const deleteRule = async (id: number) => {
    if (!confirm('Naozaj chcete odstrániť toto pravidlo?')) return;
    try {
      const res = await fetch(`/api/seo/robots?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Pravidlo bolo odstránené');
        loadData();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Chyba pri odstraňovaní');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">SEO Nastavenia</h1>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-8">Načítavam...</div>
        ) : (
          <>
            {/* Global Settings Tab */}
            {activeTab === 'global' && globalSettings && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Základné nastavenia</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Názov stránky</label>
                      <input
                        type="text"
                        value={globalSettings.siteName}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, siteName: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">URL stránky</label>
                      <input
                        type="url"
                        value={globalSettings.siteUrl}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, siteUrl: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Šablóna titulku</label>
                      <input
                        type="text"
                        value={globalSettings.titleTemplate}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, titleTemplate: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="%s | Názov eshopu"
                      />
                      <p className="text-xs text-gray-500 mt-1">%s = názov stránky</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Predvolený titulok</label>
                      <input
                        type="text"
                        value={globalSettings.defaultTitle}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, defaultTitle: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Predvolený popis</label>
                      <textarea
                        value={globalSettings.defaultDescription}
                        onChange={(e) =>
                          setGlobalSettings({
                            ...globalSettings,
                            defaultDescription: e.target.value
                          })
                        }
                        className="w-full p-2 border rounded"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {globalSettings.defaultDescription.length}/160 znakov
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Predvolené kľúčové slová</label>
                      <input
                        type="text"
                        value={globalSettings.defaultKeywords}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, defaultKeywords: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="slovo1, slovo2, slovo3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Predvolený obrázok (OG)</label>
                      <input
                        type="url"
                        value={globalSettings.defaultImage || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, defaultImage: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Jazyk</label>
                      <input
                        type="text"
                        value={globalSettings.locale}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, locale: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="sk_SK"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Organizácia (Schema.org)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Názov organizácie</label>
                      <input
                        type="text"
                        value={globalSettings.organizationName || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, organizationName: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Logo URL</label>
                      <input
                        type="url"
                        value={globalSettings.organizationLogo || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, organizationLogo: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Telefón</label>
                      <input
                        type="tel"
                        value={globalSettings.organizationPhone || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, organizationPhone: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={globalSettings.organizationEmail || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, organizationEmail: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Sociálne siete</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={globalSettings.facebookUrl || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, facebookUrl: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={globalSettings.instagramUrl || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, instagramUrl: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Twitter/X handle</label>
                      <input
                        type="text"
                        value={globalSettings.twitterHandle || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, twitterHandle: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={globalSettings.linkedinUrl || ''}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, linkedinUrl: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Verifikácie</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Google Site Verification
                      </label>
                      <input
                        type="text"
                        value={globalSettings.googleSiteVerification || ''}
                        onChange={(e) =>
                          setGlobalSettings({
                            ...globalSettings,
                            googleSiteVerification: e.target.value
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bing Site Verification
                      </label>
                      <input
                        type="text"
                        value={globalSettings.bingSiteVerification || ''}
                        onChange={(e) =>
                          setGlobalSettings({
                            ...globalSettings,
                            bingSiteVerification: e.target.value
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Sitemap & Robots</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={globalSettings.sitemapEnabled}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              sitemapEnabled: e.target.checked
                            })
                          }
                          className="mr-2"
                        />
                        Sitemap povolený
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={globalSettings.robotsEnabled}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              robotsEnabled: e.target.checked
                            })
                          }
                          className="mr-2"
                        />
                        Robots.txt povolený
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Sitemap Changefreq</label>
                        <select
                          value={globalSettings.sitemapChangefreq}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              sitemapChangefreq: e.target.value as any
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="always">always</option>
                          <option value="hourly">hourly</option>
                          <option value="daily">daily</option>
                          <option value="weekly">weekly</option>
                          <option value="monthly">monthly</option>
                          <option value="yearly">yearly</option>
                          <option value="never">never</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Sitemap Priority (0-1)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={globalSettings.sitemapPriority}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              sitemapPriority: parseFloat(e.target.value)
                            })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveGlobalSettings}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
                </button>
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">
                    Nastavte SEO pre jednotlivé stránky (meta tagy, Open Graph, atď.)
                  </p>
                  <button
                    onClick={() =>
                      setEditingPage({
                        path: '',
                        pageType: 'page',
                        noIndex: false,
                        noFollow: false
                      })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Pridať stránku
                  </button>
                </div>

                {editingPage && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingPage.id ? 'Upraviť stránku' : 'Nová stránka'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cesta</label>
                        <input
                          type="text"
                          value={editingPage.path}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, path: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="/produkty/nazov"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Typ stránky</label>
                        <select
                          value={editingPage.pageType}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, pageType: e.target.value as any })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="page">Stránka</option>
                          <option value="product">Produkt</option>
                          <option value="category">Kategória</option>
                          <option value="blog">Blog</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Meta Title</label>
                        <input
                          type="text"
                          value={editingPage.metaTitle || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, metaTitle: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Canonical URL</label>
                        <input
                          type="url"
                          value={editingPage.canonicalUrl || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, canonicalUrl: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Meta Description</label>
                        <textarea
                          value={editingPage.metaDescription || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, metaDescription: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                        <input
                          type="text"
                          value={editingPage.metaKeywords || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, metaKeywords: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">OG Title</label>
                        <input
                          type="text"
                          value={editingPage.ogTitle || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, ogTitle: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">OG Image</label>
                        <input
                          type="url"
                          value={editingPage.ogImage || ''}
                          onChange={(e) =>
                            setEditingPage({ ...editingPage, ogImage: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingPage.noIndex}
                            onChange={(e) =>
                              setEditingPage({ ...editingPage, noIndex: e.target.checked })
                            }
                            className="mr-2"
                          />
                          noindex
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingPage.noFollow}
                            onChange={(e) =>
                              setEditingPage({ ...editingPage, noFollow: e.target.checked })
                            }
                            className="mr-2"
                          />
                          nofollow
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={savePage}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Ukladám...' : 'Uložiť'}
                      </button>
                      <button
                        onClick={() => setEditingPage(null)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Zrušiť
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cesta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Typ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Meta Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Akcie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pages.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            Žiadne SEO stránky
                          </td>
                        </tr>
                      ) : (
                        pages.map((page) => (
                          <tr key={page.path}>
                            <td className="px-6 py-4 text-sm">{page.path}</td>
                            <td className="px-6 py-4 text-sm">{page.pageType}</td>
                            <td className="px-6 py-4 text-sm">{page.metaTitle || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => setEditingPage(page)}
                                className="text-blue-600 hover:underline mr-3"
                              >
                                Upraviť
                              </button>
                              <button
                                onClick={() => deletePage(page.path)}
                                className="text-red-600 hover:underline"
                              >
                                Odstrániť
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Redirects Tab */}
            {activeTab === 'redirects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">
                    Nastavte presmerovania pre staré alebo zmenené URL adresy
                  </p>
                  <button
                    onClick={() =>
                      setEditingRedirect({ fromPath: '', toPath: '', statusCode: 301, enabled: true })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Pridať presmerovanie
                  </button>
                </div>

                {editingRedirect && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingRedirect.id ? 'Upraviť presmerovanie' : 'Nové presmerovanie'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Z cesty</label>
                        <input
                          type="text"
                          value={editingRedirect.fromPath || ''}
                          onChange={(e) =>
                            setEditingRedirect({ ...editingRedirect, fromPath: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="/stara-stranka"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Na cestu</label>
                        <input
                          type="text"
                          value={editingRedirect.toPath || ''}
                          onChange={(e) =>
                            setEditingRedirect({ ...editingRedirect, toPath: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="/nova-stranka"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status kód</label>
                        <select
                          value={editingRedirect.statusCode || 301}
                          onChange={(e) =>
                            setEditingRedirect({
                              ...editingRedirect,
                              statusCode: parseInt(e.target.value) as 301 | 302
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value={301}>301 (Trvalé)</option>
                          <option value={302}>302 (Dočasné)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingRedirect.enabled ?? true}
                          onChange={(e) =>
                            setEditingRedirect({ ...editingRedirect, enabled: e.target.checked })
                          }
                          className="mr-2"
                        />
                        Aktívne
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={saveRedirect}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Ukladám...' : 'Uložiť'}
                      </button>
                      <button
                        onClick={() => setEditingRedirect(null)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Zrušiť
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Z
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Na
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Kód
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Počet presmerovaní
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stav
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Akcie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {redirects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Žiadne presmerovania
                          </td>
                        </tr>
                      ) : (
                        redirects.map((redirect) => (
                          <tr key={redirect.id}>
                            <td className="px-6 py-4 text-sm font-mono">{redirect.fromPath}</td>
                            <td className="px-6 py-4 text-sm font-mono">{redirect.toPath}</td>
                            <td className="px-6 py-4 text-sm">{redirect.statusCode}</td>
                            <td className="px-6 py-4 text-sm">{redirect.hits}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  redirect.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {redirect.enabled ? 'Aktívne' : 'Neaktívne'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => setEditingRedirect(redirect)}
                                className="text-blue-600 hover:underline mr-3"
                              >
                                Upraviť
                              </button>
                              <button
                                onClick={() => deleteRedirect(redirect.id!)}
                                className="text-red-600 hover:underline"
                              >
                                Odstrániť
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Robots Tab */}
            {activeTab === 'robots' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">
                    Nastavte pravidlá pre vyhľadávacie roboty (robots.txt)
                  </p>
                  <button
                    onClick={() =>
                      setEditingRule({
                        userAgent: '*',
                        directive: 'Allow',
                        path: '/',
                        enabled: true,
                        order: 0
                      })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Pridať pravidlo
                  </button>
                </div>

                {editingRule && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingRule.id ? 'Upraviť pravidlo' : 'Nové pravidlo'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">User-Agent</label>
                        <input
                          type="text"
                          value={editingRule.userAgent || ''}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, userAgent: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="*"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Direktíva</label>
                        <select
                          value={editingRule.directive || 'Allow'}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              directive: e.target.value as any
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="Allow">Allow</option>
                          <option value="Disallow">Disallow</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cesta</label>
                        <input
                          type="text"
                          value={editingRule.path || ''}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, path: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="/"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingRule.enabled ?? true}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, enabled: e.target.checked })
                          }
                          className="mr-2"
                        />
                        Aktívne
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={saveRule}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Ukladám...' : 'Uložiť'}
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Zrušiť
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User-Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Direktíva
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cesta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stav
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Akcie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {robotsRules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Žiadne pravidlá (bude použité predvolené Allow: /)
                          </td>
                        </tr>
                      ) : (
                        robotsRules.map((rule) => (
                          <tr key={rule.id}>
                            <td className="px-6 py-4 text-sm font-mono">{rule.userAgent}</td>
                            <td className="px-6 py-4 text-sm">{rule.directive}</td>
                            <td className="px-6 py-4 text-sm font-mono">{rule.path}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  rule.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {rule.enabled ? 'Aktívne' : 'Neaktívne'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => setEditingRule(rule)}
                                className="text-blue-600 hover:underline mr-3"
                              >
                                Upraviť
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id!)}
                                className="text-red-600 hover:underline"
                              >
                                Odstrániť
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Náhľad robots.txt</h3>
                  <a
                    href="/api/seo/robots?format=txt"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Zobraziť aktuálny robots.txt
                  </a>
                </div>
              </div>
            )}

            {/* Sitemap Tab */}
            {activeTab === 'sitemap' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sitemap</h3>
                    <a
                      href="/api/seo/sitemap?format=xml"
                      target="_blank"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Stiahnuť sitemap.xml
                    </a>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Sitemap obsahuje {sitemapUrls.length} URL adries
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Posledná zmena
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Frekvencia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Priorita
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sitemapUrls.map((url, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm font-mono truncate max-w-md">
                            {url.loc}
                          </td>
                          <td className="px-6 py-4 text-sm">{url.lastmod || '-'}</td>
                          <td className="px-6 py-4 text-sm">{url.changefreq || '-'}</td>
                          <td className="px-6 py-4 text-sm">{url.priority || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && auditResult && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">SEO Skóre</h3>
                    <div
                      className={`text-4xl font-bold ${
                        auditResult.score >= 80
                          ? 'text-green-600'
                          : auditResult.score >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {auditResult.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        auditResult.score >= 80
                          ? 'bg-green-500'
                          : auditResult.score >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${auditResult.score}%` }}
                    ></div>
                  </div>
                </div>

                {auditResult.issues.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Problémy na opravu</h3>
                    <div className="space-y-3">
                      {auditResult.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded border-l-4 ${
                            issue.type === 'error'
                              ? 'bg-red-50 border-red-500'
                              : issue.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded ${
                                issue.type === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : issue.type === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {issue.type === 'error'
                                ? 'Chyba'
                                : issue.type === 'warning'
                                ? 'Varovanie'
                                : 'Info'}
                            </span>
                            <span className="text-xs text-gray-500">{issue.category}</span>
                          </div>
                          <p className="font-medium">{issue.message}</p>
                          {issue.recommendation && (
                            <p className="text-sm text-gray-600 mt-1">{issue.recommendation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {auditResult.passed.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">V poriadku</h3>
                    <ul className="space-y-2">
                      {auditResult.passed.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-green-700">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={loadData}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Spustiť audit znova
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
