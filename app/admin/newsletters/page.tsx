'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { emitAdminNotification, postAdminNotification } from '@/lib/adminNotifications';
import { defaultEmailSettings } from '@/lib/modules/email/types';

type Audience = 'customers' | 'admins' | 'all' | 'custom';

type Newsletter = {
  id: string;
  title: string;
  subject: string;
  html: string;
  pdfUrl?: string;
  audience: Audience;
  emails: string[];
  createdAt: number | string;
  createdBy?: string;
};

export default function NewslettersPage() {
  const [list, setList] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<p>Sem vložte obsah newslettera.</p>');
  const [pdfUrl, setPdfUrl] = useState('');
  const [audience, setAudience] = useState<Audience>('customers');
  const [emails, setEmails] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [defaultFrom, setDefaultFrom] = useState('');
  const [fromOptions, setFromOptions] = useState<string[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/newsletters', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setList(data.data ?? []);
        }

        const emailRes = await fetch('/api/email/settings');
        const emailData = await emailRes.json();
        if (emailData.success && emailData.data) {
          const addresses: string[] = (emailData.data.addresses || [])
            .filter((a: any) => a.enabled && a.email)
            .map((a: any) => a.email);
          const baseDefault = emailData.data.defaultFromEmail || defaultEmailSettings.defaultFromEmail;
          const marketingDefault =
            emailData.data.addresses?.find(
              (a: any) => a.enabled && a.purpose === 'marketing' && a.isDefault && a.email
            )?.email ||
            emailData.data.addresses?.find(
              (a: any) => a.enabled && a.purpose === 'marketing' && a.email
            )?.email ||
            baseDefault;

          const allOptions = Array.from(new Set([marketingDefault, ...addresses, baseDefault].filter(Boolean)));
          setFromOptions(allOptions);
          setDefaultFrom(marketingDefault || baseDefault);
          if (!fromEmail) setFromEmail(marketingDefault || baseDefault);
        } else {
          const fallback = defaultEmailSettings.defaultFromEmail;
          setDefaultFrom(fallback);
          setFromOptions([fallback]);
          if (!fromEmail) setFromEmail(fallback);
        }
      } catch (error) {
        console.error(error);
        setStatus('Nepodarilo sa načítať newslettery.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setHtml('<p>Sem vložte obsah newslettera.</p>');
    setPdfUrl('');
    setAudience('customers');
    setEmails('');
    setEditingId(null);
    setUploadedPdfUrl('');
  };

  const handleSave = async () => {
    if (!subject.trim() || !html.trim()) {
      setStatus('Vyplňte predmet aj obsah.');
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        id: editingId || undefined,
        title: title || subject,
        subject,
        html,
        pdfUrl: pdfUrl || undefined,
        fromEmail: fromEmail || undefined,
        audience,
        emails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
      };
      const res = await fetch('/api/newsletters', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Uloženie zlyhalo');
      if (editingId) {
        setList((prev) => prev.map((n) => (n.id === editingId ? data.data : n)));
      } else {
        setList((prev) => [data.data, ...prev]);
      }
      resetForm();
      setStatus(editingId ? 'Newsletter bol upravený.' : 'Newsletter bol uložený.');
      emitAdminNotification({ message: 'Newsletter bol uložený.', type: 'success' });
      postAdminNotification({ message: 'Newsletter bol uložený.', type: 'success' });
    } catch (error) {
      console.error(error);
      setStatus('Uloženie zlyhalo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string, subjectLabel: string) => {
    setSendingId(id);
    setStatus(null);
    try {
      const res = await fetch('/api/newsletters/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Odoslanie zlyhalo');
      const msg = `Newsletter "${subjectLabel}" bol odoslaný (${data.data?.sent ?? 0} príjemcov).`;
      setStatus(msg);
      emitAdminNotification({ message: msg, type: 'success' });
      postAdminNotification({ message: msg, type: 'success' });
    } catch (error) {
      console.error(error);
      setStatus('Odoslanie zlyhalo.');
      emitAdminNotification({ message: 'Odoslanie newslettera zlyhalo.', type: 'error' });
      postAdminNotification({ message: 'Odoslanie newslettera zlyhalo.', type: 'error' });
    } finally {
      setSendingId(null);
    }
  };

  const handleEdit = (item: Newsletter) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubject(item.subject);
    setHtml(item.html);
    setPdfUrl(item.pdfUrl || '');
    setAudience(item.audience);
    setEmails((item.emails || []).join(', '));
    if (item.fromEmail) setFromEmail(item.fromEmail);
    setStatus('Upravujete existujúci newsletter.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj odstrániť tento koncept?')) return;
    try {
      const res = await fetch('/api/newsletters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Vymazanie zlyhalo');
      setList((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      console.error(error);
      setStatus('Vymazanie zlyhalo.');
    }
  };

  const handlePdfUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadingPdf(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/newsletters/upload', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload zlyhal');
      setPdfUrl(data.url);
      setStatus('PDF bolo nahrané.');
      setUploadedPdfUrl(data.url);
      if (data.html) {
        setHtml(data.html);
        setStatus('PDF bolo nahrané a obsah bol vložený do newslettera.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Nahratie PDF zlyhalo.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const openPreview = (subjectText: string, htmlContent: string, pdf?: string) => {
    const body =
      htmlContent ||
      (pdf
        ? `<div><embed src="${pdf}" type="application/pdf" width="100%" height="900px" style="border-radius:16px; border:1px solid #e2e8f0;"/></div>`
        : '');
    setPreviewSubject(subjectText);
    setPreviewHtml(body);
  };

  return (
    <AdminLayout activePanel="newsletters">
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Marketing</p>
          <h1 className="text-3xl font-semibold text-slate-900">Newslettery</h1>
          <p className="text-sm text-slate-500">
            Vytvorte newsletter, pridajte PDF odkaz a odošlite vybraným klientom (zákazníci, admini alebo vlastný zoznam).
          </p>
        </header>

        {status && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {status}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Nový newsletter</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Názov (interný)
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Jar 2025"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Predmet emailu *
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Novinky v eshope"
                  required
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-slate-700">
              Odosielací email / alias
              <div className="mt-2 grid gap-2 md:grid-cols-[1.2fr,1fr]">
                <select
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                >
                  {fromOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === defaultFrom ? `${opt} (predvolený)` : opt}
                    </option>
                  ))}
                </select>
                {defaultFrom && (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setFromEmail(defaultFrom)}
                  >
                    Použiť predvolený ({defaultFrom})
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Vyber len z adresy/aliasov definovaných v Email nastaveniach.</p>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Obsah (HTML)
              <textarea
                rows={8}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-slate-900 focus:outline-none"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              PDF (upload alebo odkaz, nepovinné)
              <div className="mt-2 grid gap-2 md:grid-cols-[1.2fr,auto]">
                <input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="https://…/newsletter.pdf"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Nahrať PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handlePdfUpload(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {uploadingPdf && <p className="mt-1 text-xs text-slate-500">Nahrávam PDF…</p>}
              {(pdfUrl || uploadedPdfUrl) && (
                <p className="mt-1 text-xs text-slate-600">
                  Aktuálne PDF:{' '}
                  <a className="underline" href={pdfUrl || uploadedPdfUrl} target="_blank" rel="noreferrer">
                    {pdfUrl || uploadedPdfUrl}
                  </a>
                </p>
              )}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Cieľová skupina
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="customers">Zákazníci</option>
                  <option value="admins">Administrátori</option>
                  <option value="all">Všetci (admini aj zákazníci)</option>
                  <option value="custom">Vlastný zoznam</option>
                </select>
              </label>
              {audience === 'custom' && (
                <label className="text-sm font-semibold text-slate-700">
                  Emailové adresy (čiarkou oddelené)
                  <textarea
                    rows={3}
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="user1@example.com, user2@example.com"
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => openPreview(subject || '(bez predmetu)', html, pdfUrl)}
                className="mr-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Náhľad
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Ukladám…' : editingId ? 'Uložiť zmeny' : 'Uložiť koncept'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ml-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Zrušiť úpravu
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Koncepty</h2>
              <span className="text-xs text-slate-500">{list.length} uložených</span>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Načítavam…</p>
            ) : list.length === 0 ? (
              <p className="text-sm text-slate-500">Zatiaľ žiadne newslettery.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {list.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(Number(item.createdAt)).toLocaleString()} · {item.audience}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(item.subject, item.html, item.pdfUrl)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Náhľad
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Upraviť
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Vymazať
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSend(item.id, item.subject)}
                          disabled={sendingId === item.id}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {sendingId === item.id ? 'Odosielam…' : 'Odoslať'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.subject}</p>
                    {item.pdfUrl && (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener"
                        className="mt-1 inline-flex text-xs text-slate-600 underline"
                      >
                        PDF odkaz
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {previewHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Náhľad</p>
                  <h3 className="text-lg font-semibold text-slate-900">{previewSubject}</h3>
                </div>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Zavrieť
                </button>
              </div>
              <div
                className="prose prose-sm max-h-[70vh] overflow-auto prose-slate"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
