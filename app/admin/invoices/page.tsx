'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import type { InvoiceRecord } from '@/types/orders';

export default function InvoiceAdminPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [message, setMessage] = useState('');
  const [flexibeeReady, setFlexibeeReady] = useState(false);

  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((payload) => setInvoices(payload.data ?? []))
      .catch((error) => {
        console.error(error);
        setMessage('Nepodarilo sa načítať faktúry, zobrazujem fallback údaje.');
      });
    fetch('/api/flexibee/status')
      .then((res) => res.json())
      .then((payload) => setFlexibeeReady(Boolean(payload?.configured)))
      .catch(() => setFlexibeeReady(false));
  }, []);

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Backoffice</p>
            <h1 className="text-4xl font-semibold text-slate-900">Faktúry</h1>
            <p className="mt-2 text-sm text-slate-500">
              Zoznam všetkých vystavených faktúr v Excel štýle. Kliknutím na riadok si môžete údaje exportovať alebo
              otvoriť v šablóne.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/invoices/template" className="rounded-full border border-slate-200 px-4 py-2 text-sm">
              Upraviť šablónu
            </Link>
            <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
              ← Späť do admin panelu
            </Link>
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-amber-600">{message}</p>}

        <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-card">
          <table className="min-w-full whitespace-nowrap text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Faktúra</th>
                <th className="px-4 py-3">Variabilný symbol</th>
                <th className="px-4 py-3">Zákazník</th>
                <th className="px-4 py-3">Vystavená</th>
                <th className="px-4 py-3">Splatnosť</th>
                <th className="px-4 py-3 text-right">Suma</th>
                <th className="px-4 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{invoice.variableSymbol}</td>
                  <td className="px-4 py-3">{invoice.customer}</td>
                  <td className="px-4 py-3 text-slate-500">{invoice.issueDate}</td>
                  <td className="px-4 py-3 text-slate-500">{invoice.dueDate}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {invoice.total.toLocaleString('sk-SK', { style: 'currency', currency: invoice.currency })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        className="text-sm text-brand-accent underline"
                        onClick={() => window.open(`/api/invoices/${invoice.invoiceNumber}/document`, '_blank')}
                      >
                        ISDOC export
                      </button>
                      <button
                        className={`text-sm underline ${flexibeeReady ? 'text-slate-600' : 'text-slate-400 cursor-not-allowed'}`}
                        disabled={!flexibeeReady}
                        onClick={async () => {
                          if (!flexibeeReady) {
                            setMessage('ABRA Flexi nie je nakonfigurované. Otvorte Nastavenie ABRA Flexi.');
                            return;
                          }
                          try {
                            setMessage(`Odosielam faktúru ${invoice.invoiceNumber} do ABRA Flexi...`);
                            const response = await fetch('/api/flexibee/invoices', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ invoiceNumber: invoice.invoiceNumber })
                            });
                            const payload = await response.json();
                            if (!response.ok || !payload.success) {
                              throw new Error(payload.message || 'Neznáma chyba.');
                            }
                            setMessage(`Faktúra ${invoice.invoiceNumber} bola odoslaná do ABRA Flexi.`);
                          } catch (error) {
                            console.error(error);
                            setMessage(
                              error instanceof Error
                                ? error.message
                                : `Odoslanie faktúry ${invoice.invoiceNumber} zlyhalo.`
                            );
                          }
                        }}
                      >
                        Odoslať do ABRA Flexi
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    Zatiaľ neexistujú žiadne faktúry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
