'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Filter, X, CalendarDays } from 'lucide-react';

const CLIENTS = ['all', 'Dmart', 'Pantaloons', 'Big Bazaar', 'Reliance Trends', 'Max Fashion', 'Croma', 'Vijay Sales', 'Other'];
const AC_TYPES = ['all', 'Ducted AC', 'Cassette AC', 'Split AC', 'VRV System'];

export default function DashboardFilters({ initialClient, initialAcType, initialTech, initialDate }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [client, setClient] = useState(initialClient || 'all');
  const [acType, setAcType] = useState(initialAcType || 'all');
  const [tech,   setTech]   = useState(initialTech   || '');
  const [date,   setDate]   = useState(initialDate   || '');

  const applyFilters = useCallback((newClient, newAcType, newTech, newDate) => {
    const params = new URLSearchParams();
    if (newClient && newClient !== 'all') params.set('client', newClient);
    if (newAcType && newAcType !== 'all') params.set('acType', newAcType);
    if (newTech)                          params.set('tech',   newTech);
    if (newDate)                          params.set('date',   newDate);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  const handleClient = (val) => { setClient(val); applyFilters(val, acType, tech, date); };
  const handleAcType = (val) => { setAcType(val); applyFilters(client, val, tech, date); };
  const handleDate   = (val) => { setDate(val);   applyFilters(client, acType, tech, val); };
  const handleTech   = (val) => {
    setTech(val);
    clearTimeout(window.__techTimeout);
    window.__techTimeout = setTimeout(() => applyFilters(client, acType, val, date), 250);
  };

  const hasFilters = client !== 'all' || acType !== 'all' || tech !== '' || date !== '';

  const clearAll = () => {
    setClient('all'); setAcType('all'); setTech(''); setDate('');
    router.push(pathname);
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Date */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Technician search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by technician name…"
            value={tech}
            onChange={(e) => handleTech(e.target.value)}
            className="form-input pl-10 pr-10"
          />
          {tech && (
            <button
              onClick={() => handleTech('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date filter */}
        <div className="sm:w-48">
          <div className="relative">
            <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => handleDate(e.target.value)}
              className="form-input pl-10 pr-3 w-full"
              title="Filter by date"
            />
            {date && (
              <button
                onClick={() => handleDate('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Client + AC Type */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="form-label text-xs">
            <Filter className="w-3 h-3 inline mr-1" />Client
          </label>
          <select
            className="form-select text-sm"
            value={client}
            onChange={(e) => handleClient(e.target.value)}
          >
            {CLIENTS.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Clients' : c}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="form-label text-xs">
            <Filter className="w-3 h-3 inline mr-1" />AC Type
          </label>
          <select
            className="form-select text-sm"
            value={acType}
            onChange={(e) => handleAcType(e.target.value)}
          >
            {AC_TYPES.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All AC Types' : a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter tags */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Active filters:</span>
          {date && (
            <span className="badge badge-blue gap-1">
              📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              <button onClick={() => handleDate('')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {client !== 'all' && (
            <span className="badge badge-sky gap-1">
              Client: {client}
              <button onClick={() => handleClient('all')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {acType !== 'all' && (
            <span className="badge badge-purple gap-1">
              {acType}
              <button onClick={() => handleAcType('all')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {tech && (
            <span className="badge badge-green gap-1">
              Tech: {tech}
              <button onClick={() => handleTech('')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
