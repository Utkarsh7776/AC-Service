import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Technician from '@/models/Technician';
import { Camera, Calendar, Users, Building2 } from 'lucide-react';
import DashboardFilters from './DashboardFilters';
import VisitGrid from './VisitGrid';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'Dashboard – Field Service Operations',
};

export default async function DashboardPage({ searchParams }) {
  await connectDB();

  const client = searchParams?.client || 'all';
  const acType = searchParams?.acType || 'all';
  const tech   = searchParams?.tech   || '';

  // Default date = today ONLY on a completely fresh load (no URL params at all).
  // If any other filter is active but date was cleared, search across all dates.
  const hasAnyParam = searchParams && Object.keys(searchParams).length > 0;
  const date = searchParams?.date || (hasAnyParam ? '' : todayISO());

  // ── Build MongoDB filter ──
  const filter = {};
  if (client !== 'all') filter.clientName     = { $regex: client, $options: 'i' };
  if (acType !== 'all') filter.acType         = { $regex: acType, $options: 'i' };
  if (tech)             filter.technicianName = { $regex: tech,   $options: 'i' };

  // Date range filter (full day in local IST → UTC)
  if (date) {
    const dayStart = new Date(date + 'T00:00:00+05:30');
    const dayEnd   = new Date(date + 'T23:59:59+05:30');
    filter.createdAt = { $gte: dayStart, $lte: dayEnd };
  }

  const visits = await Visit.find(filter).sort({ createdAt: -1 }).lean();

  // ── Stats (always all-time, unfiltered) ──
  const totalVisits   = await Visit.countDocuments();
  const todayStart    = new Date(todayISO() + 'T00:00:00+05:30');
  const todayEnd      = new Date(todayISO() + 'T23:59:59+05:30');
  const todayVisits   = await Visit.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });
  const uniqueClients = await Visit.distinct('clientName');
  const techCount     = await Technician.countDocuments();

  const serialized = JSON.parse(JSON.stringify(visits));

  const stats = [
    { label: 'Total Visits Logged',  value: totalVisits,          icon: <Camera className="w-5 h-5" />,   color: 'bg-brand-500' },
    { label: "Today's Field Visits", value: todayVisits,          icon: <Calendar className="w-5 h-5" />,  color: 'bg-sky-500' },
    { label: 'Active Technicians',   value: techCount,            icon: <Users className="w-5 h-5" />,     color: 'bg-violet-500' },
    { label: 'Clients Serviced',     value: uniqueClients.length, icon: <Building2 className="w-5 h-5" />, color: 'bg-emerald-500' },
  ];

  // Human-readable date label
  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      })
    : 'All dates';

  const isFiltered = client !== 'all' || acType !== 'all' || tech;

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Field Service Operations Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track technician service flows and review live photographic proof.
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card bg-white p-3.5 sm:p-5 shadow-sm border-slate-200 flex items-start gap-2.5 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${s.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{s.value}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Visit Proofs & Logs ── */}
      <div className="space-y-4">

        {/* Filters */}
        <div className="card bg-white p-4 sm:p-5 shadow-sm border-slate-200">
          <DashboardFilters
            initialClient={client}
            initialAcType={acType}
            initialTech={tech}
            initialDate={date}
          />
        </div>

        {/* Results header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-xs font-semibold text-slate-600">
            {serialized.length === 0 ? (
              <span>No visits found</span>
            ) : (
              <>
                Showing <span className="text-brand-600 font-bold">{serialized.length}</span> visit{serialized.length !== 1 ? 's' : ''}
                {' · '}
                <span className="text-slate-500">{dateLabel}</span>
                {client !== 'all' && <> · Client: <strong className="text-slate-800">{client}</strong></>}
                {tech && <> · Tech: <strong className="text-slate-800">{tech}</strong></>}
              </>
            )}
          </p>
        </div>

        {/* Results */}
        {serialized.length === 0 ? (
          <div className="card p-16 text-center bg-white border-slate-200">
            <div className="text-5xl mb-3">📋</div>
            <h2 className="text-lg font-bold text-slate-700">No visits for this date</h2>
            <p className="text-slate-400 text-xs mt-1">
              {isFiltered
                ? 'Try clearing or modifying your filter options.'
                : date
                  ? `No service visits were logged on ${dateLabel}.`
                  : 'No service visits have been logged yet.'}
            </p>
          </div>
        ) : (
          <VisitGrid visits={serialized} />
        )}

      </div>
    </div>
  );
}
