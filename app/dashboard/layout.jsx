import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session) redirect('/login?redirect=/dashboard');
  if (session.role === 'technician') redirect('/technician');

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {children}
    </div>
  );
}
