'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useCustomerAuth } from '@/lib/modules/auth/customer/context';
import type { AdminOrder, InvoiceRecord } from '@/types/orders';
import { orderStatusLabels } from '@/types/orders';

const CAPTCHA_TEXT = '8N2P5';

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, login, register, logout, updateProfile } = useCustomerAuth();

  const captchaSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48">
      <rect width="160" height="48" fill="#0b1f3a"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="#2cd5c4">${CAPTCHA_TEXT}</text>
      <line x1="10" y1="10" x2="150" y2="38" stroke="#2cd5c4" stroke-width="2" />
      <line x1="30" y1="40" x2="140" y2="8" stroke="#ffffff" stroke-width="1" />
    </svg>`
  );

  const [loginState, setLoginState] = useState({
    email: '',
    password: '',
    captcha: ''
  });
  const [registerState, setRegisterState] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    ico: '',
    dic: '',
    vatId: '',
    phone: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    captcha: ''
  });
  const [resetState, setResetState] = useState({ email: '', captcha: '' });
  const [messages, setMessages] = useState<{ login?: string; register?: string; reset?: string; profile?: string }>({});
  const [showRegister, setShowRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Editacia profilu
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    companyName: '',
    phone: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    newPassword: ''
  });

  // Synchronizacia profileData s user
  useEffect(() => {
    if (user && !editMode) {
      setProfileData({
        companyName: user.companyName || '',
        phone: user.phone || '',
        street: user.street || '',
        city: user.city || '',
        zip: user.zip || '',
        country: user.country || 'Slovensko',
        newPassword: ''
      });
    }
  }, [user, editMode]);

  // Načítaj objednávky a faktúry pre prihláseného
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    Promise.all([
      fetch('/api/account/orders').then((res) => res.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/account/invoices').then((res) => res.json()).catch(() => ({ success: false, data: [] }))
    ])
      .then(([ordersPayload, invoicesPayload]) => {
        if (ordersPayload.success && Array.isArray(ordersPayload.data)) setOrders(ordersPayload.data);
        if (invoicesPayload.success && Array.isArray(invoicesPayload.data)) setInvoices(invoicesPayload.data);
      })
      .finally(() => setLoadingData(false));
  }, [isAuthenticated, user?.email]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessages({});

    if (!loginState.email || !loginState.password) {
      setMessages({ login: 'Zadajte e-mail aj heslo.' });
      return;
    }
    if (loginState.captcha !== CAPTCHA_TEXT) {
      setMessages({ login: 'Captcha nesedi. Skuste to znova.' });
      return;
    }

    setIsSubmitting(true);
    const result = await login({
      email: loginState.email,
      password: loginState.password
    });
    setIsSubmitting(false);

    if (result.success) {
      setLoginState({ email: '', password: '', captcha: '' });
      setMessages({ login: 'Prihlasenie prebehlo uspesne.' });
    } else {
      setMessages({ login: result.error || 'Prihlasenie zlyhalo.' });
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessages({});

    if (registerState.captcha !== CAPTCHA_TEXT) {
      setMessages({ register: 'Captcha nesedi. Zadajte bezpecnostny kod spravne.' });
      return;
    }
    if (registerState.password !== registerState.confirmPassword) {
      setMessages({ register: 'Hesla sa nezhoduju.' });
      return;
    }
    if (!registerState.email || !registerState.password || !registerState.companyName) {
      setMessages({ register: 'Vyplnte vsetky povinne polia.' });
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email: registerState.email,
      password: registerState.password,
      companyName: registerState.companyName,
      ico: registerState.ico,
      dic: registerState.dic,
      vatId: registerState.vatId || undefined,
      phone: registerState.phone || undefined,
      street: registerState.street || undefined,
      city: registerState.city || undefined,
      zip: registerState.zip || undefined,
      country: registerState.country || undefined
    });
    setIsSubmitting(false);

    if (result.success) {
      setMessages({ register: 'Ucet bol vytvoreny a ste prihlaseny.' });
      setShowRegister(false);
    } else {
      setMessages({ register: result.error || 'Registracia zlyhala.' });
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (resetState.captcha !== CAPTCHA_TEXT) {
      setMessages({ reset: 'Captcha overenie zlyhalo.' });
      return;
    }
    if (!resetState.email) {
      setMessages({ reset: 'Zadajte email.' });
      return;
    }
    try {
      const res = await fetch('/api/auth/customer/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetState.email })
      });
      const data = await res.json();
      if (data.success) {
        setMessages({ reset: data.message || 'Email na obnovu hesla bol odoslaný.' });
      } else {
        setMessages({ reset: data.error || 'Odoslanie zlyhalo.' });
      }
    } catch (error) {
      setMessages({ reset: 'Chyba pripojenia.' });
    }
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessages({});

    setIsSubmitting(true);
    const updateData: Record<string, string | undefined> = {
      companyName: profileData.companyName,
      phone: profileData.phone || undefined,
      street: profileData.street || undefined,
      city: profileData.city || undefined,
      zip: profileData.zip || undefined,
      country: profileData.country || undefined
    };

    if (profileData.newPassword) {
      updateData.password = profileData.newPassword;
    }

    const result = await updateProfile(updateData);
    setIsSubmitting(false);

    if (result.success) {
      setMessages({ profile: 'Profil bol aktualizovany.' });
      setEditMode(false);
      setProfileData(prev => ({ ...prev, newPassword: '' }));
    } else {
      setMessages({ profile: result.error || 'Aktualizacia zlyhala.' });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-slate-500">Nacitavam...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-900">Osobny ucet</h1>

        {isAuthenticated && user && (
          <div className="mt-10 rounded-3xl border border-emerald-200 bg-white p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Prihlaseny pouzivatel</p>

            {!editMode ? (
              <>
                <p className="mt-3 text-xl font-semibold text-slate-900">{user.companyName}</p>
                <p className="text-sm text-slate-500">E-mail: {user.email}</p>
                {user.ico && <p className="text-sm text-slate-500">ICO: {user.ico}</p>}
                {user.dic && <p className="text-sm text-slate-500">DIC: {user.dic}</p>}
                {user.vatId && <p className="text-sm text-slate-500">IC DPH: {user.vatId}</p>}
                {user.phone && <p className="text-sm text-slate-500">Telefon: {user.phone}</p>}
                {(user.street || user.city) && (
                  <p className="text-sm text-slate-500">
                    Adresa: {[user.street, user.zip, user.city, user.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    className="rounded-full border border-slate-900 px-6 py-2 text-sm font-semibold text-slate-900"
                    onClick={() => setEditMode(true)}
                  >
                    Upravit profil
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600"
                    onClick={logout}
                  >
                    Odhlasit sa
                  </button>
                </div>
                {messages.profile && (
                  <p className={`mt-3 text-xs ${messages.profile.includes('zlyhala') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {messages.profile}
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                <input
                  placeholder="Nazov spolocnosti"
                  required
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <input
                  placeholder="Telefon"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <input
                  placeholder="Ulica a cislo"
                  value={profileData.street}
                  onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    placeholder="PSC"
                    value={profileData.zip}
                    onChange={(e) => setProfileData({ ...profileData, zip: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="Mesto"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="Krajina"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <input
                  type="password"
                  placeholder="Nove heslo (nechajte prazdne ak nechcete menit)"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-brand-accent px-6 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Ukladam...' : 'Ulozit zmeny'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600"
                    onClick={() => setEditMode(false)}
                  >
                    Zrusit
                  </button>
                </div>
                {messages.profile && (
                  <p className={`text-xs ${messages.profile.includes('zlyhala') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {messages.profile}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Objednávky</p>
                  <h2 className="text-lg font-semibold text-slate-900">Moje objednávky</h2>
                  <p className="text-sm text-slate-500">Aktuálny stav a prehľad položiek.</p>
                </div>
                {loadingData && <span className="text-xs text-slate-500">Načítavam…</span>}
              </div>
              <div className="mt-4 space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-500">Zatiaľ nemáte žiadne objednávky.</p>
                ) : (
                  orders.map((order) => {
                    const created = order.history?.[0]?.timestamp
                      ? new Date(order.history[0].timestamp).toLocaleString('sk-SK')
                      : '—';
                    const statusLabel = orderStatusLabels[order.status] ?? order.status;
                    const hasInvoice = order.invoiceNumber && order.invoiceNumber !== '—';
                    return (
                      <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Objednávka</p>
                            <p className="text-base font-semibold text-slate-900">{order.id}</p>
                            <p className="text-xs text-slate-500">Vystavená: {created}</p>
                          </div>
                          <div className="text-right">
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                              {statusLabel}
                            </span>
                            <p className="text-sm text-slate-500 mt-1">{order.paymentMethod}</p>
                            <p className="text-sm text-slate-500">{hasInvoice ? 'Fakturované' : 'Čaká na faktúru'}</p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-slate-600">
                          {order.items.map((item) => (
                            <li key={item.name}>
                              {item.name} × {item.quantity} — {item.price} €
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-right text-sm font-semibold text-slate-900">
                          Celkom: {order.total.toLocaleString('sk-SK')} €
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Faktúry</p>
                  <h2 className="text-lg font-semibold text-slate-900">Moje faktúry</h2>
                  <p className="text-sm text-slate-500">Stiahnite si PDF alebo skontrolujte splatnosť.</p>
                </div>
                {loadingData && <span className="text-xs text-slate-500">Načítavam…</span>}
              </div>
              <div className="mt-4 space-y-3">
                {invoices.length === 0 ? (
                  <p className="text-sm text-slate-500">Zatiaľ nemáte žiadne faktúry.</p>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Faktúra</p>
                          <p className="text-base font-semibold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">
                            Vystavená: {inv.issueDate} · Splatnosť: {inv.dueDate}
                          </p>
                          {inv.orderId && <p className="text-xs text-slate-500">Objednávka: {inv.orderId}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-900">
                            {inv.total.toLocaleString('sk-SK')} {inv.currency}
                          </p>
                          <a
                            href={`/api/account/invoices/${inv.invoiceNumber}`}
                            className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            download
                          >
                            Stiahnuť
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-10 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-lg font-semibold text-slate-900">Prihlasenie</p>
              <input
                type="email"
                placeholder="E-mail"
                required
                value={loginState.email}
                onChange={(e) => setLoginState({ ...loginState, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Heslo"
                required
                value={loginState.password}
                onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
              <div>
                <p className="text-xs font-semibold text-slate-500">Captcha bezpecnostny kod</p>
                <div className="mt-2 flex items-center gap-4 rounded-2xl border border-slate-200 p-3">
                  <Image
                    src={`data:image/svg+xml;utf8,${captchaSvg}`}
                    alt="Captcha"
                    width={160}
                    height={48}
                    className="h-10 w-32 rounded-md border border-slate-100 bg-slate-900"
                  />
                  <input
                    placeholder="Zadajte kod"
                    value={loginState.captcha}
                    onChange={(e) => setLoginState({ ...loginState, captcha: e.target.value.toUpperCase() })}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900 disabled:opacity-50"
              >
                {isSubmitting ? 'Prihlasujem...' : 'Prihlasit sa'}
              </button>
              {messages.login && (
                <p className={`text-xs ${messages.login.includes('zlyhalo') || messages.login.includes('nesedi') ? 'text-red-600' : 'text-emerald-600'}`}>
                  {messages.login}
                </p>
              )}
              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex-1 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => {
                    setShowReset((prev) => !prev);
                    setShowRegister(false);
                  }}
                >
                  Obnovit heslo
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full border border-slate-900 px-6 py-2 text-sm font-semibold text-slate-900"
                  onClick={() => {
                    setShowRegister((prev) => !prev);
                    setShowReset(false);
                  }}
                >
                  Registracia
                </button>
              </div>
            </form>

            {showRegister && (
              <form
                onSubmit={handleRegister}
                className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <p className="text-lg font-semibold text-slate-900">Vytvorit B2B ucet</p>
                <input
                  type="email"
                  placeholder="Firemny e-mail *"
                  required
                  value={registerState.email}
                  onChange={(e) => setRegisterState({ ...registerState, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="password"
                    placeholder="Heslo *"
                    required
                    value={registerState.password}
                    onChange={(e) => setRegisterState({ ...registerState, password: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Potvrdit heslo *"
                    required
                    value={registerState.confirmPassword}
                    onChange={(e) => setRegisterState({ ...registerState, confirmPassword: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <input
                  placeholder="Spolocnost *"
                  required
                  value={registerState.companyName}
                  onChange={(e) => setRegisterState({ ...registerState, companyName: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    placeholder="ICO"
                    value={registerState.ico}
                    onChange={(e) => setRegisterState({ ...registerState, ico: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="DIC"
                    value={registerState.dic}
                    onChange={(e) => setRegisterState({ ...registerState, dic: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="IC DPH"
                    value={registerState.vatId}
                    onChange={(e) => setRegisterState({ ...registerState, vatId: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <input
                  placeholder="Telefon"
                  value={registerState.phone}
                  onChange={(e) => setRegisterState({ ...registerState, phone: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <input
                  placeholder="Ulica a cislo"
                  value={registerState.street}
                  onChange={(e) => setRegisterState({ ...registerState, street: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    placeholder="PSC"
                    value={registerState.zip}
                    onChange={(e) => setRegisterState({ ...registerState, zip: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="Mesto"
                    value={registerState.city}
                    onChange={(e) => setRegisterState({ ...registerState, city: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    placeholder="Krajina"
                    value={registerState.country}
                    onChange={(e) => setRegisterState({ ...registerState, country: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Captcha bezpecnostny kod: {CAPTCHA_TEXT}</label>
                  <input
                    placeholder="Zadajte kod"
                    value={registerState.captcha}
                    onChange={(e) => setRegisterState({ ...registerState, captcha: e.target.value.toUpperCase() })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-slate-900 px-6 py-3 text-base font-semibold text-slate-900 disabled:opacity-50"
                >
                  {isSubmitting ? 'Vytvariam ucet...' : 'Vytvorit ucet'}
                </button>
                {messages.register && (
                  <p className={`text-xs ${messages.register.includes('zlyhala') || messages.register.includes('nesedi') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {messages.register}
                  </p>
                )}
              </form>
            )}

            {showReset && (
              <form
                onSubmit={handleReset}
                className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <p className="text-lg font-semibold text-slate-900">Obnovit heslo</p>
                <input
                  type="email"
                  placeholder="Firemny e-mail"
                  required
                  value={resetState.email}
                  onChange={(e) => setResetState({ ...resetState, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                />
                <div>
                  <label className="text-xs font-semibold text-slate-500">Captcha bezpecnostny kod: {CAPTCHA_TEXT}</label>
                  <input
                    placeholder="Zadajte kod"
                    required
                    value={resetState.captcha}
                    onChange={(e) => setResetState({ ...resetState, captcha: e.target.value.toUpperCase() })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white"
                >
                  Odoslat odkaz na obnovu
                </button>
                {messages.reset && <p className="text-xs text-emerald-600">{messages.reset}</p>}
              </form>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
