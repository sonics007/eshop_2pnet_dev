'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main admin page - pathname logic will handle panel selection
    router.push('/admin');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-500">Načítavam...</p>
    </div>
  );
}
