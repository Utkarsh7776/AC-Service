import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import { getSession } from '@/lib/session';

// Configure Cloudinary
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper: upload a Buffer to Cloudinary via stream
 */
async function uploadToCloudinary(buffer, folder = 'ac-visits') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── POST /api/visits ────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'You must be signed in to submit a service visit.' }, { status: 401 });
    }

    const formData = await request.formData();

    // Lock technician identity to authenticated user if technician
    let technicianName = session.role === 'technician' ? session.name : (formData.get('technicianName') || session.name);
    let technicianId   = session.role === 'technician' ? session.id   : (formData.get('technicianId')   || session.id);

    const clientName      = formData.get('clientName');
    const branchLocation  = formData.get('branchLocation');
    const acType          = formData.get('acType');
    const serialNumber    = formData.get('serialNumber') || '';
    const workDone        = formData.get('workDone') || '';
    const lat             = formData.get('lat');
    const lng             = formData.get('lng');
    const indoorFile      = formData.get('indoorPhoto');
    const outdoorFile     = formData.get('outdoorPhoto');

    // Validation
    if (!technicianName || !technicianName.trim()) {
      return NextResponse.json({ error: 'Technician name is required. Please ensure you are logged in.' }, { status: 400 });
    }
    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'Please select a client.' }, { status: 400 });
    }
    if (!branchLocation || !branchLocation.trim()) {
      return NextResponse.json({ error: 'Please enter or select branch location.' }, { status: 400 });
    }
    if (!acType || !acType.trim()) {
      return NextResponse.json({ error: 'Please select an AC type.' }, { status: 400 });
    }
    if (!indoorFile || !outdoorFile) {
      return NextResponse.json({ error: 'Both indoor and outdoor unit photos are required.' }, { status: 400 });
    }

    // Convert files to Buffers
    const indoorBuffer  = Buffer.from(await indoorFile.arrayBuffer());
    const outdoorBuffer = Buffer.from(await outdoorFile.arrayBuffer());

    // Upload both photos concurrently
    const [indoorPhotoUrl, outdoorPhotoUrl] = await Promise.all([
      uploadToCloudinary(indoorBuffer,  'ac-visits/indoor'),
      uploadToCloudinary(outdoorBuffer, 'ac-visits/outdoor'),
    ]);

    // Connect DB & save
    await connectDB();
    const isTechIdValid = technicianId && mongoose.Types.ObjectId.isValid(technicianId);
    const visit = await Visit.create({
      technicianName: technicianName.trim(),
      technicianId: isTechIdValid ? technicianId : undefined,
      clientName: clientName.trim(),
      branchLocation: branchLocation.trim(),
      acType: acType.trim(),
      serialNumber: serialNumber.toString().trim(),
      workDone: workDone.toString().trim(),
      indoorPhotoUrl,
      outdoorPhotoUrl,
      geoLocation: {
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      },
    });

    return NextResponse.json({ success: true, visit }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/visits]', err);
    return NextResponse.json({
      error: err.message || 'Internal server error. Please try again.',
    }, { status: 500 });
  }
}

// ─── GET /api/visits ─────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    await connectDB();
    const session = await getSession();

    const { searchParams } = new URL(request.url);
    const client       = searchParams.get('client');
    const acType       = searchParams.get('acType');
    const tech         = searchParams.get('tech');
    const technicianId = searchParams.get('technicianId');

    const filter = {};
    if (client && client !== 'all') filter.clientName = { $regex: client, $options: 'i' };
    if (acType && acType !== 'all') filter.acType     = { $regex: acType, $options: 'i' };

    // ── PRIVACY ENFORCEMENT: Technician can only see their own visits ──
    if (session?.role === 'technician') {
      filter.$or = [
        { technicianId: session.id },
        { technicianName: { $regex: `^${session.name}$`, $options: 'i' } },
      ];
    } else {
      // Admin can filter by any technician or view all
      if (technicianId && technicianId !== 'all') {
        filter.technicianId = technicianId;
      } else if (tech && tech !== 'all') {
        filter.technicianName = { $regex: tech, $options: 'i' };
      }
    }

    const visits = await Visit.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ visits }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/visits]', err);
    return NextResponse.json({ error: 'Failed to fetch visits.' }, { status: 500 });
  }
}
