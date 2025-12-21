import type { ReactNode } from 'react';
import { AdminAuthProvider } from '@/lib/modules/auth';

export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
