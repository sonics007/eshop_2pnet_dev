"use client";

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type {
  EmailSettings,
  EmailAddress,
  EmailPurpose,
  ImapSettings,
  SmtpSettings
} from '@/lib/modules/email/types';
import {
  defaultEmailSettings,
  defaultRegistrationTemplate,
  defaultTemplates,
  purposeLabels
} from '@/lib/modules/email/types';

type MessageState = { type: 'success' | 'error' | 'info'; text: string } | null;
type ActiveTab = 'addresses' | 'imap' | 'smtp' | 'branding' | 'templates' | 'newsletters';

const purposeOptions: EmailPurpose[] = [
  'general',
  'orders',
  'support',
  'complaints',
  'invoices',
  'marketing',
  'noreply'
];

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>(defaultEmailSettings);
  const [loadedSettings, setLoadedSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imapTesting, setImapTesting] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('addresses');
  const [testRecipient, setTestRecipient] = useState('');
  const [testFrom, setTestFrom] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(defaultTemplates[0].id);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    return settings.addresses.find((addr) => addr.id === selectedAddressId) || null;
  }, [selectedAddressId, settings.addresses]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<EmailAddress, 'id'>>({
    purpose: 'general',
    label: '',
    email: '',
    name: '',
    description: '',
    isDefault: false,
    enabled: true
  });

  const enabledAddresses = useMemo(() => {
    return [...settings.addresses].sort((a, b) => a.purpose.localeCompare(b.purpose));
  }, [settings.addresses]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/email/settings');
        const payload = await response.json();
        if (payload.success && payload.data) {
          const incomingTemplates: typeof defaultTemplates =
            payload.data.templates && Array.isArray(payload.data.templates) && payload.data.templates.length
              ? payload.data.templates
              : defaultTemplates;

          // Zlúč default šablóny s uloženými podľa key (aby pribudla Obnova hesla)
          const mergedTemplates = defaultTemplates.map((tpl) => {
            const match = incomingTemplates.find((t) => t.key === tpl.key);
            return match ? { ...tpl, ...match } : tpl;
          });
          // zachovaj prípadné custom šablóny
          incomingTemplates
            .filter((t) => !defaultTemplates.find((d) => d.key === t.key))
            .forEach((t) => mergedTemplates.push(t));

          const withTemplate = {
            ...payload.data,
            registrationTemplate: {
              ...defaultRegistrationTemplate,
              ...(payload.data.registrationTemplate || {})
            },
            templates: mergedTemplates
          };
          setSettings(withTemplate);
          setLoadedSettings(withTemplate);
          setActiveTemplateId(withTemplate.templates?.[0]?.id || defaultTemplates[0].id);
        } else {
          setMessage({ type: 'error', text: payload.error || 'Nepodarilo sa načítať nastavenia.' });
        }
      } catch (error) {
        console.error('Failed to load email settings:', error);
        setMessage({ type: 'error', text: 'Nepodarilo sa načítať nastavenia.' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const updateSettings = (patch: Partial<EmailSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      registrationTemplate: patch.registrationTemplate
        ? { ...defaultRegistrationTemplate, ...prev.registrationTemplate, ...patch.registrationTemplate }
        : prev.registrationTemplate || defaultRegistrationTemplate,
      templates: patch.templates
        ? patch.templates
        : prev.templates?.length
          ? prev.templates
          : defaultTemplates
    }));
  };

  const updateImap = (patch: Partial<ImapSettings>) => {
    setSettings((prev) => ({ ...prev, imap: { ...prev.imap, ...patch } }));
  };

  const updateSmtp = (patch: Partial<SmtpSettings>) => {
    setSettings((prev) => ({ ...prev, smtp: { ...prev.smtp, ...patch } }));
  };

  const updateSmtpAuth = (patch: Partial<SmtpSettings['auth']>) => {
    setSettings((prev) => ({
      ...prev,
      smtp: {
        ...prev.smtp,
        auth: { ...prev.smtp.auth, ...patch }
      }
    }));
  };

  const addAlias = () => {
    const alias = aliasInput.trim();
    if (!alias) return;
    const nextAliases = Array.from(new Set([...(settings.fromAliases || []), alias]));
    setSettings((prev) => ({
      ...prev,
      fromAliases: nextAliases
    }));
    setAliasInput('');
    persistAliases(nextAliases);
  };

  const removeAlias = (alias: string) => {
    const nextAliases = (settings.fromAliases || []).filter((item) => item !== alias);
    setSettings((prev) => ({
      ...prev,
      fromAliases: nextAliases
    }));
    persistAliases(nextAliases);
  };

  const persistAliases = async (aliases: string[]) => {
    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAliases: aliases })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Uloženie aliasov zlyhalo.');
      }
      setSettings((prev) => ({
        ...prev,
        fromAliases: data.data?.fromAliases || aliases
      }));
      setMessage({ type: 'success', text: 'Alias uložený.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Uloženie aliasov zlyhalo. Skúste znova.' });
    }
  };

  const templates = settings.templates?.length ? settings.templates : defaultTemplates;
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const updateTemplate = (id: string, patch: Partial<(typeof templates)[number]>) => {
    setSettings((prev) => ({
      ...prev,
      templates: templates.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }));
  };

  const addTemplate = () => {
    const newId = `tpl-${Date.now()}`;
    const newTemplate = {
      ...defaultRegistrationTemplate,
      id: newId,
      key: `custom-${templates.length + 1}`,
      name: `Šablóna ${templates.length + 1}`,
      fromEmail: settings.defaultFromEmail || ''
    };
    const nextTemplates = [...templates, newTemplate];
    setSettings((prev) => ({ ...prev, templates: nextTemplates }));
    setActiveTemplateId(newId);
  };

  const removeTemplate = (id: string) => {
    if (templates.length <= 1) return;
    const nextTemplates = templates.filter((t) => t.id !== id);
    setSettings((prev) => ({ ...prev, templates: nextTemplates }));
    setActiveTemplateId(nextTemplates[0]?.id || defaultTemplates[0].id);
  };

  useEffect(() => {
    if (!templates.find((t) => t.id === activeTemplateId) && templates[0]) {
      setActiveTemplateId(templates[0].id);
    }
  }, [templates, activeTemplateId]);

  const updateAddress = (id: string, patch: Partial<EmailAddress>) => {
    setSettings((prev) => ({
      ...prev,
      addresses: prev.addresses.map((addr) => (addr.id === id ? { ...addr, ...patch } : addr))
    }));
  };

  const removeAddress = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((addr) => addr.id !== id)
    }));
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
    }
  };

  const addAddress = () => {
    if (!newAddress.email.trim() || !newAddress.label.trim()) {
      setMessage({ type: 'error', text: 'Vyplňte email aj názov.' });
      return;
    }
    const id = `${newAddress.purpose}-${Date.now()}`;
    setSettings((prev) => ({
      ...prev,
      addresses: [...prev.addresses, { ...newAddress, id }]
    }));
    setNewAddress({ purpose: 'general', label: '', email: '', name: '', description: '', isDefault: false, enabled: true });
    setIsAddingNew(false);
    setSelectedAddressId(id);
    setMessage({ type: 'success', text: 'Adresa pridaná.' });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const imapPayload: ImapSettings = {
      ...settings.imap,
      auth: {
        user: settings.imap.auth.user,
        pass: settings.imap.auth.pass || loadedSettings?.imap.auth.pass || ''
      }
    };

    const smtpPayload: SmtpSettings = {
      ...settings.smtp,
      auth: {
        user: settings.smtp.auth.user,
        pass: settings.smtp.auth.pass || loadedSettings?.smtp.auth.pass || ''
      }
    };

    const payload: Partial<EmailSettings> = {
      ...settings,
      registrationTemplate: {
        ...defaultRegistrationTemplate,
        ...(settings.registrationTemplate || {})
      },
      templates,
      imap: imapPayload,
      smtp: smtpPayload
    };

    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Uloženie zlyhalo.');
      }
      setSettings(data.data);
      setLoadedSettings(data.data);
      setMessage({ type: 'success', text: 'Nastavenia boli uložené.' });
    } catch (error) {
      console.error('Save failed', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Uloženie zlyhalo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestImap = async () => {
    setImapTesting(true);
    setMessage({
      type: 'info',
      text: 'Overujem IMAP pripojenie...'
    });
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'imap' })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Test zlyhal.');
      }
      setMessage({
        type: 'success',
        text: data.message || 'IMAP spojenie je funkčné.'
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Test zlyhal.' });
    } finally {
      setImapTesting(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setMessage({
      type: 'info',
      text: 'Overujem SMTP pripojenie...'
    });
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'smtp' })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Test zlyhal.');
      }
      setMessage({
        type: 'success',
        text: data.message || 'SMTP spojenie je funkčné.'
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Test zlyhal.' });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    const to = testRecipient.trim();
    if (!to) {
      setMessage({ type: 'error', text: 'Zadajte adresu príjemcu.' });
      return;
    }
    setSendingTest(true);
    setMessage({ type: 'info', text: 'Pokúšam sa odoslať testovací email...' });
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'send', to, from: testFrom || undefined })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Test email zlyhal.');
      }
      setMessage({ type: 'success', text: data.message || 'Testovací email bol odoslaný.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Test email zlyhal.' });
    } finally {
      setSendingTest(false);
    }
  };

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'addresses', label: 'Adresy' },
    { id: 'imap', label: 'IMAP' },
    { id: 'smtp', label: 'SMTP / Odosielanie' },
    { id: 'branding', label: 'Branding' },
    { id: 'templates', label: 'Šablóny emailov' },
    { id: 'newsletters', label: 'Newsletter' }
  ];

  return (
    <AdminLayout activePanel="admin-email">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Integrácie</p>
        <h1 className="text-4xl font-semibold text-slate-900">Email</h1>
        <p className="mt-2 text-sm text-slate-500">Adresy, IMAP (príjem) a SMTP (odosielanie) na jednom mieste.</p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : message.type === 'error'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Načítavam nastavenia...</p>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            {/* Public URL */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Verejná adresa (NEXT_PUBLIC_SITE_URL)</h2>
              <p className="text-sm text-slate-500">
                Používa sa pri generovaní odkazov v emailoch (reset hesla, pozvánky adminov). Zadajte plnú URL vrátane https://.
              </p>
              <input
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="https://dev.krizo.eu"
                value={settings.publicBaseUrl || ''}
                onChange={(e) => updateSettings({ publicBaseUrl: e.target.value })}
              />
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Emailové adresy</h2>
                    <p className="text-sm text-slate-500">Spravujte adresy pre rôzne účely.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsAddingNew(true); setSelectedAddressId(null); }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + Pridať adresu
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {enabledAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`rounded-2xl border ${selectedAddressId === address.id ? 'border-slate-900' : 'border-slate-100'} bg-slate-50 p-4`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={address.enabled}
                            onChange={(e) => updateAddress(address.id, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="font-semibold">{address.label || address.email || purposeLabels[address.purpose]}</span>
                          <span className="text-xs text-slate-500">({purposeLabels[address.purpose]})</span>
                          {address.isDefault && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">Predvolená</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedAddressId(address.id); setIsAddingNew(false); }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => removeAddress(address.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Odstrániť
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {enabledAddresses.length === 0 && (
                    <p className="text-sm text-slate-500">Žiadne adresy. Pridajte aspoň jednu.</p>
                  )}
                </div>
              </section>
            )}

            {/* IMAP */}
            {activeTab === 'imap' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <h2 className="text-lg font-semibold text-slate-900">IMAP pripojenie (prijímanie)</h2>
                <p className="text-sm text-slate-500">Host, port a prihlasovacie údaje pre sťahovanie správ.</p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Host
                    <input
                      value={settings.imap.host}
                      onChange={(e) => updateImap({ host: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="imap.gmail.com"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Port
                    <input
                      type="number"
                      value={settings.imap.port}
                      onChange={(e) => updateImap({ port: Number(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="993"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Bezpečné pripojenie (SSL/TLS)
                    <select
                      value={settings.imap.secure ? 'yes' : 'no'}
                      onChange={(e) => updateImap({ secure: e.target.value === 'yes' })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="yes">Áno (SSL/TLS)</option>
                      <option value="no">Nie</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    IMAP používateľ
                    <input
                      value={settings.imap.auth.user}
                      onChange={(e) => updateImap({ auth: { ...settings.imap.auth, user: e.target.value } })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="mail@firma.sk"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    IMAP heslo
                    <input
                      type="password"
                      value={settings.imap.auth.pass || ''}
                      onChange={(e) => updateImap({ auth: { ...settings.imap.auth, pass: e.target.value } })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <span className="text-xs text-slate-500">Ak pole necháte prázdne, existujúce heslo sa nezmení.</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTestImap}
                  disabled={imapTesting}
                  className="mt-4 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {imapTesting ? 'Overujem...' : 'Testovať IMAP'}
                </button>
              </section>
            )}

            {/* SMTP */}
            {activeTab === 'smtp' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">SMTP pripojenie (odosielanie)</h2>
                    <p className="text-sm text-slate-500">Host, port, prihlasovacie údaje a testovanie odosielania.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => updateSettings({ enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Odosielanie povolené
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Host
                    <input
                      value={settings.smtp.host}
                      onChange={(e) => updateSmtp({ host: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="smtp.gmail.com"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Port
                    <input
                      type="number"
                      value={settings.smtp.port}
                      onChange={(e) => updateSmtp({ port: Number(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="587"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Bezpečné pripojenie
                    <select
                      value={settings.smtp.secure ? 'yes' : 'no'}
                      onChange={(e) => updateSmtp({ secure: e.target.value === 'yes' })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="yes">Áno (SSL/TLS)</option>
                      <option value="no">Nie</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    SMTP používateľ
                    <input
                      value={settings.smtp.auth.user}
                      onChange={(e) => updateSmtpAuth({ user: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="mail@firma.sk"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    SMTP heslo
                    <input
                      type="password"
                      value={settings.smtp.auth.pass || ''}
                      onChange={(e) => updateSmtpAuth({ pass: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <span className="text-xs text-slate-500">Ak pole necháte prázdne, existujúce heslo sa nezmení.</span>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Default From email
                    <input
                      value={settings.defaultFromEmail || ''}
                      onChange={(e) => updateSettings({ defaultFromEmail: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="no-reply@firma.sk"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Default From meno
                    <input
                      value={settings.defaultFromName || ''}
                      onChange={(e) => updateSettings({ defaultFromName: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="Eshop"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Reply-To
                    <input
                      value={settings.defaultReplyTo || ''}
                      onChange={(e) => updateSettings({ defaultReplyTo: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="support@firma.sk"
                    />
                  </label>
                </div>

                <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Masky / aliasy From</p>
                      <p className="text-xs text-slate-500">Adresy, z ktorých SMTP server dovolí odosielať (napr. eshop@2pnet.cz, podpora@2pnet.cz).</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(settings.fromAliases || []).map((alias) => (
                      <span key={alias} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 border border-slate-200">
                        {alias}
                        <button
                          type="button"
                          onClick={() => removeAlias(alias)}
                          className="text-slate-400 hover:text-slate-600"
                          aria-label={`Odstrániť ${alias}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(settings.fromAliases || []).length === 0 && (
                      <span className="text-sm text-slate-500">Zatiaľ žiadne aliasy.</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAlias();
                        }
                      }}
                      className="flex-1 min-w-[200px] rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="podpora@2pnet.cz"
                    />
                    <button
                      type="button"
                      onClick={addAlias}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Pridať alias
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    SMTP server musí aliasy poznať (SPF/DKIM/DMARC). V aplikácii ich evidujeme a môžete ich použiť ako From.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.smtp.tls?.rejectUnauthorized !== false}
                      onChange={(e) => updateSmtp({ tls: { ...settings.smtp.tls, rejectUnauthorized: e.target.checked } })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Overovať certifikát servera
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.testMode}
                      onChange={(e) => updateSettings({ testMode: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Testovací režim (presmeruje na príjemcu nižšie)
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Timeout pripojenia (ms)
                    <input
                      type="number"
                      value={settings.smtp.connectionTimeout || 0}
                      onChange={(e) => updateSmtp({ connectionTimeout: Number(e.target.value) || 0 })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="10000"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Timeout pozdravu (ms)
                    <input
                      type="number"
                      value={settings.smtp.greetingTimeout || 0}
                      onChange={(e) => updateSmtp({ greetingTimeout: Number(e.target.value) || 0 })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="10000"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={smtpTesting}
                    className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {smtpTesting ? 'Overujem...' : 'Testovať SMTP'}
                  </button>
                  <label className="text-sm font-semibold text-slate-700 flex-1 min-w-[240px]">
                    Testovací príjemca
                    <input
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendTestEmail();
                        }
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="test@firma.sk"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 flex-1 min-w-[200px]">
                    Odoslať ako (From)
                    <select
                      value={testFrom}
                      onChange={(e) => setTestFrom(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="">{settings.defaultFromEmail || 'Predvolená adresa'}</option>
                      {(settings.fromAliases || []).map((alias) => (
                        <option key={alias} value={alias}>
                          {alias}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {sendingTest ? 'Odosielam...' : 'Odoslať testovací email'}
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Testovací režim presmeruje všetky emaily na zadaného príjemcu. IMAP ostáva nezmenený.
                </p>
              </section>
            )}

            {/* Branding */}
            {activeTab === 'branding' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Branding a podpis</h2>
                  <p className="text-sm text-slate-500">Voliteľné logo, farba a podpis.</p>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Logo URL
                  <input
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-[120px,1fr]">
                  <label className="text-sm font-semibold text-slate-700">
                    Farba značky
                    <input
                      type="color"
                      value={settings.brandColor || '#1e293b'}
                      onChange={(e) => updateSettings({ brandColor: e.target.value })}
                      className="h-12 w-12 rounded-xl border border-slate-200 cursor-pointer"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Farba (hex)
                    <input
                      value={settings.brandColor || '#1e293b'}
                      onChange={(e) => updateSettings({ brandColor: e.target.value })}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="#1e293b"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Textový podpis
                  <textarea
                    value={settings.footerText || ''}
                    onChange={(e) => updateSettings({ footerText: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    rows={2}
                    placeholder="Tento email bol odoslaný automaticky..."
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  HTML podpis
                  <textarea
                    value={settings.footerHtml || ''}
                    onChange={(e) => updateSettings({ footerHtml: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
                    rows={4}
                    placeholder="<p>Ďakujeme, tím Eshop</p>"
                  />
                </label>
              </section>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Šablóny emailov</h2>
                      <p className="text-sm text-slate-500">Vyberte šablónu ako v prehliadači (tabs) a upravte jej obsah.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-end gap-[2px] border-b border-slate-200 pb-[1px]">
                      {templates.map((tpl) => {
                        const isActive = activeTemplateId === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            className={`relative flex items-center rounded-t-2xl border px-2.5 py-1 text-xs font-semibold transition ${
                              isActive
                                ? 'border-slate-300 border-b-white bg-white text-slate-900 shadow-sm'
                                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            style={{ marginLeft: '-6px' }}
                          >
                            <button
                              onClick={() => setActiveTemplateId(tpl.id)}
                              className="pr-3 text-left leading-tight"
                            >
                              {tpl.name || tpl.key}
                            </button>
                            <button
                              onClick={() => removeTemplate(tpl.id)}
                              disabled={templates.length <= 1}
                              className="absolute right-1 top-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-40"
                              aria-label="Zmazať šablónu"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button
                        onClick={addTemplate}
                        className="mb-[-1px] rounded-t-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        aria-label="Pridať šablónu"
                        style={{ marginLeft: '-6px' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {activeTemplate && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Názov šablóny
                        <input
                          value={activeTemplate.name}
                          onChange={(e) => updateTemplate(activeTemplate.id, { name: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Napr. Registrácia"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Odosielacia adresa
                        <select
                          value={activeTemplate.fromEmail || ''}
                          onChange={(e) => updateTemplate(activeTemplate.id, { fromEmail: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        >
                          <option value="">{settings.defaultFromEmail || 'Predvolená'}</option>
                          {settings.addresses
                            .filter((a) => a.enabled && a.email)
                            .map((addr) => (
                              <option key={addr.id} value={addr.email}>
                                {addr.label || addr.email}
                              </option>
                            ))}
                          {(settings.fromAliases || []).map((alias) => (
                            <option key={alias} value={alias}>
                              {alias}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Predmet
                        <input
                          value={activeTemplate.subject}
                          onChange={(e) => updateTemplate(activeTemplate.id, { subject: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Vitajte v eshope"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Nadpis
                        <input
                          value={activeTemplate.title}
                          onChange={(e) => updateTemplate(activeTemplate.id, { title: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Ďakujeme za registráciu"
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Úvodný text
                      <textarea
                        value={activeTemplate.intro}
                        onChange={(e) => updateTemplate(activeTemplate.id, { intro: e.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        rows={3}
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Text tlačidla
                        <input
                          value={activeTemplate.buttonLabel}
                          onChange={(e) => updateTemplate(activeTemplate.id, { buttonLabel: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Prejsť do účtu"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        URL tlačidla
                        <input
                          value={activeTemplate.buttonUrl}
                          onChange={(e) => updateTemplate(activeTemplate.id, { buttonUrl: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="/account"
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Záverečný text
                      <textarea
                        value={activeTemplate.closing}
                        onChange={(e) => updateTemplate(activeTemplate.id, { closing: e.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        rows={2}
                      />
                    </label>
                  </>
                )}
              </section>
            )}

            {activeTab === 'newsletters' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Newsletter</h2>
                <p className="text-sm text-slate-600">
                  Modul pre tvorbu a odosielanie newsletterov nájdete tu:
                </p>
                <a
                  href="/admin/newsletters"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Otvoriť modul Newsletter
                </a>
              </section>
            )}

            {/* Uložiť */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
              </button>
            </div>
          </div>

          {/* Bočný panel na detail/pridanie adresy */}
          {(selectedAddress || isAddingNew) && (
            <div className="w-96 flex-shrink-0">
              <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">
                    {isAddingNew ? 'Nová adresa' : 'Detail adresy'}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedAddressId(null);
                      setIsAddingNew(false);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {isAddingNew ? (
                    <>
                      <label className="block text-sm font-semibold text-slate-700">
                        Účel
                        <select
                          value={newAddress.purpose}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, purpose: e.target.value as EmailPurpose }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        >
                          {purposeOptions.map((purpose) => (
                            <option key={purpose} value={purpose}>
                              {purposeLabels[purpose]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Názov *
                        <input
                          value={newAddress.label}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Objednávky"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Email *
                        <input
                          value={newAddress.email}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, email: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="orders@firma.sk"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Meno odosielateľa
                        <input
                          value={newAddress.name || ''}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          placeholder="Eshop Objednávky"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Popis (interná poznámka)
                        <textarea
                          value={newAddress.description || ''}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, description: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          rows={4}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Nastaviť ako predvolenú
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={addAddress}
                          className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Uložiť adresu
                        </button>
                        <button
                          onClick={() => { setIsAddingNew(false); }}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Zrušiť
                        </button>
                      </div>
                    </>
                  ) : selectedAddress ? (
                    <>
                      <label className="block text-sm font-semibold text-slate-700">
                        Účel
                        <select
                          value={selectedAddress.purpose}
                          onChange={(e) => updateAddress(selectedAddress.id, { purpose: e.target.value as EmailPurpose })}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        >
                          {purposeOptions.map((purpose) => (
                            <option key={purpose} value={purpose}>
                              {purposeLabels[purpose]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Názov
                        <input
                          value={selectedAddress.label}
                          onChange={(e) => updateAddress(selectedAddress.id, { label: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Email
                        <input
                          value={selectedAddress.email}
                          onChange={(e) => updateAddress(selectedAddress.id, { email: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Meno odosielateľa
                        <input
                          value={selectedAddress.name || ''}
                          onChange={(e) => updateAddress(selectedAddress.id, { name: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Popis (interná poznámka)
                        <textarea
                          value={selectedAddress.description || ''}
                          onChange={(e) => updateAddress(selectedAddress.id, { description: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                          rows={4}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedAddress.enabled}
                          onChange={(e) => updateAddress(selectedAddress.id, { enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Povolená
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedAddress.isDefault || false}
                          onChange={(e) => updateAddress(selectedAddress.id, { isDefault: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Predvolená pre daný účel
                      </label>
                      <button
                        onClick={() => removeAddress(selectedAddress.id)}
                        className="w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Odstrániť adresu
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
