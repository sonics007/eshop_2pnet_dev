'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { authenticator } from 'otplib';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { defaultSiteSettings, type SiteSettings } from '@/lib/siteSettingsShared';
import { defaultAdminMenu, type AdminMenuItem } from '@/lib/adminMenuDefaults';
import { defaultChatSettings, type ChatSettings } from '@/lib/chatSettingsShared';
import type { AdminOrder, InvoiceRecord } from '@/types/orders';
import { sampleOrders, sampleInvoices } from '@/lib/sampleData';

type Panel = 'visual' | 'links' | 'menu' | 'chat' | 'customers' | 'admins' | 'logs';
type Customer = { id: number; companyName: string; contactName: string; email: string; status: string };
type AdminUser = { id: number; name: string; email: string; password: string; role: string };

const adminSeed: AdminUser[] = [
  { id: 1, name: '2Pnet Admin', email: 'admin@2pnet.cz', password: 'admin', role: 'Root' },
  { id: 2, name: 'NOC tím', email: 'noc@2pnet.cz', password: 'noc', role: 'Support' }
];

const customerSeed: Customer[] = [
  { id: 1, companyName: 'TechServis s.r.o.', contactName: 'Jana Kováčová', email: 'objednavky@techservis.cz', status: 'aktívny' },
  { id: 2, companyName: 'Nordic Retail a.s.', contactName: 'Petr Zelený', email: 'it@nordicretail.cz', status: 'overenie' }
];

const auditSeed = [
  { id: '1', action: 'Prihlásenie', admin: '2Pnet Admin', timestamp: '2025-11-18 08:12', details: 'admin@2pnet.cz' },
  { id: '2', action: 'Zmena vizuálu', admin: 'NOC tím', timestamp: '2025-11-18 09:44', details: 'Aktualizované hero pozadie' }
];

