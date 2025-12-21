"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { defaultEmailSettings, type EmailSettings } from "@/lib/modules/email/types";

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>(defaultEmailSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/email/settings");
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        } else {
          setMessage(data.error || "Nepodarilo sa načítať nastavenia.");
        }
      } catch {
        setMessage("Nepodarilo sa načítať nastavenia.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicBaseUrl: settings.publicBaseUrl })
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setMessage("Uložené.");
      } else {
        setMessage(data.error || "Ukladanie zlyhalo.");
      }
    } catch {
      setMessage("Ukladanie zlyhalo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout activePanel="settings-site">
      <div className="max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Stránka</p>
          <h1 className="text-3xl font-semibold text-slate-900">Verejná adresa e-shopu</h1>
          <p className="text-sm text-slate-500">
            Hodnota pre NEXT_PUBLIC_SITE_URL – hlavná verejná adresa celého e‑shop ekosystému (front‑end, odkazy v emailoch,
            reset hesla, pozvánky adminov).
          </p>
        </header>

        {message && <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p>}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          {loading ? (
            <p className="text-sm text-slate-500">Načítavam…</p>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Verejná adresa (NEXT_PUBLIC_SITE_URL)
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  placeholder="https://dev.krizo.eu"
                  value={settings.publicBaseUrl || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, publicBaseUrl: e.target.value }))}
                />
              </label>
              <p className="text-xs text-slate-500">
                Zadajte plnú URL vrátane https://. Použije sa v šablónach emailov pre klikateľné odkazy.
              </p>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {saving ? "Ukladám…" : "Uložiť"}
              </button>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
