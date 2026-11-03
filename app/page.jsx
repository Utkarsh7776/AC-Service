import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'NextGenWebtech Solutions – Field Service Portal',
  description: 'Sign in to access your field service account',
};

export default async function HomePage() {
  const session = await getSession();

  if (session?.role === 'admin') {
    redirect('/dashboard');
  }

  if (session?.role === 'technician') {
    redirect('/technician');
  }

  redirect('/login');
}
