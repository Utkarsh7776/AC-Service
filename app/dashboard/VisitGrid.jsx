'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, User, Calendar } from 'lucide-react';
import VisitDetailModal from './VisitDetailModal';

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function acTypeBadge(type) {
  const map = {
    'Ducted AC':   'badge-blue',
    'Cassette AC': 'badge-sky',
    'Split AC':    'badge-green',
    'VRV System':  'badge-purple',
  };
  return map[type] || 'badge-orange';
}

function VisitCard({ visit, onClick }) {
  return (
    <article
      onClick={onClick}
      className="card overflow-hidden flex flex-col group animate-fade-in bg-white border-slate-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Photos Row */}
      <div className="grid grid-cols-2 gap-0.5 bg-slate-100">
        <div className="relative h-36 bg-slate-200 overflow-hidden">
          <Image
            src={visit.indoorPhotoUrl}
            alt={`Indoor unit at ${visit.branchLocation}`}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            🏠 Indoor
          </span>
        </div>
        <div className="relative h-36 bg-slate-200 overflow-hidden">
          <Image
            src={visit.outdoorPhotoUrl}
            alt={`Outdoor unit at ${visit.branchLocation}`}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            🌿 Outdoor
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-blue font-bold text-xs">{visit.clientName}</span>
          <span className={`${acTypeBadge(visit.acType)} text-xs font-semibold`}>{visit.acType}</span>
          {visit.serialNumber && (
            <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
              SN: {visit.serialNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-700 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          {visit.branchLocation}
        </div>

        {visit.workDone && (
          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100 leading-snug">
            <strong className="text-slate-800">Work:</strong> {visit.workDone}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
          <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span>Technician: <strong className="text-slate-800">{visit.technicianName}</strong></span>
        </div>

        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0" />
            {formatDate(visit.createdAt)}
          </span>
          <span className="text-emerald-600 font-semibold font-sans">✓ Verified</span>
        </div>
      </div>

      {/* Click hint */}
      <div className="bg-slate-50 border-t border-slate-100 py-1.5 text-center text-[10px] text-slate-400 font-medium group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
        Click to view full details
      </div>
    </article>
  );
}

export default function VisitGrid({ visits }) {
  const [selectedVisit, setSelectedVisit] = useState(null);

  if (visits.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visits.map((v) => (
          <VisitCard key={v._id} visit={v} onClick={() => setSelectedVisit(v)} />
        ))}
      </div>

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </>
  );
}

