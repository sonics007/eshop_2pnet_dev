'use client';

import { ChatSettingsPanel } from '@/components/admin/panels/ChatSettingsPanel';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Chat nastavenia</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nastavenia Tawk.to live chat widgetu
          </p>
        </div>

        <ChatSettingsPanel />
      </div>
    </div>
  );
}
