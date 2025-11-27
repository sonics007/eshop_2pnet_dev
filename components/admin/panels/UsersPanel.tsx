'use client';

/**
 * USERS MODULE - Admin Panel
 *
 * Panel pre správu používateľov s 2FA podporou
 */

import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  companyName: string;
  ico?: string;
  dic?: string;
  vatId?: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

interface TwoFASetup {
  secret: string;
  otpauthUrl: string;
}

interface UsersPanelProps {
  filterRole?: 'admin' | 'user';
  title?: string;
  onSave?: () => void;
}

export function UsersPanel({ filterRole, title, onSave }: UsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editácia / vytvorenie
  const [editUser, setEditUser] = useState<Partial<User> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // 2FA setup
  const [twoFAUser, setTwoFAUser] = useState<User | null>(null);
  const [twoFASetup, setTwoFASetup] = useState<TwoFASetup | null>(null);
  const [twoFACode, setTwoFACode] = useState('');

  // Načítaj používateľov
  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    try {
      const url = filterRole ? `/api/users?role=${filterRole}` : '/api/users';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleCreate = () => {
    setIsCreating(true);
    setEditUser({
      email: '',
      companyName: '',
      role: filterRole || 'user',
      twoFactorEnabled: false
    });
    setNewPassword('');
  };

  const handleEdit = (user: User) => {
    setIsCreating(false);
    setEditUser({ ...user });
    setNewPassword('');
  };

  const handleSave = async () => {
    if (!editUser) return;

    setSaving(true);
    try {
      if (isCreating) {
        // Vytvor nového
        if (!newPassword) {
          setMessage({ type: 'error', text: 'Heslo je povinné' });
          setSaving(false);
          return;
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editUser,
            password: newPassword
          })
        });

        const result = await response.json();
        if (result.success) {
          setMessage({ type: 'success', text: 'Používateľ vytvorený' });
          setEditUser(null);
          loadUsers();
          onSave?.();
        } else {
          setMessage({ type: 'error', text: result.error || 'Chyba pri vytváraní' });
        }
      } else {
        // Uprav existujúceho
        const payload: Record<string, unknown> = { ...editUser };
        if (newPassword) {
          payload.password = newPassword;
        }

        const response = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          setMessage({ type: 'success', text: 'Používateľ uložený' });
          setEditUser(null);
          loadUsers();
          onSave?.();
        } else {
          setMessage({ type: 'error', text: result.error || 'Chyba pri ukladaní' });
        }
      }
    } catch (error) {
      console.error('Save user error:', error);
      setMessage({ type: 'error', text: 'Chyba servera' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Naozaj chcete zmazať používateľa ${user.companyName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Používateľ zmazaný' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Chyba pri mazaní' });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      setMessage({ type: 'error', text: 'Chyba servera' });
    }
  };

  // 2FA setup
  const handleSetup2FA = async (user: User) => {
    setTwoFAUser(user);
    setTwoFACode('');

    try {
      const response = await fetch(`/api/users/${user.id}/2fa`);
      const result = await response.json();

      if (result.success) {
        setTwoFASetup({
          secret: result.secret,
          otpauthUrl: result.otpauthUrl
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Chyba pri generovaní 2FA' });
        setTwoFAUser(null);
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setMessage({ type: 'error', text: 'Chyba servera' });
      setTwoFAUser(null);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFAUser || !twoFASetup) return;

    try {
      const response = await fetch(`/api/users/${twoFAUser.id}/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: twoFASetup.secret,
          code: twoFACode
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '2FA aktivované' });
        setTwoFAUser(null);
        setTwoFASetup(null);
        setTwoFACode('');
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Neplatný kód' });
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      setMessage({ type: 'error', text: 'Chyba servera' });
    }
  };

  const handleDisable2FA = async (user: User) => {
    if (!confirm(`Naozaj chcete deaktivovať 2FA pre ${user.companyName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/2fa`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '2FA deaktivované' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Chyba' });
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      setMessage({ type: 'error', text: 'Chyba servera' });
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm text-slate-500">Načítavam používateľov...</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {title || (filterRole === 'admin' ? 'Administrátori' : filterRole === 'user' ? 'Zákazníci' : 'Používatelia')}
          </h2>
          <p className="text-sm text-slate-500">
            {users.length} {users.length === 1 ? 'používateľ' : 'používateľov'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Nový
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {message.text}
        </p>
      )}

      {/* Zoznam používateľov */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-slate-400">Žiadni používatelia</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-slate-900">{user.companyName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.role}
                </span>
                {user.twoFactorEnabled && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    2FA
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(user)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Upraviť
                </button>
                {user.twoFactorEnabled ? (
                  <button
                    onClick={() => handleDisable2FA(user)}
                    className="rounded-lg border border-rose-200 px-3 py-1 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Zrušiť 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetup2FA(user)}
                    className="rounded-lg border border-emerald-200 px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50"
                  >
                    Nastaviť 2FA
                  </button>
                )}
                <button
                  onClick={() => handleDelete(user)}
                  className="rounded-lg border border-rose-200 px-3 py-1 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Zmazať
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal pre editáciu/vytvorenie */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {isCreating ? 'Nový používateľ' : 'Upraviť používateľa'}
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email *</label>
                <input
                  type="email"
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="email@firma.sk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Meno / Firma *</label>
                <input
                  type="text"
                  value={editUser.companyName || ''}
                  onChange={(e) => setEditUser({ ...editUser, companyName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Názov firmy alebo meno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {isCreating ? 'Heslo *' : 'Nové heslo (nechať prázdne = bez zmeny)'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder={isCreating ? 'Zadajte heslo' : 'Nové heslo'}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">IČO</label>
                  <input
                    type="text"
                    value={editUser.ico || ''}
                    onChange={(e) => setEditUser({ ...editUser, ico: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">DIČ</label>
                  <input
                    type="text"
                    value={editUser.dic || ''}
                    onChange={(e) => setEditUser({ ...editUser, dic: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">IČ DPH</label>
                  <input
                    type="text"
                    value={editUser.vatId || ''}
                    onChange={(e) => setEditUser({ ...editUser, vatId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Rola</label>
                <select
                  value={editUser.role || 'user'}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="user">Zákazník</option>
                  <option value="admin">Administrátor</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Ukladám...' : 'Uložiť'}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pre 2FA setup */}
      {twoFAUser && twoFASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Nastavenie 2FA pre {twoFAUser.companyName}
            </h3>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  1. Naskenujte QR kód v aplikácii Google Authenticator alebo podobnej
                </p>
                <div className="mt-3 flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFASetup.otpauthUrl)}`}
                    alt="2FA QR Code"
                    className="rounded-lg"
                    width={200}
                    height={200}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  2. Alebo manuálne zadajte tento kód:
                </p>
                <p className="mt-2 font-mono text-sm font-semibold text-slate-900 break-all">
                  {twoFASetup.secret}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  3. Zadajte overovací kód z aplikácie:
                </label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-slate-900 focus:outline-none"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleEnable2FA}
                disabled={twoFACode.length !== 6}
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Aktivovať 2FA
              </button>
              <button
                onClick={() => {
                  setTwoFAUser(null);
                  setTwoFASetup(null);
                  setTwoFACode('');
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
