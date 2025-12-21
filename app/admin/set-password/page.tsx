'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validuj token pri načítaní
  useEffect(() => {
    if (!token) {
      setError('Chýba token v odkaze');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/admin/set-password?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
          setUserInfo({ email: data.email, name: data.name });
        } else {
          setError(data.error || 'Neplatný alebo expirovaný odkaz');
        }
      } catch (err) {
        setError('Chyba pri overovaní odkazu');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Heslo musí mať aspoň 8 znakov');
      return;
    }

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/admin/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 3000);
      } else {
        setError(data.error || 'Chyba pri nastavovaní hesla');
      }
    } catch (err) {
      setError('Chyba servera');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="mt-4 text-sm text-slate-600">Overujem odkaz...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Heslo nastavené</h1>
          <p className="mt-2 text-slate-600">
            Vaše heslo bolo úspešne nastavené. Teraz sa môžete prihlásiť.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Presmerovanie na prihlásenie...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <svg className="h-8 w-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Neplatný odkaz</h1>
          <p className="mt-2 text-slate-600">
            {error || 'Odkaz je neplatný alebo už expiroval.'}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Kontaktujte administrátora pre nový odkaz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Nastavenie hesla</h1>
          <p className="mt-2 text-slate-600">
            Vitajte, <strong>{userInfo?.name || userInfo?.email}</strong>
          </p>
          <p className="text-sm text-slate-500">
            Nastavte si heslo pre prístup do administrácie.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={userInfo?.email || ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nové heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimálne 8 znakov"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Potvrdiť heslo
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Zopakujte heslo"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Ukladám...' : 'Nastaviť heslo'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Po nastavení hesla budete presmerovaní na prihlasovaciu stránku.
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="mt-4 text-sm text-slate-600">Načítavam...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
