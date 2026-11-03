'use client';

import { useState } from 'react';
import { Layers, Grid, Users, ShieldCheck, Building2 } from 'lucide-react';
import TechnicianTracker from './TechnicianTracker';
import ClientManager from './ClientManager';
import DashboardFilters from './DashboardFilters';

export default function DashboardTabs({
  technicians = [],
  visits = [],
  clientFilter = 'all',
  acTypeFilter = 'all',
  techFilter = '',
  visitCards,
}) {
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' | 'clients' | 'visits'

  return (
    <div className="space-y-6">
      {/* ── Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 py-3 px-1 sm:px-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'tracking'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Technician Flow & Management</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs">
              {technicians.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 py-3 px-1 sm:px-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'clients'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clients & Branches</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            className={`flex items-center gap-2 py-3 px-1 sm:px-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'visits'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>All Visit Proofs & Logs</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
              {visits.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'tracking' && (
        <TechnicianTracker initialTechnicians={technicians} />
      )}

      {activeTab === 'clients' && (
        <ClientManager />
      )}

      {activeTab === 'visits' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="card p-5 bg-white border-slate-200 shadow-sm">
            <DashboardFilters
              initialClient={clientFilter}
              initialAcType={acTypeFilter}
              initialTech={techFilter}
            />
          </div>

          {/* Visit Cards from Server */}
          {visitCards}
        </div>
      )}
    </div>
  );
}
