import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { getSession } from '@/lib/session';

const INITIAL_CLIENTS = [
  {
    name: 'Dmart',
    branches: [
      { name: 'Baner Branch', city: 'Pune' },
      { name: 'Wakad Branch', city: 'Pune' },
      { name: 'Aundh Branch', city: 'Pune' },
      { name: 'Kothrud Branch', city: 'Pune' },
      { name: 'Hadapsar Branch', city: 'Pune' },
    ],
  },
  {
    name: 'Pantaloons',
    branches: [
      { name: 'MG Road', city: 'Pune' },
      { name: 'Camp Branch', city: 'Pune' },
      { name: 'Viman Nagar', city: 'Pune' },
      { name: 'Koregaon Park', city: 'Pune' },
      { name: 'Pimpri Branch', city: 'Pune' },
    ],
  },
  {
    name: 'Big Bazaar',
    branches: [
      { name: 'Navi Peth', city: 'Pune' },
      { name: 'Kalyani Nagar', city: 'Pune' },
      { name: 'Nigdi Branch', city: 'Pune' },
      { name: 'Bhosari Branch', city: 'Pune' },
    ],
  },
  {
    name: 'Reliance Trends',
    branches: [
      { name: 'FC Road', city: 'Pune' },
      { name: 'Satara Road', city: 'Pune' },
      { name: 'Bibvewadi Branch', city: 'Pune' },
    ],
  },
  {
    name: 'Max Fashion',
    branches: [
      { name: 'Clover Center', city: 'Pune' },
      { name: 'SGS Mall Branch', city: 'Pune' },
      { name: 'Westend Mall', city: 'Pune' },
    ],
  },
  {
    name: 'Croma',
    branches: [
      { name: 'Aundh', city: 'Pune' },
      { name: 'Phoenix Mall', city: 'Pune' },
      { name: 'Kalyani Nagar', city: 'Pune' },
    ],
  },
  {
    name: 'Vijay Sales',
    branches: [
      { name: 'Swargate', city: 'Pune' },
      { name: 'JM Road', city: 'Pune' },
      { name: 'Pimpri', city: 'Pune' },
    ],
  },
];

// ─── GET /api/clients ────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    let clients = await Client.find().sort({ name: 1 }).lean();

    // If no clients exist yet, seed initial clients for a seamless experience
    if (!clients || clients.length === 0) {
      try {
        await Client.insertMany(INITIAL_CLIENTS);
        clients = await Client.find().sort({ name: 1 }).lean();
      } catch (seedErr) {
        console.error('Seed clients error:', seedErr);
      }
    }

    return NextResponse.json({
      success: true,
      clients: clients.map((c) => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        name: c.name,
        mobile: c.mobile || '',
        email: c.email || '',
        branches: (c.branches || []).map((b) => ({
          id: b._id?.toString(),
          name: b.name,
          city: b.city || 'Pune',
          address: b.address || '',
        })),
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /api/clients]', err);
    return NextResponse.json({ error: 'Failed to fetch clients.' }, { status: 500 });
  }
}

// ─── POST /api/clients ───────────────────────────────────────────────────────
// Admin creates a new client with branches
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can add clients.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, branches = [], branchNames = '', mobile = '', email = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }

    const cleanName = name.trim();

    await connectDB();

    const existing = await Client.findOne({ name: { $regex: `^${cleanName}$`, $options: 'i' } });
    if (existing) {
      return NextResponse.json({ error: `Client "${cleanName}" already exists.` }, { status: 409 });
    }

    // Process branches
    let branchList = [];
    if (Array.isArray(branches) && branches.length > 0) {
      branchList = branches.map((b) => {
        if (typeof b === 'string') return { name: b.trim(), city: 'Pune' };
        return { name: b.name?.trim(), city: b.city?.trim() || 'Pune', address: b.address?.trim() || '' };
      }).filter((b) => b.name);
    } else if (typeof branchNames === 'string' && branchNames.trim()) {
      // Split by comma or newline
      branchList = branchNames
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((bName) => ({ name: bName, city: 'Pune' }));
    }

    if (branchList.length === 0) {
      branchList.push({ name: 'Main Branch', city: 'Pune' });
    }

    const newClient = await Client.create({
      name: cleanName,
      mobile: mobile.trim(),
      email: email.trim(),
      branches: branchList,
    });

    return NextResponse.json({
      success: true,
      message: `Client "${cleanName}" created successfully!`,
      client: {
        id: newClient._id.toString(),
        name: newClient.name,
        branches: newClient.branches,
        createdAt: newClient.createdAt,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clients]', err);
    return NextResponse.json({ error: err.message || 'Failed to create client.' }, { status: 500 });
  }
}

// ─── PUT /api/clients ────────────────────────────────────────────────────────
// Admin updates an existing client's name and/or branches
export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update clients.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, branches = [], branchNames = '', mobile = '', email = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }

    await connectDB();

    const cleanName = name.trim();

    // Check duplicate name (exclude current client)
    const duplicate = await Client.findOne({
      name: { $regex: `^${cleanName}$`, $options: 'i' },
      _id: { $ne: id },
    });
    if (duplicate) {
      return NextResponse.json({ error: `Client "${cleanName}" already exists.` }, { status: 409 });
    }

    // Process branches
    let branchList = [];
    if (Array.isArray(branches) && branches.length > 0) {
      branchList = branches
        .map((b) => {
          if (typeof b === 'string') return { name: b.trim(), city: 'Pune' };
          return { name: b.name?.trim(), city: b.city?.trim() || 'Pune', address: b.address?.trim() || '' };
        })
        .filter((b) => b.name);
    } else if (typeof branchNames === 'string' && branchNames.trim()) {
      branchList = branchNames
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((bName) => ({ name: bName, city: 'Pune' }));
    }

    if (branchList.length === 0) {
      branchList.push({ name: 'Main Branch', city: 'Pune' });
    }

    const updated = await Client.findByIdAndUpdate(
      id,
      { name: cleanName, mobile: mobile.trim(), email: email.trim(), branches: branchList },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Client "${cleanName}" updated successfully!`,
      client: {
        id: updated._id.toString(),
        name: updated.name,
        branches: updated.branches,
      },
    });
  } catch (err) {
    console.error('[PUT /api/clients]', err);
    return NextResponse.json({ error: err.message || 'Failed to update client.' }, { status: 500 });
  }
}

// ─── DELETE /api/clients ─────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete clients.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    await connectDB();
    await Client.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Client deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/clients]', err);
    return NextResponse.json({ error: 'Failed to delete client.' }, { status: 500 });
  }
}