function MenuTree({ items, onLabel, onAdd, onRemove }: { items: AdminMenuItem[]; onLabel: (id: string, value: string) => void; onAdd: (parent: string) => void; onRemove: (id: string) => void }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <input value={item.label} onChange={(e) => onLabel(item.id, e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none" />
            <button className="rounded-full border border-slate-200 px-3 py-1 text-xs" onClick={() => onAdd(item.id)}>+ Podmenu</button>
            <button className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600" onClick={() => onRemove(item.id)}>X</button>
          </div>
          {item.children?.length ? <div className="ml-4 mt-2"><MenuTree items={item.children} onLabel={onLabel} onAdd={onAdd} onRemove={onRemove} /></div> : null}
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setAuthenticated] = useState(false);

  const [panel, setPanel] = useState<Panel>('visual');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [menuTree, setMenuTree] = useState<AdminMenuItem[]>(defaultAdminMenu);
  const [chatSettings, setChatSettings] = useState<ChatSettings>(defaultChatSettings);
  const [customers, setCustomers] = useState<Customer[]>(customerSeed);
  const [admins, setAdmins] = useState<AdminUser[]>(adminSeed);
  const [auditLog, setAuditLog] = useState(auditSeed);
  const [orders, setOrders] = useState<AdminOrder[]>(sampleOrders);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(sampleInvoices);
  const [info, setInfo] = useState('');

  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [accountsMenuOpen, setAccountsMenuOpen] = useState(false);
  const siteMenuRef = useRef<HTMLDivElement | null>(null);
  const accountsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeAll(e: MouseEvent) {
      const n = e.target as Node;
      if (siteMenuOpen && siteMenuRef.current && !siteMenuRef.current.contains(n)) setSiteMenuOpen(false);
      if (accountsMenuOpen && accountsMenuRef.current && !accountsMenuRef.current.contains(n)) setAccountsMenuOpen(false);
    }
    document.addEventListener('mousedown', closeAll);
    return () => document.removeEventListener('mousedown', closeAll);
  }, [siteMenuOpen, accountsMenuOpen]);

  const handleLogin = () => {
    const n = username.trim().toLowerCase();
    const admin = adminSeed.find((a) => a.email.toLowerCase() === n || a.name.toLowerCase() === n || a.email.split('@')[0].toLowerCase() === n);
    if (!admin || admin.password !== password.trim()) {
      setError('Nesprávne prihlasovacie údaje.');
      return;
    }
    if (otp && !authenticator.check(otp, 'SUPERSECRET2P')) {
      setError('OTP kód je nesprávny.');
      return;
    }
    setAuthenticated(true);
    setError('');
  };

  const handleChatField = (field: keyof ChatSettings, value: string) => setChatSettings((prev) => ({ ...prev, [field]: value }));

  const updateMenuLabel = (id: string, value: string) => {
    const walk = (items: AdminMenuItem[]): AdminMenuItem[] =>
      items.map((item) => (item.id === id ? { ...item, label: value } : { ...item, children: item.children ? walk(item.children) : item.children }));
    setMenuTree((prev) => walk(prev));
  };

  const addChild = (id: string) => {
    const walk = (items: AdminMenuItem[]): AdminMenuItem[] =>
      items.map((item) => {
        if (item.id === id) {
          const children = item.children ?? [];
          return { ...item, children: [...children, { id: crypto.randomUUID(), label: 'Nová položka' }] };
        }
        return { ...item, children: item.children ? walk(item.children) : item.children };
      });
    setMenuTree((prev) => walk(prev));
  };

  const removeMenuItem = (id: string) => {
    const walk = (items: AdminMenuItem[]): AdminMenuItem[] =>
      items.filter((i) => i.id !== id).map((i) => ({ ...i, children: i.children ? walk(i.children) : i.children }));
    setMenuTree((prev) => walk(prev));
  };

  const addCustomer = () => setCustomers((prev) => [{ id: Date.now(), companyName: 'Nová firma', contactName: 'Kontakt', email: 'mail@firma.sk', status: 'overenie' }, ...prev]);
  const updateCustomer = (id: number, field: keyof Customer, value: string) => setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const deleteCustomer = (id: number) => setCustomers((prev) => prev.filter((c) => c.id !== id));

  const addAdmin = () => setAdmins((prev) => [{ id: Date.now(), name: 'Nový admin', email: 'admin@firma.sk', password: 'heslo123', role: 'Editor' }, ...prev]);
  const updateAdmin = (id: number, field: keyof AdminUser, value: string) => setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  const deleteAdmin = (id: number) => setAdmins((prev) => prev.filter((a) => a.id !== id));

  const renderPanel = () => {
    switch (panel) {
      case 'visual':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Vizuál & pozadie</h2>
            <textarea
              value={siteSettings.hero.backgroundImage}
              onChange={(e) => setSiteSettings((prev) => ({ ...prev, hero: { ...prev.hero, backgroundImage: e.target.value } }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              rows={3}
            />
            <button onClick={() => setInfo('Vizuál uložený (demo)')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Uložiť
            </button>
            {info && <p className="text-xs text-emerald-600">{info}</p>}
          </section>
        );
      case 'links':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Linky & odkazy</h2>
            <input
              value={siteSettings.links.logoPrimaryLink}
              onChange={(e) => setSiteSettings((prev) => ({ ...prev, links: { ...prev.links, logoPrimaryLink: e.target.value } }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            />
            <button onClick={() => setInfo('Odkazy uložené (demo)')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Uložiť
            </button>
          </section>
        );
      case 'menu':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Menu & podmenu</h2>
            <MenuTree items={menuTree} onLabel={updateMenuLabel} onAdd={addChild} onRemove={removeMenuItem} />
            <button onClick={saveMenu} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Uložiť menu
            </button>
          </section>
        );
      case 'chat':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900">Live chat & kanály</h2>
            <div className="flex flex-wrap gap-2">
              {['telegram', 'whatsapp', 'messenger', 'imessage'].map((c) => (
                <button
                  key={c}
                  onClick={() => setChatSettings((prev) => ({ ...prev, channelType: c as ChatSettings['channelType'] }))}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${chatSettings.channelType === c ? 'bg-slate-900 text-white' : 'border border-slate-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              value={chatSettings.adminEmail}
              onChange={(e) => handleChatField('adminEmail', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="E-mail administrátora"
            />
            <button onClick={() => setInfo('Chat uložený (demo)')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Uložiť chat
            </button>
          </section>
        );
      case 'customers':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Zákazníci</h2>
              <button onClick={addCustomer} className="rounded-full border border-slate-200 px-3 py-1 text-sm">+ Nový</button>
            </div>
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <input value={c.companyName} onChange={(e) => updateCustomer(c.id, 'companyName', e.target.value)} className="rounded border px-3 py-2 text-sm" />
                  <input value={c.contactName} onChange={(e) => updateCustomer(c.id, 'contactName', e.target.value)} className="rounded border px-3 py-2 text-sm" />
                  <input value={c.email} onChange={(e) => updateCustomer(c.id, 'email', e.target.value)} className="rounded border px-3 py-2 text-sm" />
                  <select value={c.status} onChange={(e) => updateCustomer(c.id, 'status', e.target.value)} className="rounded border px-3 py-2 text-sm">
                    <option>aktívny</option>
                    <option>overenie</option>
                    <option>pozastavený</option>
                  </select>
                </div>
                <div className="mt-2 flex justify-end">
                  <button onClick={() => deleteCustomer(c.id)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600">Vymazať</button>
                </div>
              </div>
            ))}
          </section>
        );
      case 'admins':
        return (
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Administrátori</h2>
              <button onClick={addAdmin} className="rounded-full border border-slate-200 px-3 py-1 text-sm">+ Nový</button>
            </div>
            {admins.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 p-3">
                <input value={a.name} onChange={(e) => updateAdmin(a.id, 'name', e.target.value)} className="w-40 rounded border px-3 py-2 text-sm" />
                <input value={a.email} onChange={(e) => updateAdmin(a.id, 'email', e.target.value)} className="w-52 rounded border px-3 py-2 text-sm" />
                <input value={a.password} onChange={(e) => updateAdmin(a.id, 'password', e.target.value)} className="w-32 rounded border px-3 py-2 text-sm" />
                <select value={a.role} onChange={(e) => updateAdmin(a.id, 'role', e.target.value)} className="rounded border px-3 py-2 text-sm">
                  <option>Root</option>
                  <option>Support</option>
                  <option>Editor</option>
                </select>
                <button onClick={() => deleteAdmin(a.id)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600">Vymazať</button>
              </div>
            ))}
          </section>
        );
      case 'logs':
        return (
          <section className="space-y-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Logovanie</h2>
              <button onClick={() => setAuditLog([])} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Vyčistiť</button>
            </div>
            {auditLog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{entry.action} <span className="font-normal text-slate-500">{entry.timestamp}</span></p>
                <p>{entry.details}</p>
                <p className="text-xs text-slate-500">{entry.admin}</p>
              </div>
            ))}
          </section>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-semibold text-slate-900">Admin panel</h1>
          <p className="mt-2 text-sm text-slate-500">Prihláste sa pomocou uložených admin účtov.</p>
          <form className="mt-10 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card" onSubmit={(e) => e.preventDefault()}>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none" placeholder="admin@2pnet.cz" />
            <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none" placeholder="heslo" />
            <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none" placeholder="2FA (voliteľné)" />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="button" onClick={handleLogin} className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white">Prihlásiť sa</button>
          </form>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="text-4xl font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-2 text-sm text-slate-500">Administrácia obsahu, komunikácie a zákazníkov.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <div className="relative" ref={siteMenuRef}>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${panel === 'visual' || panel === 'links' || panel === 'menu' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`}
              onClick={() => { setSiteMenuOpen((p) => !p); setAccountsMenuOpen(false); }}
            >
              Administrácia stránky
            </button>
            {siteMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                <button className={`block w-full rounded-xl px-3 py-2 text-left ${panel === 'visual' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`} onClick={() => { setPanel('visual'); setSiteMenuOpen(false); }}>
                  Vizuál & pozadie
                </button>
                <button className={`mt-1 block w-full rounded-xl px-3 py-2 text-left ${panel === 'links' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`} onClick={() => { setPanel('links'); setSiteMenuOpen(false); }}>
                  Linky & odkazy
                </button>
                <button className={`mt-1 block w-full rounded-xl px-3 py-2 text-left ${panel === 'menu' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`} onClick={() => { setPanel('menu'); setSiteMenuOpen(false); }}>
                  Menu & podmenu
                </button>
              </div>
            )}
          </div>
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${panel === 'chat' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`} onClick={() => { setPanel('chat'); setSiteMenuOpen(false); setAccountsMenuOpen(false); }}>
            Live chat & kanály
          </button>
          <div className="relative" ref={accountsMenuRef}>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${panel === 'customers' || panel === 'admins' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`}
              onClick={() => { setAccountsMenuOpen((p) => !p); setSiteMenuOpen(false); }}
            >
              Správa používateľov
            </button>
            {accountsMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                <button className={`block w-full rounded-xl px-3 py-2 text-left ${panel === 'customers' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`} onClick={() => { setPanel('customers'); setAccountsMenuOpen(false); }}>
                  Zákazníci
                </button>
                <button className={`mt-1 block w-full rounded-xl px-3 py-2 text-left ${panel === 'admins' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`} onClick={() => { setPanel('admins'); setAccountsMenuOpen(false); }}>
                  Administrátori
                </button>
              </div>
            )}
          </div>
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${panel === 'logs' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`} onClick={() => { setPanel('logs'); setSiteMenuOpen(false); setAccountsMenuOpen(false); }}>
            Logovanie
          </button>
        </div>
        <div className="mt-8 space-y-8">
          {renderPanel()}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Objednávky a faktúry</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Objednávky</p>
                <p className="text-3xl font-semibold text-slate-900">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Faktúry</p>
                <p className="text-3xl font-semibold text-slate-900">{invoices.length}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
