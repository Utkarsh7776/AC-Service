'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, MapPin, Search, Calendar, Filter,
  Building2, Thermometer, CheckCircle2, Loader2, X, SlidersHorizontal,
} from 'lucide-react';
import PhotoModal from '../../dashboard/PhotoModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a JS Date to "YYYY-MM-DD" for <input type="date"> */
function toInputDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Check if two dates are the same calendar day */
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

const AC_TYPES = ['Ducted AC', 'Cassette AC', 'Split AC', 'VRV System'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyVisitsPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── All visits data ───────────────────────────────────────────────────────
  const [allVisits, setAllVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const today = toInputDate(new Date());
  const [filterDate, setFilterDate] = useState(today);     // default = today
  const [filterClient, setFilterClient] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterAcType, setFilterAcType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch auth on mount ───────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setCurrentUser(data.user || null);
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // ── Fetch visits once user is known ──────────────────────────────────────
  const fetchVisits = useCallback(async (user) => {
    if (!user) return;
    setVisitsLoading(true);
    try {
      const url = user.id
        ? `/api/visits?technicianId=${user.id}`
        : `/api/visits?tech=${encodeURIComponent(user.name)}`;
      const res = await fetch(url);
      const data = await res.json();
      setAllVisits(data.visits || []);
    } catch (e) {
      console.error('Failed to fetch visits:', e);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchVisits(currentUser);
  }, [currentUser, fetchVisits]);

  // ── Derived: unique clients from fetched visits ───────────────────────────
  const uniqueClients = useMemo(
    () => [...new Set(allVisits.map((v) => v.clientName))].sort(),
    [allVisits]
  );

  // ── Filtered visits ───────────────────────────────────────────────────────
  const filteredVisits = useMemo(() => {
    return allVisits.filter((v) => {
      const visitDate = new Date(v.createdAt);

      // Date filter
      if (filterDate) {
        const targetDate = new Date(filterDate + 'T00:00:00');
        if (!isSameDay(visitDate, targetDate)) return false;
      }

      // Client filter
      if (filterClient && filterClient !== 'all') {
        if (!v.clientName.toLowerCase().includes(filterClient.toLowerCase())) return false;
      }

      // Branch filter (free-text search)
      if (filterBranch) {
        if (!v.branchLocation.toLowerCase().includes(filterBranch.toLowerCase())) return false;
      }

      // AC type filter
      if (filterAcType && filterAcType !== 'all') {
        if (v.acType !== filterAcType) return false;
      }

      return true;
    });
  }, [allVisits, filterDate, filterClient, filterBranch, filterAcType]);

  // ── Stats for today (always) ──────────────────────────────────────────────
  const todayCount = useMemo(
    () => allVisits.filter((v) => isSameDay(new Date(v.createdAt), new Date())).length,
    [allVisits]
  );

  const activeFilterCount = [
    filterDate !== today,
    !!filterClient,
    !!filterBranch,
    !!filterAcType,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setFilterDate(today);
    setFilterClient('');
    setFilterBranch('');
    setFilterAcType('');
  }

  // ── Loading / unauth screens ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center p-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <p className="text-slate-600 font-semibold">Please sign in to view your visits.</p>
          <Link href="/login?redirect=/technician/my-visits" className="btn-primary mt-4 inline-block text-sm">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/20 to-sky-50/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Back + Title ── */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <Link
            href="/technician"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <Clock className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="truncate">My Service Visits</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {currentUser.name} · {allVisits.length} total logs
            </p>
          </div>
          {/* Today badge */}
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 sm:px-2.5 py-1 rounded-lg border border-brand-200/60">
              {todayCount} Today
            </span>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <div className="card bg-white p-4 mb-5 shadow-sm space-y-3">
          {/* Top row: date picker + toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
              <input
                type="date"
                value={filterDate}
                max={today}
                onChange={(e) => setFilterDate(e.target.value)}
                className="form-input text-xs flex-1 min-w-0 py-1.5"
              />
              {filterDate !== today && (
                <button
                  onClick={() => setFilterDate(today)}
                  className="text-[11px] text-brand-600 font-semibold hover:underline whitespace-nowrap"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="space-y-2 pt-2 border-t border-slate-100">

              {/* Client search */}
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="form-select text-xs flex-1 py-1.5"
                >
                  <option value="">All Clients</option>
                  {uniqueClients.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Branch search */}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="relative flex-1">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search branch / location..."
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="form-input text-xs pl-7 py-1.5 w-full"
                  />
                  {filterBranch && (
                    <button
                      onClick={() => setFilterBranch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* AC Type */}
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {AC_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterAcType(filterAcType === type ? '' : type)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                        filterAcType === type
                          ? 'bg-brand-50 border-brand-400 text-brand-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result summary */}
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Showing <strong className="text-slate-700">{filteredVisits.length}</strong> visit{filteredVisits.length !== 1 ? 's' : ''}
            {filterDate && (
              <span> on <strong className="text-slate-700">{new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
            )}
          </div>
        </div>

        {/* ── Visits List ── */}
        {visitsLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading your visits...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="card p-10 text-center bg-white border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No visits found</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeFilterCount > 0 || filterDate !== today
                ? 'Try adjusting your filters.'
                : 'No visits logged today yet. Log one from the form.'}
            </p>
            {(activeFilterCount > 0 || filterDate !== today) && (
              <button
                onClick={clearAllFilters}
                className="mt-3 text-xs text-brand-600 font-semibold hover:underline"
              >
                Reset to today's visits
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVisits.map((v) => {
              const dateStr = new Date(v.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
              });

              return (
                <div
                  key={v._id}
                  className="card p-4 bg-white border border-slate-200/90 shadow-sm hover:shadow transition-shadow animate-fade-in"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-blue font-bold text-xs">{v.clientName}</span>
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" />
                        {v.branchLocation}
                      </span>
                      <span className="badge badge-sky text-[11px]">{v.acType}</span>
                      {v.serialNumber && (
                        <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          SN: {v.serialNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Work Done remarks */}
                  {v.workDone && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Work Done / Service Remarks:</span>
                      <p className="leading-relaxed whitespace-pre-line text-slate-600">{v.workDone}</p>
                    </div>
                  )}

                  {/* Photos + GPS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
                    {/* Indoor Photo */}
                    <PhotoModal src={v.indoorPhotoUrl} label="Indoor Unit Proof" visitId={v._id} type="indoor">
                      <div className="relative h-24 rounded-lg bg-slate-200 overflow-hidden cursor-zoom-in border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.indoorPhotoUrl}
                          alt="Indoor unit proof"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 text-white text-[9px] font-semibold bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                          🏠 Indoor
                        </span>
                      </div>
                    </PhotoModal>

                    {/* Outdoor Photo */}
                    <PhotoModal src={v.outdoorPhotoUrl} label="Outdoor Unit Proof" visitId={v._id} type="outdoor">
                      <div className="relative h-24 rounded-lg bg-slate-200 overflow-hidden cursor-zoom-in border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.outdoorPhotoUrl}
                          alt="Outdoor unit proof"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 text-white text-[9px] font-semibold bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                          🌿 Outdoor
                        </span>
                      </div>
                    </PhotoModal>

                    {/* GPS Box */}
                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          GPS Verification
                        </span>
                        {v.geoLocation?.lat ? (
                          <div className="font-mono text-[11px] text-slate-600">
                            <span>{v.geoLocation.lat.toFixed(4)}, {v.geoLocation.lng.toFixed(4)}</span>
                            <a
                              href={`https://www.google.com/maps?q=${v.geoLocation.lat},${v.geoLocation.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-brand-600 hover:underline text-[10px] font-sans font-semibold mt-0.5"
                            >
                              View Map ↗
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not recorded</span>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

