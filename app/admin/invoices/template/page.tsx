'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import type { InvoiceTemplate } from '@/lib/invoiceTemplate';

const emptyTemplate: InvoiceTemplate = {
  supplier: {
    name: '',
    address: '',
    ico: '',
    dic: '',
    vatId: '',
    bankAccount: '',
    iban: '',
    swift: ''
  },
  defaults: {
    currency: 'CZK',
    vatRate: 0.21,
    dueDays: 14,
    supplyDaysOffset: 0
  },
  phrases: {
    footerNote: '',
    legalNote: '',
    paymentInstructions: ''
  }
};

export default function InvoiceTemplateEditor() {
  const [template, setTemplate] = useState<InvoiceTemplate>(emptyTemplate);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/invoices/template');
        if (!response.ok) throw new Error('load failed');
        const data = (await response.json()) as InvoiceTemplate;
        setTemplate(data);
      } catch (error) {
        console.error('Nepodarilo sa načítať šablónu', error);
        setMessage('Nepodarilo sa načítať šablónu, zobrazená je predvolená hodnota.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateTemplate = <Key extends keyof InvoiceTemplate>(section: Key, value: InvoiceTemplate[Key]) => {
    setTemplate((prev) => ({ ...prev, [section]: value }));
  };

  const handleSupplierChange = (field: keyof InvoiceTemplate['supplier'], value: string) => {
    updateTemplate('supplier', { ...template.supplier, [field]: value });
  };

  const handleDefaultsChange = (field: keyof InvoiceTemplate['defaults'], value: number | string) => {
    const parsedValue = typeof template.defaults[field] === 'number' ? Number(value) : value;
    updateTemplate('defaults', { ...template.defaults, [field]: parsedValue as never });
  };

  const handlePhraseChange = (field: keyof InvoiceTemplate['phrases'], value: string) => {
    updateTemplate('phrases', { ...template.phrases, [field]: value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/invoices/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('save failed');
      setMessage('Šablóna bola uložená. Nové faktúry budú používať tieto údaje.');
    } catch (error) {
      console.error(error);
      setMessage('Uloženie zlyhalo, skontrolujte povinné údaje.');
    }
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Backoffice</p>
            <h1 className="text-4xl font-semibold text-slate-900">Mustr fakturace (CZ)</h1>
            <p className="mt-2 text-sm text-slate-500">
              Vyplňte statutární údaje dodavatele, platební instrukce a texty povinné dle české legislativy.
            </p>
          </div>
          <Link href="/admin/invoices" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
            ← Zpět na faktury
          </Link>
        </div>

{loading ? (
          <p className="mt-8 text-sm text-slate-500">Načítavam...</p>
        ) : (
          <form className="mt-8 space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Údaje dodavatele</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Obchodní název
                  <input
                    value={template.supplier.name}
                    onChange={(event) => handleSupplierChange('name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  IČO
                  <input
                    value={template.supplier.ico}
                    onChange={(event) => handleSupplierChange('ico', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  DIČ
                  <input
                    value={template.supplier.dic}
                    onChange={(event) => handleSupplierChange('dic', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  IČ DPH
                  <input
                    value={template.supplier.vatId ?? ''}
                    onChange={(event) => handleSupplierChange('vatId', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Sídlo
                <input
                  value={template.supplier.address}
                  onChange={(event) => handleSupplierChange('address', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Bankovní účet (číslo účtu)
                  <input
                    value={template.supplier.bankAccount}
                    onChange={(event) => handleSupplierChange('bankAccount', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  IBAN
                  <input
                    value={template.supplier.iban}
                    onChange={(event) => handleSupplierChange('iban', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  SWIFT / BIC
                  <input
                    value={template.supplier.swift}
                    onChange={(event) => handleSupplierChange('swift', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Výchozí nastavení faktur</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Měna
                  <input
                    value={template.defaults.currency}
                    onChange={(event) => handleDefaultsChange('currency', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  DPH (%)
                  <input
                    type="number"
                    step="0.01"
                    value={template.defaults.vatRate}
                    onChange={(event) => handleDefaultsChange('vatRate', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Splatnost (dny)
                  <input
                    type="number"
                    value={template.defaults.dueDays}
                    onChange={(event) => handleDefaultsChange('dueDays', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Datum zdanitelného plnění (posun)
                  <input
                    type="number"
                    value={template.defaults.supplyDaysOffset}
                    onChange={(event) => handleDefaultsChange('supplyDaysOffset', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Texty na faktuře</h2>
              <label className="text-sm font-semibold text-slate-700">
                Platební instrukce (CZ)
                <textarea
                  rows={3}
                  value={template.phrases.paymentInstructions}
                  onChange={(event) => handlePhraseChange('paymentInstructions', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Právní doložka
                <textarea
                  rows={2}
                  value={template.phrases.legalNote}
                  onChange={(event) => handlePhraseChange('legalNote', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Poznámka v patičce
                <textarea
                  rows={2}
                  value={template.phrases.footerNote}
                  onChange={(event) => handlePhraseChange('footerNote', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Náhľad faktúry</h2>
              <p className="mt-2 text-xs text-slate-500">
                Ukážkový náhľad využíva aktuálne vyplnené údaje a vzorové položky.
              </p>
              <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dodavatel</p>
                    <p className="text-base font-semibold text-slate-900">{template.supplier.name}</p>
                    <p>{template.supplier.address}</p>
                    <p>IČO {template.supplier.ico}</p>
                    <p>DIČ {template.supplier.dic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Faktura</p>
                    <p className="text-base font-semibold text-slate-900">FA-2025-00001</p>
                    <p>Variabilní symbol: 202500001</p>
                    <p>Splatnost: +{template.defaults.dueDays} dní</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Platební instrukce</p>
                  <p className="text-sm text-slate-600">{template.phrases.paymentInstructions}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Bankovní účet: {template.supplier.bankAccount} (IBAN {template.supplier.iban})
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Položky</p>
                  <ul className="mt-2 text-sm text-slate-600">
                    <li>• 2PN FortiEdge X5 × 1 — 45 000 {template.defaults.currency}</li>
                    <li>• Instalace a SLA × 1 — 12 000 {template.defaults.currency}</li>
                  </ul>
                  <p className="mt-3 text-right text-sm font-semibold text-slate-900">
                    Celkem: 57 000 {template.defaults.currency} + DPH {template.defaults.vatRate * 100} %
                  </p>
                </div>
                <p className="mt-4 text-xs text-slate-500">{template.phrases.legalNote}</p>
                <p className="text-xs text-slate-500">{template.phrases.footerNote}</p>
              </div>
            </section>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-slate-900"
          >
            Uložit mustr
          </button>
        </div>
        {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
      </main>
      <Footer />
    </div>
  );
}
