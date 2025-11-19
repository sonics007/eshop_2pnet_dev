'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { sampleOrders } from '@/lib/sampleData';
import type { AdminOrder, OrderStatus } from '@/types/orders';

const abandonedCarts = [
  { company: 'SmartBuild s.r.o.', items: 4, value: 2100, lastActive: 'pred 3 hodinami' },
  { company: 'DataWave a.s.', items: 2, value: 3890, lastActive: 'pred 1 dňom' }
];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((payload) => {
        setOrders(payload.data ?? []);
        setSelectedOrderId(payload.data?.[0]?.id ?? null);
      })
      .catch((error) => {
        console.error(error);
        setOrders(sampleOrders);
        setSelectedOrderId(sampleOrders[0]?.id ?? null);
        setMessage('Nepodarilo sa načítať dáta z DB, zobrazené sú ukážkové objednávky.');
      });
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const updateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: noteDraft })
      });

      if (!response.ok) {
        throw new Error('status update failed');
      }
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                status,
                history: [
                  ...order.history,
                  { status, timestamp: new Date().toISOString(), note: noteDraft || undefined }
                ]
              }
            : order
        )
      );
      setNoteDraft('');
      setMessage(`Stav objednávky ${selectedOrder.id} bol zmenený na "${status}".`);
    } catch (error) {
      console.error(error);
      setMessage('Nepodarilo sa aktualizovať stav (DB/offline režim).');
    }
  };

  const generateInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, order: selectedOrder })
      });
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.message);
      }
      setMessage(`Faktúra ${payload.invoice.invoiceNumber ?? ''} bola vytvorená.`);
    } catch (error) {
      console.error(error);
      setMessage('Faktúru sa nepodarilo uložiť do DB, ale údaje máte dostupné v logu.');
    }
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Backoffice</p>
            <h1 className="text-4xl font-semibold text-slate-900">Správa objednávok</h1>
            <p className="mt-2 text-sm text-slate-500">
              Sledujte objednávky, ich stav a odošlite zákazníkovi notifikáciu pri každej zmene.
            </p>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
            ← Späť do admin panelu
          </Link>
        </div>

        {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr,2.7fr]">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Objednávky</h2>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                    selectedOrderId === order.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-900'
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-xs">
                    {order.customer} · {order.status}
                  </p>
                  <p className="text-xs text-emerald-200">
                    {new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(
                      order.total
                    )}
                  </p>
                </button>
              ))}
              {!orders.length && <p className="text-xs text-slate-500">Žiadne objednávky.</p>}
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              <p className="font-semibold">Opustené košíky</p>
              <ul className="mt-3 space-y-2">
                {abandonedCarts.map((cart) => (
                  <li key={cart.company} className="rounded-xl border border-amber-100 bg-white px-3 py-2">
                    <p className="font-semibold text-slate-900">{cart.company}</p>
                    <p className="text-xs text-slate-500">
                      {cart.items} položky · {cart.value} € · {cart.lastActive}
                    </p>
                    <button className="text-xs text-amber-600 underline">Poslať pripomienku</button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            {selectedOrder ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Objednávka</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{selectedOrder.id}</h2>
                    <p className="text-sm text-slate-500">
                      {selectedOrder.customer} · {selectedOrder.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Aktuálny stav</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(event) => updateStatus(event.target.value as OrderStatus)}
                      className="mt-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      {['Prijatá', 'Spracovanie', 'Expedovaná', 'Dokončená', 'Stornovaná'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 text-sm">
                  <p className="font-semibold text-slate-900">Položky</p>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    {selectedOrder.items.map((item) => (
                      <li key={item.name} className="flex justify-between text-xs md:text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>
                          {new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(
                            item.price * item.quantity
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold">
                    <span>Celková suma</span>
                    <span>
                      {new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(
                        selectedOrder.total
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Platba: {selectedOrder.paymentMethod}</p>
                  <p className="text-xs text-slate-500">Faktúra: {selectedOrder.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">Zodpovedný: {selectedOrder.assignedTo}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 text-sm">
                  <p className="font-semibold text-slate-900">História stavu</p>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    {selectedOrder.history.map((entry, index) => (
                      <li key={`${entry.status}-${index}`} className="rounded-xl border border-slate-200 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-500">{entry.timestamp}</p>
                        <p className="text-sm">{entry.status}</p>
                        {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
                      </li>
                    ))}
                  </ul>
                  <textarea
                    rows={3}
                    placeholder="Poznámka pre ďalší krok (napr. číslo zásielky, SLA informácia)"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-slate-900"
                    onClick={() => selectedOrder && updateStatus(selectedOrder.status)}
                  >
                    Uložiť stav + email
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
                    onClick={generateInvoice}
                  >
                    Generovať faktúru
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Vyberte objednávku zo zoznamu vľavo.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
