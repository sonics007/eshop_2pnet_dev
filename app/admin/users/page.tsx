'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersPanel } from '@/components/admin/panels/UsersPanel';

const tabs = [
  {
    id: 'admins',
    label: 'Administratori',
    description: 'Interny tim s plnymi pravami',
    filterRole: 'admin' as const
  },
  {
    id: 'customers',
    label: 'Zakaznici',
    description: 'Koncovi pouzivatelia e-shopu',
    filterRole: 'user' as const
  }
];

export default function UsersAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get('tab') === 'customers' ? 'customers' : 'admins';
  const activePanelId = selectedTab === 'customers' ? 'admin-customers' : 'admin-admins';

  const handleTabChange = (tab: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tab);
    router.replace(`?${next.toString()}`);
  };

  const currentTab = tabs.find((t) => t.id === selectedTab) || tabs[0];

  return (
    <AdminLayout activePanel={activePanelId}>
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Sprava pouzivatelov</p>
          <h1 className="text-3xl font-semibold text-slate-900">Pouzivatelia</h1>
          <p className="text-sm text-slate-500">
            Spravujte administratorov a zakaznikov. Vytvarajte nove ucty, resetujte hesla a nastavujte 2FA.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-1 min-w-[140px] flex-col rounded-2xl px-4 py-3 text-left transition ${
                selectedTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className={`text-xs ${selectedTab === tab.id ? 'text-slate-200' : 'text-slate-400'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        <UsersPanel
          filterRole={currentTab.filterRole}
          title={currentTab.label}
        />
      </div>
    </AdminLayout>
  );
}
