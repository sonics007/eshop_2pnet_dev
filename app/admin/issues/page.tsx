'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { IssueRecord, IssueStatus } from '@/lib/modules/issues/types';

type StatusOption = { value: IssueStatus; label: string };

const statusOptions: StatusOption[] = [
  { value: 'new', label: 'Nové' },
  { value: 'in_progress', label: 'V riešení' },
  { value: 'resolved', label: 'Vyriešené' }
];

const statusWeight: Record<IssueStatus, number> = {
  new: 0,
  in_progress: 1,
  resolved: 2
};

const priorityRowClass: Record<number, string> = {
  1: 'bg-slate-50',
  2: 'bg-sky-50/40',
  3: 'bg-amber-50/40',
  4: 'bg-orange-50/40',
  5: 'bg-rose-50/40'
};

const priorityAccent: Record<number, string> = {
  1: 'border-slate-200',
  2: 'border-sky-300',
  3: 'border-amber-300',
  4: 'border-orange-300',
  5: 'border-rose-300'
};

const statusBadgeClass: Record<IssueStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800'
};

interface IssueFormState {
  title: string;
  description: string;
  priority: number;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString('sk-SK')} ${date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function IssuesAdminPage() {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [form, setForm] = useState<IssueFormState>({
    title: '',
    description: '',
    priority: 3
  });

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/issues', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setIssues(data.data as IssueRecord[]);
      } else {
        setError(data.error || 'Nepodarilo sa načítať hlásenia.');
      }
    } catch {
      setError('Nepodarilo sa načítať hlásenia.');
    } finally {
      setLoading(false);
    }
  }

  async function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Názov je povinný.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.success) {
        setIssues((prev) => [data.data as IssueRecord, ...prev]);
        setForm({ title: '', description: '', priority: 3 });
      } else {
        setError(data.error || 'Hlásenie sa nepodarilo vytvoriť.');
      }
    } catch {
      setError('Hlásenie sa nepodarilo vytvoriť.');
    } finally {
      setCreating(false);
    }
  }

  async function updateIssue(id: number, payload: Partial<IssueRecord>) {
    setSavingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: payload.status,
          priority: payload.priority,
          resolutionNote: payload.resolutionNote,
          resolutionLocked: payload.resolutionLocked,
          newReply: payload.resolutionReplies && payload.resolutionReplies.length
            ? payload.resolutionReplies[payload.resolutionReplies.length - 1].text
            : undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        setIssues((prev) => prev.map((item) => (item.id === id ? (data.data as IssueRecord) : item)));
      } else {
        setError(data.error || 'Úprava sa nepodarila.');
      }
    } catch {
      setError('Úprava sa nepodarila.');
    } finally {
      setSavingId(null);
    }
  }

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const statusDiff = statusWeight[a.status] - statusWeight[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [issues]);

  const now = Date.now();
  const formatCountdown = (resolvedAt?: string | null) => {
    if (!resolvedAt) return null;
    const expires = new Date(resolvedAt).getTime() + 24 * 60 * 60 * 1000;
    const diff = expires - now;
    if (diff <= 0) return 'Na odstránenie';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff - hours * 3600000) / 60000);
    return `Zmazanie za ${hours}h ${minutes}m`;
  };

  return (
    <AdminLayout activePanel="admin-issues">
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Prevádzka</p>
          <h1 className="text-3xl font-semibold text-slate-900">Hlásenia chýb</h1>
          <p className="text-sm text-slate-500">
            Excel štýl tabuľky s prioritami 1–5. Statusy „Nové“, „V riešení“, „Vyriešené“ a farebné rozlíšenie riadkov.
          </p>
        </header>

        <form onSubmit={createIssue} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Názov</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              placeholder="Čo sa pokazilo?"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Popis</label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              placeholder="Stručný popis, kroky na reprodukciu…"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Priorita</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  Priorita {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {creating ? 'Ukladám…' : 'Pridať hlásenie'}
            </button>
          </div>
        </form>

        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`issue-skel-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedIssues.map((issue) => {
                const rowTint = issue.status === 'resolved' ? 'bg-emerald-50/80' : priorityRowClass[issue.priority] || 'bg-slate-50';
                const accent = priorityAccent[issue.priority] || 'border-slate-200';
                return (
                  <div
                    key={issue.id}
                    className={`relative overflow-hidden rounded-2xl border ${accent} bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg`}
                  >
                    <div className={`absolute inset-0 pointer-events-none ${rowTint}`} />
                    <div className="relative p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-inner">#{issue.id}</span>
                          <span className={`rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm ${priorityAccent[issue.priority]}`}>
                            Priorita {issue.priority}
                          </span>
                          <select
                            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={issue.status}
                            disabled={savingId === issue.id || issue.resolutionLocked}
                            onChange={(e) => updateIssue(issue.id, { status: e.target.value as IssueStatus })}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            checked={issue.status === 'resolved'}
                            disabled={savingId === issue.id || issue.resolutionLocked}
                            onChange={(e) => updateIssue(issue.id, { status: e.target.checked ? 'resolved' : 'in_progress' })}
                          />
                          Vyriešené
                        </label>
                      </div>

                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-slate-900">{issue.title}</p>
                        {issue.description && <p className="text-sm leading-relaxed text-slate-700">{issue.description}</p>}
                      </div>

                      <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-inner">
                          <div className="font-semibold text-slate-900">Vytvoril</div>
                          <div>{issue.createdBy}</div>
                          <div className="text-[11px] text-slate-500">Vytvorené: {formatDate(issue.createdAt)}</div>
                        </div>
                      <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-inner">
                        <div className="font-semibold text-slate-900">Vyriešil</div>
                        <div>{issue.resolvedBy || '—'}</div>
                        <div className="text-[11px] text-slate-500">Upravené: {formatDate(issue.updatedAt)}</div>
                        <div className="text-[11px] text-slate-500">Dátum: {formatDate(issue.resolvedAt)}</div>
                          {issue.resolvedAt && (
                            <div className="mt-1 text-[11px] font-semibold text-rose-600">
                              {formatCountdown(issue.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-inner space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">Komentár po oprave</p>
                          {savingId === issue.id && <span className="text-xs text-slate-500">Ukladám…</span>}
                        </div>
                        <textarea
                          className={`mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none ${
                            issue.resolutionLocked
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                              : 'bg-white focus:border-slate-900'
                          }`}
                          rows={2}
                          placeholder="Popis opravy / poznámka"
                          defaultValue={issue.resolutionNote || ''}
                          disabled={issue.resolutionLocked}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== (issue.resolutionNote || '')) {
                              updateIssue(issue.id, { resolutionNote: val, resolutionLocked: true });
                            }
                          }}
                        />
                        {issue.resolutionNote && (
                          <p className="text-xs text-emerald-700">Komentár je uzamknutý. Reagovať môžete nižšie.</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">Reakcie</p>
                          </div>
                          <div className="space-y-1">
                            {(issue.resolutionReplies || []).map((reply, idx) => (
                              <div key={idx} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                                <div className="flex justify-between text-slate-700">
                                  <span className="font-semibold">{reply.author}</span>
                                  <span className="text-[11px] text-slate-500">{formatDate(reply.at)}</span>
                                </div>
                                <p className="mt-1 text-slate-700">{reply.text}</p>
                              </div>
                            ))}
                            {(issue.resolutionReplies || []).length === 0 && (
                              <p className="text-xs text-slate-500">Zatiaľ bez reakcií.</p>
                            )}
                          </div>
                          <textarea
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            rows={2}
                            placeholder="Pridať reakciu"
                            disabled={savingId === issue.id}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const val = (e.target as HTMLTextAreaElement).value.trim();
                                if (val) {
                                  updateIssue(issue.id, {
                                    resolutionReplies: [
                                      ...(issue.resolutionReplies || []),
                                      { author: 'admin', text: val, at: new Date().toISOString() }
                                    ]
                                  });
                                  (e.target as HTMLTextAreaElement).value = '';
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val) {
                                updateIssue(issue.id, {
                                  resolutionReplies: [
                                    ...(issue.resolutionReplies || []),
                                    { author: 'admin', text: val, at: new Date().toISOString() }
                                  ]
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
