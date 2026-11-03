import TechnicianTracker from '../TechnicianTracker';
import connectDB from '@/lib/mongodb';
import Technician from '@/models/Technician';
import Visit from '@/models/Visit';

export const metadata = { title: 'Technicians – Admin Panel' };
export const dynamic = 'force-dynamic';

export default async function TechniciansPage() {
  await connectDB();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const dbTechs = await Technician.find().sort({ createdAt: -1 }).lean();

  const technicians = await Promise.all(
    dbTechs.map(async (t) => {
      const techFilter = {
        $or: [
          { technicianId: t._id },
          { technicianName: { $regex: `^${t.name}$`, $options: 'i' } },
        ],
      };
      const count      = await Visit.countDocuments(techFilter);
      const todayCount = await Visit.countDocuments({ ...techFilter, createdAt: { $gte: todayStart } });
      const latest     = await Visit.findOne(techFilter).sort({ createdAt: -1 }).lean();

      return {
        id:         t._id.toString(),
        name:       t.name,
        address:    t.address || '',
        loginId:    t.loginId,
        email:      t.email || '',
        mobile:     t.mobile || '',
        role:       t.role || 'technician',
        isActive:   t.isActive !== false,
        createdAt:  t.createdAt.toISOString(),
        totalVisits: count,
        todayVisits: todayCount,
        latestVisit: latest
          ? {
              clientName:     latest.clientName,
              branchLocation: latest.branchLocation,
              acType:         latest.acType,
              createdAt:      latest.createdAt.toISOString(),
            }
          : null,
      };
    })
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Technician Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Create, edit, and manage field technician accounts, credentials, and activity tracking.
        </p>
      </div>
      <TechnicianTracker initialTechnicians={technicians} />
    </div>
  );
}

