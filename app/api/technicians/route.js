import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Technician from '@/models/Technician';
import Visit from '@/models/Visit';
import { getSession } from '@/lib/session';

// ─── GET /api/technicians ──────────────────────────────────────────────────
// Returns list of all technicians along with their visit stats and recent flow
export async function GET(request) {
  try {
    await connectDB();

    const technicians = await Technician.find().sort({ createdAt: -1 }).lean();

    // Today start
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch stats and latest visits for each technician
    const techData = await Promise.all(
      technicians.map(async (tech) => {
        // Find visits matching technicianId OR technicianName (for backwards compatibility)
        const filter = {
          $or: [
            { technicianId: tech._id },
            { technicianName: { $regex: `^${tech.name}$`, $options: 'i' } },
          ],
        };

        const totalVisits = await Visit.countDocuments(filter);
        const todayVisits = await Visit.countDocuments({
          ...filter,
          createdAt: { $gte: todayStart },
        });

        // Latest 5 visits for quick flow preview
        const recentVisits = await Visit.find(filter)
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        return {
          id: tech._id.toString(),
          _id: tech._id.toString(),
          name: tech.name,
          address: tech.address || '',
          loginId: tech.loginId,
          email: tech.email || '',
          mobile: tech.mobile || '',
          role: tech.role || 'technician',
          isActive: tech.isActive !== false,
          createdAt: tech.createdAt,
          totalVisits,
          todayVisits,
          latestVisit: recentVisits[0] || null,
          recentVisits,
        };
      })
    );

    return NextResponse.json({ success: true, technicians: techData }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/technicians]', err);
    return NextResponse.json({ error: 'Failed to fetch technicians.' }, { status: 500 });
  }
}

// ─── POST /api/technicians ─────────────────────────────────────────────────
// Admin creates a new technician with name, mobile, email, loginId, and password
export async function POST(request) {
  try {
    const session = await getSession();
    // Allow creation if admin or if no technicians exist yet (initial setup)
    if (session && session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create technicians.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, mobile, email, loginId, password } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Technician name is required.' }, { status: 400 });
    }
    if (!mobile || !mobile.trim()) {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long.' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    // If loginId not specified, derive from email username or name
    let cleanLoginId = (loginId && loginId.trim())
      ? loginId.trim().toLowerCase()
      : cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');

    if (!cleanLoginId) {
      cleanLoginId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Prevent using admin login ID
    if (
      cleanLoginId === (process.env.ADMIN_LOGIN_ID || 'admin').toLowerCase() ||
      cleanEmail === (process.env.ADMIN_EMAIL || 'admin@arcticac.com').toLowerCase()
    ) {
      return NextResponse.json({ error: 'This login ID / email is reserved for admin.' }, { status: 400 });
    }

    await connectDB();

    // Check if loginId or email already exists
    const existing = await Technician.findOne({
      $or: [{ loginId: cleanLoginId }, { email: cleanEmail }],
    });
    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json({ error: `Technician with email "${cleanEmail}" is already registered.` }, { status: 409 });
      }
      return NextResponse.json({ error: `Login ID "${cleanLoginId}" is already registered. Please choose another.` }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create technician with default role: 'technician'
    const newTech = await Technician.create({
      name: cleanName,
      address: address?.trim() || '',
      mobile: cleanMobile,
      email: cleanEmail,
      loginId: cleanLoginId,
      password: hashedPassword,
      role: 'technician',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Technician "${cleanName}" created successfully!`,
      technician: {
        id: newTech._id.toString(),
        name: newTech.name,
        mobile: newTech.mobile,
        email: newTech.email,
        loginId: newTech.loginId,
        role: newTech.role,
        isActive: newTech.isActive,
        createdAt: newTech.createdAt,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/technicians]', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// ─── DELETE /api/technicians ───────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const session = await getSession();
    if (session && session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete technicians.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Technician ID is required.' }, { status: 400 });
    }

    await connectDB();
    await Technician.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Technician deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/technicians]', err);
    return NextResponse.json({ error: 'Failed to delete technician.' }, { status: 500 });
  }
}
