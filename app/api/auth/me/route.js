import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: session.id,
        name: session.name,
        loginId: session.loginId,
        email: session.email || '',
        mobile: session.mobile || '',
        role: session.role,
      },
    }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
