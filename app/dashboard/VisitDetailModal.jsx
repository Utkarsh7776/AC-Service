'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  X, MapPin, User, Calendar, Thermometer, Building2,
  Camera, ExternalLink, ZoomIn, CheckCircle2, Clock,
  Hash, Wrench, FileText
} from 'lucide-react';

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function acTypeBadgeClass(type) {
  const map = {
    'Ducted AC':   'bg-blue-50 text-blue-700 border-blue-200',
    'Cassette AC': 'bg-sky-50 text-sky-700 border-sky-200',
    'Split AC':    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'VRV System':  'bg-violet-50 text-violet-700 border-violet-200',
  };
  return map[type] || 'bg-orange-50 text-orange-700 border-orange-200';
}

function FullPhotoModal({ src, label, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-xs sm:text-sm truncate mr-2">{label}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative w-full h-[55vh] sm:h-[75vh] min-h-[260px] sm:min-h-[420px] max-h-[80vh]">
          <Image src={src} alt={label} fill sizes="(max-width: 768px) 100vw, 900px" className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}

export default function VisitDetailModal({ visit, onClose }) {
  const [zoomPhoto, setZoomPhoto] = useState(null); // { src, label }

  if (!visit) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[110] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Camera className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Visit Details</h2>
                <p className="text-[11px] text-slate-400">{formatDate(visit.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Status + AC Type + Serial Number ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${acTypeBadgeClass(visit.acType)}`}>
                <Thermometer className="w-3 h-3" /> {visit.acType}
              </span>
              {visit.serialNumber && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                  <Hash className="w-3 h-3 text-amber-600" />
                  SN / Unit: {visit.serialNumber}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>

            {/* ── Client & Branch ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Client</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">{visit.clientName}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Branch</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{visit.branchLocation}</span>
                </div>
              </div>
            </div>

            {/* ── Technician ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {visit.technicianName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Technician</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{visit.technicianName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formatDate(visit.createdAt)}</span>
              </div>
            </div>

            {/* ── Work Performed / Service Description ── */}
            {visit.workDone ? (
              <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                  <Wrench className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>Work Done / Service Remarks</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {visit.workDone}
                </div>
              </div>
            ) : null}

            {/* ── GPS Location ── */}
            {visit.geoLocation?.lat ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono font-semibold text-xs sm:text-sm">
                    {visit.geoLocation.lat.toFixed(5)}, {visit.geoLocation.lng.toFixed(5)}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${visit.geoLocation.lat},${visit.geoLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  Open Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-400">
                📍 GPS location not recorded for this visit.
              </div>
            )}

            {/* ── Photos ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2.5">Service Proof Photos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Indoor */}
                <div className="space-y-1.5">
                  <div
                    className="relative h-48 sm:h-44 rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-200"
                    onClick={() => setZoomPhoto({ src: visit.indoorPhotoUrl, label: '🏠 Indoor Unit — ' + visit.branchLocation })}
                  >
                    <Image
                      src={visit.indoorPhotoUrl}
                      alt="Indoor unit"
                      fill
                      sizes="(max-width: 640px) 100vw, 280px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <ZoomIn className="w-7 h-7 text-white drop-shadow-lg" />
                    </div>
                    <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      🏠 Indoor
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center font-medium">Indoor Unit</p>
                </div>

                {/* Outdoor */}
                <div className="space-y-1.5">
                  <div
                    className="relative h-48 sm:h-44 rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-200"
                    onClick={() => setZoomPhoto({ src: visit.outdoorPhotoUrl, label: '🌿 Outdoor Unit — ' + visit.branchLocation })}
                  >
                    <Image
                      src={visit.outdoorPhotoUrl}
                      alt="Outdoor unit"
                      fill
                      sizes="(max-width: 640px) 100vw, 280px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <ZoomIn className="w-7 h-7 text-white drop-shadow-lg" />
                    </div>
                    <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      🌿 Outdoor
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center font-medium">Outdoor Unit</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">Click any photo to enlarge</p>
            </div>

          </div>
        </div>
      </div>

      {/* Full-size photo zoom */}
      {zoomPhoto && (
        <FullPhotoModal
          src={zoomPhoto.src}
          label={zoomPhoto.label}
          onClose={() => setZoomPhoto(null)}
        />
      )}
    </>
  );
}

