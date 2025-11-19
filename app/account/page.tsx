'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthContext';

const CAPTCHA_CODE = '2PN24';
const LOGIN_OTP_CODE = '246810';

export default function AccountPage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const CAPTCHA_TEXT = '8N2P5';
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
    captcha: '',
    otp: '',
    require2fa: false
  });
  const [registerState, setRegisterState] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    ico: '',
    dic: '',
    vatId: '',
    captcha: '',
    role: 'user',
    twoFactorEnabled: false
  });
  const [resetState, setResetState] = useState({ email: '', captcha: '' });
  const [messages, setMessages] = useState<{ login?: string; register?: string; reset?: string }>({});
  const [showRegister, setShowRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (showOtpStep) {
      if (loginState.otp !== LOGIN_OTP_CODE) {
        setMessages((prev) => ({ ...prev, login: 'Neplatný 2FA kód.' }));
        return;
      }
      login({
        companyName: 'Prihlásený klient',
        ico: '00000000',
        dic: 'SK0000000000',
        email: loginState.email,
        role: loginState.email.toLowerCase().includes('admin') ? 'admin' : 'user',
        twoFactorEnabled: loginState.require2fa
      });
      setLoginState({ email: '', password: '', captcha: '', otp: '', require2fa: loginState.require2fa });
      setShowOtpStep(false);
      setMessages((prev) => ({ ...prev, login: 'Prihlásenie prebehlo úspešne.' }));
      return;
    }

    if (!loginState.email || !loginState.password) {
      setMessages((prev) => ({ ...prev, login: 'Zadajte e-mail aj heslo.' }));
      return;
    }
    if (loginState.captcha !== CAPTCHA_TEXT) {
      setMessages((prev) => ({ ...prev, login: 'Captcha nesedí. Skúste to znova.' }));
      return;
    }

    if (loginState.require2fa) {
      setShowOtpStep(true);
      setMessages((prev) => ({
        ...prev,
        login: 'Na váš e-mail sme poslali 2FA kód (simulácia). Zadajte ho pre dokončenie prihlásenia.'
      }));
      return;
    }

    login({
      companyName: 'Prihlásený klient',
      ico: '00000000',
      dic: 'SK0000000000',
      email: loginState.email,
      role: loginState.email.toLowerCase().includes('admin') ? 'admin' : 'user',
      twoFactorEnabled: false
    });
    setLoginState({ email: '', password: '', captcha: '', otp: '', require2fa: false });
    setMessages((prev) => ({ ...prev, login: 'Prihlásenie prebehlo úspešne.' }));
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    if (registerState.captcha !== CAPTCHA_CODE) {
      setMessages((prev) => ({ ...prev, register: 'Captcha nesedí. Zadajte bezpečnostný kód správne.' }));
      return;
    }
    if (registerState.password !== registerState.confirmPassword) {
      setMessages((prev) => ({ ...prev, register: 'Heslá sa nezhodujú.' }));
      return;
    }
    login({
      companyName: registerState.companyName,
      ico: registerState.ico,
      dic: registerState.dic,
      vatId: registerState.vatId,
      email: registerState.email,
      role: registerState.role === 'admin' ? 'admin' : 'user',
      twoFactorEnabled: registerState.twoFactorEnabled
    });
    setMessages((prev) => ({ ...prev, register: 'Účet bol vytvorený a ste prihlásený.' }));
  };

  const handleReset = (event: React.FormEvent) => {
    event.preventDefault();
    if (resetState.captcha !== CAPTCHA_CODE) {
      setMessages((prev) => ({ ...prev, reset: 'Captcha overenie zlyhalo.' }));
      return;
    }
    setMessages((prev) => ({
      ...prev,
      reset:
        resetState.email.trim().length > 0
          ? `Odkaz na obnovu hesla sme poslali na ${resetState.email}.`
          : 'Odkaz na obnovu hesla bol odoslaný (simulácia).'
    }));
  };

  const sendInstantReset = () => {
    if (!loginState.email) {
      setMessages((prev) => ({ ...prev, login: 'Najprv zadajte e-mail pre prihlásenie.' }));
      return;
    }
    setMessages((prev) => ({
      ...prev,
      login:
        'Simulácia: na zadaný e-mail sme poslali okamžitý link na obnovu hesla. Pri ostrej prevádzke sa odošle reálna správa.'
    }));
    setShowReset(true);
    setResetState((prev) => ({ ...prev, email: loginState.email }));
  };

  return (
    <div className="bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-900">Osobný účet</h1>
        <p className="mt-2 text-xs text-amber-600">Demo režim – údaje sa zatiaľ ukladajú len lokálne v prehliadači (simulácia prihlásenia).</p>

        {isAuthenticated && user && (
          <div className="mt-10 rounded-3xl border border-emerald-200 bg-white p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Prihlásený používateľ</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{user.companyName}</p>
            <p className="text-sm text-slate-500">IČO {user.ico} · DIČ {user.dic}</p>
            {user.vatId && <p className="text-sm text-slate-500">IČ DPH {user.vatId}</p>}
            <p className="text-sm text-slate-500">E-mail {user.email}</p>
            <p className="text-sm text-slate-500">
              Rola: {user.role === 'admin' ? 'Administrátor' : 'Bežný používateľ'} · 2FA{' '}
              {user.twoFactorEnabled ? 'zapnuté' : 'vypnuté'}
            </p>
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                className="rounded-full border border-slate-900 px-6 py-2 text-sm font-semibold text-slate-900"
                onClick={logout}
              >
                Odhlásiť sa
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Platby prebiehajú formou faktúry a detailný stav objednávok nájdete po prihlásení v sekcii Správa
              objednávok.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="text-lg font-semibold text-slate-900">Prihlásenie</p>
            <input
              type="email"
              placeholder="E-mail"
              required
              value={loginState.email}
              onChange={(event) => setLoginState({ ...loginState, email: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Heslo"
              required
              value={loginState.password}
              onChange={(event) => setLoginState({ ...loginState, password: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
            <div>
              <p className="text-xs font-semibold text-slate-500">Captcha bezpečnostný kód</p>
              <div className="mt-2 flex items-center gap-4 rounded-2xl border border-slate-200 p-3">
                <Image
                  src={`data:image/svg+xml;utf8,${captchaSvg}`}
                  alt="Captcha"
                  width={160}
                  height={48}
                  className="h-10 w-32 rounded-md border border-slate-100 bg-slate-900"
                />
                <input
                  placeholder="Zadajte kód"
                  value={loginState.captcha}
                  onChange={(event) => setLoginState({ ...loginState, captcha: event.target.value.toUpperCase() })}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
            {showOtpStep && (
              <input
                placeholder="Zadajte 2FA kód"
                value={loginState.otp}
                onChange={(event) => setLoginState({ ...loginState, otp: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={loginState.require2fa}
                onChange={(event) => setLoginState({ ...loginState, require2fa: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Chcem použiť 2FA (OTP kód zaslaný e-mailom)
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-brand-accent px-6 py-3 text-base font-semibold text-slate-900"
            >
              Prihlásiť sa
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
              onClick={sendInstantReset}
            >
              Poslať nové heslo na e-mail
            </button>
            {messages.login && <p className="text-xs text-emerald-600">{messages.login}</p>}
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700"
                onClick={() => {
                  setShowReset((prev) => !prev);
                  setShowRegister(false);
                }}
              >
                Obnoviť heslo
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-slate-900 px-6 py-2 text-sm font-semibold text-slate-900"
                onClick={() => {
                  setShowRegister((prev) => !prev);
                  setShowReset(false);
                }}
              >
                Registrácia
              </button>
            </div>
          </form>

          {showRegister && (
            <form
              onSubmit={handleRegister}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
            >
            <p className="text-lg font-semibold text-slate-900">Vytvoriť B2B účet</p>
            <input
              type="email"
              placeholder="Firemný e-mail"
              required
              value={registerState.email}
              onChange={(event) => setRegisterState({ ...registerState, email: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="password"
                placeholder="Heslo"
                required
                value={registerState.password}
                onChange={(event) => setRegisterState({ ...registerState, password: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Potvrdiť heslo"
                required
                value={registerState.confirmPassword}
                onChange={(event) => setRegisterState({ ...registerState, confirmPassword: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <input
              placeholder="Spoločnosť"
              required
              value={registerState.companyName}
              onChange={(event) => setRegisterState({ ...registerState, companyName: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <input
                placeholder="IČO"
                required
                value={registerState.ico}
                onChange={(event) => setRegisterState({ ...registerState, ico: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
              <input
                placeholder="DIČ"
                required
                value={registerState.dic}
                onChange={(event) => setRegisterState({ ...registerState, dic: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
              <input
                placeholder="IČ DPH"
                value={registerState.vatId}
                onChange={(event) => setRegisterState({ ...registerState, vatId: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Úroveň oprávnenia
              <select
                value={registerState.role}
                onChange={(event) => setRegisterState({ ...registerState, role: event.target.value as 'user' | 'admin' })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              >
                <option value="user">Bežný používateľ</option>
                <option value="admin">Administrátor</option>
              </select>
            </label>
            <div>
              <label className="text-xs font-semibold text-slate-500">Captcha bezpečnostný kód: {CAPTCHA_CODE}</label>
              <input
                placeholder="Zadajte kód"
                value={registerState.captcha}
                onChange={(event) => setRegisterState({ ...registerState, captcha: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={registerState.twoFactorEnabled}
                onChange={(event) => setRegisterState({ ...registerState, twoFactorEnabled: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Aktivovať 2FA hneď po vytvorení účtu
            </label>
            <button
              type="submit"
              className="w-full rounded-full border border-slate-900 px-6 py-3 text-base font-semibold text-slate-900"
            >
              Vytvoriť účet
            </button>
            {messages.register && <p className="text-xs text-emerald-600">{messages.register}</p>}
            </form>
          )}

          {showReset && (
            <form
              onSubmit={handleReset}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
            >
          <p className="text-lg font-semibold text-slate-900">Obnoviť heslo</p>
          <input
            type="email"
            placeholder="Firemný e-mail"
            required
            value={resetState.email}
            onChange={(event) => setResetState({ ...resetState, email: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
          />
          <div>
            <label className="text-xs font-semibold text-slate-500">Captcha bezpečnostný kód: {CAPTCHA_CODE}</label>
            <input
              placeholder="Zadajte kód"
              required
              value={resetState.captcha}
              onChange={(event) => setResetState({ ...resetState, captcha: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white"
          >
            Odoslať odkaz na obnovu
          </button>
          {messages.reset && <p className="text-xs text-emerald-600">{messages.reset}</p>}
        </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
