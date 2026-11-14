'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import InstallAppBanner from '@/components/InstallAppBanner';
import { UserProvider } from '@/lib/UserContext';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/';

  return (
    <UserProvider>
      {isAuthPage ? (
        <main className="min-h-screen flex flex-col">
          <InstallAppBanner />
          <div className="flex-1">{children}</div>
        </main>
      ) : (
        <div className="min-h-screen flex flex-col">
          <InstallAppBanner />
          <div className="flex-1 flex flex-col">
            <Sidebar>{children}</Sidebar>
          </div>
        </div>
      )}
    </UserProvider>
  );
}
