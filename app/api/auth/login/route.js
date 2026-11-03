import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Technician from '@/models/Technician';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = (body.email || body.loginId || body.identifier || '').trim().toLowerCase();
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email or Login ID and password are required.' }, { status: 400 });
    }

    let user = null;

    // ── Admin check (credentials stored in env) ──
    const adminLoginId = (process.env.ADMIN_LOGIN_ID || 'admin').toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@arcticac.com').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';

    if (
      (identifier === adminLoginId || identifier === adminEmail) &&
      password === adminPass
    ) {
      user = {
        id: 'admin',
        name: process.env.ADMIN_NAME || 'Admin',
        loginId: adminLoginId,
        email: adminEmail,
        role: 'admin',
      };
    } else {
      // ── Technician check (from MongoDB by loginId or email) ──
      await connectDB();
      const tech = await Technician.findOne({
        $or: [{ loginId: identifier }, { email: identifier }],
      });

      if (!tech) {
        return NextResponse.json({ error: 'Invalid Email/Login ID or password.' }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, tech.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid Email/Login ID or password.' }, { status: 401 });
      }
      if (!tech.isActive) {
        return NextResponse.json({ error: 'Your account is deactivated. Contact admin.' }, { status: 403 });
      }

      user = {
        id: tech._id.toString(),
        name: tech.name,
        loginId: tech.loginId,
        email: tech.email || '',
        mobile: tech.mobile || '',
        role: tech.role || 'technician',
      };
    }

    // Sign JWT
    const token = await signToken(user);

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
      },
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days persistent login
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
