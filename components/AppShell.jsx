'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import InstallAppBanner from '@/components/InstallAppBanner';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/';

  if (isAuthPage) {
    return (
      <main className="min-h-screen flex flex-col">
        <InstallAppBanner />
        <div className="flex-1">{children}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <InstallAppBanner />
      <div className="flex-1 flex flex-col">
        <Sidebar>{children}</Sidebar>
      </div>
    </div>
  );
}
