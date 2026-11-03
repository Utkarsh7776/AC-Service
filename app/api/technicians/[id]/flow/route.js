import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Technician from '@/models/Technician';
import Visit from '@/models/Visit';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    await connectDB();

    const technician = await Technician.findById(id).lean();
    if (!technician) {
      return NextResponse.json({ error: 'Technician not found.' }, { status: 404 });
    }

    // Match either by technicianId or technicianName
    const filter = {
      $or: [
        { technicianId: technician._id },
        { technicianName: { $regex: `^${technician.name}$`, $options: 'i' } },
      ],
    };

    // All visits in reverse chronological order (newest first for timeline)
    const visits = await Visit.find(filter).sort({ createdAt: -1 }).lean();

    // Compute client distribution and AC type distribution
    const clientBreakdown = {};
    const acTypeBreakdown = {};
    visits.forEach((v) => {
      clientBreakdown[v.clientName] = (clientBreakdown[v.clientName] || 0) + 1;
      acTypeBreakdown[v.acType] = (acTypeBreakdown[v.acType] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      technician: {
        id: technician._id.toString(),
        name: technician.name,
        loginId: technician.loginId,
        isActive: technician.isActive,
        createdAt: technician.createdAt,
      },
      summary: {
        totalVisits: visits.length,
        clientBreakdown,
        acTypeBreakdown,
        firstVisitDate: visits.length > 0 ? visits[visits.length - 1].createdAt : null,
        latestVisitDate: visits.length > 0 ? visits[0].createdAt : null,
      },
      flow: visits,
    }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/technicians/[id]/flow]', err);
    return NextResponse.json({ error: 'Failed to fetch technician flow.' }, { status: 500 });
  }
}
