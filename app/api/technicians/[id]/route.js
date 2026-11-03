import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Technician from '@/models/Technician';
import { getSession } from '@/lib/session';

// ─── GET /api/technicians/[id] ──────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectDB();
    const tech = await Technician.findById(id).lean();
    if (!tech) {
      return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      technician: {
        id: tech._id.toString(),
        name: tech.name,
        address: tech.address || '',
        email: tech.email || '',
        mobile: tech.mobile || '',
        loginId: tech.loginId,
        role: tech.role || 'technician',
        isActive: tech.isActive !== false,
        createdAt: tech.createdAt,
      },
    });
  } catch (err) {
    console.error('[GET /api/technicians/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch technician.' }, { status: 500 });
  }
}

// ─── PUT /api/technicians/[id] ──────────────────────────────────────────────
// Admin edits technician information
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can edit technician information.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, address, mobile, email, loginId, password, isActive } = body;

    await connectDB();

    const tech = await Technician.findById(id);
    if (!tech) {
      return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    }

    if (name && name.trim()) tech.name = name.trim();
    if (address !== undefined) tech.address = address.trim();
    if (mobile !== undefined) tech.mobile = mobile.trim();

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Check if another technician has this email
      const existing = await Technician.findOne({ email: cleanEmail, _id: { $ne: tech._id } });
      if (existing) {
        return NextResponse.json({ error: `Email "${cleanEmail}" is already used by another technician.` }, { status: 409 });
      }
      tech.email = cleanEmail;
    }

    if (loginId && loginId.trim()) {
      const cleanLoginId = loginId.trim().toLowerCase();
      // Check if another technician has this loginId
      const existing = await Technician.findOne({ loginId: cleanLoginId, _id: { $ne: tech._id } });
      if (existing) {
        return NextResponse.json({ error: `Login ID "${cleanLoginId}" is already taken.` }, { status: 409 });
      }
      tech.loginId = cleanLoginId;
    }

    if (typeof isActive === 'boolean') {
      tech.isActive = isActive;
    }

    // If new password provided, hash and update
    if (password && password.trim().length >= 4) {
      tech.password = await bcrypt.hash(password.trim(), 10);
    }

    await tech.save();

    return NextResponse.json({
      success: true,
      message: `Technician "${tech.name}" updated successfully.`,
      technician: {
        id: tech._id.toString(),
        name: tech.name,
        address: tech.address || '',
        email: tech.email || '',
        mobile: tech.mobile || '',
        loginId: tech.loginId,
        role: tech.role || 'technician',
        isActive: tech.isActive,
        updatedAt: tech.updatedAt,
      },
    });
  } catch (err) {
    console.error('[PUT /api/technicians/[id]]', err);
    return NextResponse.json({ error: err.message || 'Failed to update technician.' }, { status: 500 });
  }
}

// ─── DELETE /api/technicians/[id] ───────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete technicians.' }, { status: 403 });
    }

    const { id } = params;
    await connectDB();
    await Technician.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Technician deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/technicians/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete technician.' }, { status: 500 });
  }
}
