'use client';

import { useState } from 'react';
import {
  User, UserPlus, ArrowRight, Calendar, MapPin,
  Clock, ShieldCheck, CheckCircle2, AlertCircle, Copy,
  Check, Eye, Sparkles, RefreshCw, Layers, ExternalLink,
  ChevronRight, Building2, Thermometer, Filter, X, Camera,
  Edit3, Phone, Mail, Trash2, Power
} from 'lucide-react';
import PhotoModal from './PhotoModal';

export default function TechnicianTracker({ initialTechnicians = [], onRefresh }) {
  const [technicians, setTechnicians] = useState(initialTechnicians);
  const [selectedTechId, setSelectedTechId] = useState(initialTechnicians[0]?.id || null);
  const [techFlowData, setTechFlowData] = useState(null);
  const [flowLoading, setFlowLoading] = useState(false);

  // Create technician modal & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    loginId: '',
    password: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdSuccess, setCreatedSuccess] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Edit technician modal & form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    address: '',
    mobile: '',
    email: '',
    loginId: '',
    password: '',
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete technician modal state
  const [techToDelete, setTechToDelete] = useState(null); // { id, name }
  const [deleteTechLoading, setDeleteTechLoading] = useState(false);
  const [techBanner, setTechBanner] = useState(null); // { type: 'success' | 'error', text: '' }

  // Load flow when a technician is selected
  const handleSelectTech = async (techId) => {
    setSelectedTechId(techId);
    setFlowLoading(true);
    try {
      const res = await fetch(`/api/technicians/${techId}/flow`);
      const data = await res.json();
      if (data.success) {
        setTechFlowData(data);
      }
    } catch (e) {
      console.error('Failed to load flow:', e);
    } finally {
      setFlowLoading(false);
    }
  };

  // Initial load of first technician flow if available
  useState(() => {
    if (initialTechnicians.length > 0) {
      handleSelectTech(initialTechnicians[0].id);
    }
  });

  // Reload technicians list
  const refreshTechnicians = async () => {
    try {
      const res = await fetch('/api/technicians');
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.technicians);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate random password helper
  const handleSuggestPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'Tech@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pass }));
  };

  // Auto suggest loginId from email or name
  const handleEmailChange = (email) => {
    const prefix = email.split('@')[0].replace(/[^a-z0-9]/g, '');
    setCreateForm((prev) => ({
      ...prev,
      email,
      loginId: prev.loginId ? prev.loginId : prefix,
    }));
  };

  const handleNameChange = (name) => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setCreateForm((prev) => ({
      ...prev,
      name,
      loginId: prev.loginId ? prev.loginId : clean ? `${clean}01` : '',
    }));
  };

  // Create technician handler
  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create technician.');
      }

      setCreatedSuccess({
        name: data.technician.name,
        email: data.technician.email,
        mobile: data.technician.mobile,
        loginId: data.technician.loginId,
        password: createForm.password,
      });

      // Reset form
      setCreateForm({ name: '', mobile: '', email: '', loginId: '', password: '' });
      await refreshTechnicians();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal with selected technician
  const openEditModal = (tech) => {
    setEditForm({
      id: tech.id || tech._id,
      name: tech.name || '',
      address: tech.address || '',
      mobile: tech.mobile || '',
      email: tech.email || '',
      loginId: tech.loginId || '',
      password: '',
      isActive: tech.isActive !== false,
    });
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  // Save Edit Technician Handler
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await fetch(`/api/technicians/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update technician.');
      }

      setEditSuccess('Technician updated successfully!');
      await refreshTechnicians();
      // Reload flow if this was the selected tech
      if (editForm.id === selectedTechId) {
        handleSelectTech(editForm.id);
      }
      setTimeout(() => {
        setShowEditModal(false);
      }, 1000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete technician handler
  const confirmDeleteTech = async () => {
    if (!techToDelete) return;
    setDeleteTechLoading(true);
    const targetId = techToDelete.id;
    const targetName = techToDelete.name;

    try {
      const res = await fetch(`/api/technicians/${targetId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete technician.');
      }

      // Optimistically update list immediately
      setTechnicians((prev) => prev.filter((t) => (t.id || t._id) !== targetId));
      if (selectedTechId === targetId) {
        setSelectedTechId(null);
        setTechFlowData(null);
      }
      setTechToDelete(null);
      setTechBanner({ type: 'success', text: `Technician "${targetName}" deleted successfully.` });
      setTimeout(() => setTechBanner(null), 3000);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to delete technician:', e);
      setTechBanner({ type: 'error', text: e.message || 'Failed to delete technician.' });
      setTechToDelete(null);
    } finally {
      setDeleteTechLoading(false);
    }
  };

  const copyCredentials = (loginId, email, password) => {
    const text = `NextGenWebtech Solutions Technician Credentials:\nName: ${createdSuccess?.name}\nEmail: ${email}\nLogin ID: ${loginId}\nPassword: ${password}\nPortal Login: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const activeTech = technicians.find((t) => t.id === selectedTechId || t._id === selectedTechId) || technicians[0];

  return (
    <div className="space-y-6">

      {/* ── Notification Banner ── */}
      {techBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
            techBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {techBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span className="font-medium">{techBanner.text}</span>
          </div>
          <button type="button" onClick={() => setTechBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Technician Flow & Activity Tracking</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track each technician's real-time journey, manage login credentials, and edit technician records.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={refreshTechnicians}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Refresh technician list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreatedSuccess(null);
              setCreateError('');
            }}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-initial"
          >
            <UserPlus className="w-4 h-4" />
            Add New Technician
          </button>
        </div>
      </div>

      {/* ── Technicians Cards Grid ── */}
      {technicians.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No technicians registered yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first technician account with name, mobile, email, and password to enable field service logging.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4 py-2 px-4 text-xs font-semibold inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Technician
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {technicians.map((tech) => {
            const isSelected = tech.id === selectedTechId || tech._id === selectedTechId;
            return (
              <div
                key={tech.id || tech._id}
                onClick={() => handleSelectTech(tech.id || tech._id)}
                className={`card p-4 cursor-pointer transition-all border-2 text-left relative ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/30 shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{tech.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">@{tech.loginId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(tech);
                      }}
                      title="Edit technician info"
                      className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        tech.isActive !== false
                          ? 'bg-emerald-500 ring-4 ring-emerald-100'
                          : 'bg-red-400 ring-4 ring-red-100'
                      }`}
                      title={tech.isActive !== false ? 'Active' : 'Deactivated'}
                    />
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  {tech.email && (
                    <div className="flex items-center gap-1 truncate text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </div>
                  )}
                  {tech.mobile && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{tech.mobile}</span>
                    </div>
                  )}
                </div>

                {/* Visit summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Visits</span>
                    <span className="text-base font-extrabold text-slate-800">{tech.totalVisits || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today</span>
                    <span className="text-base font-extrabold text-brand-600">{tech.todayVisits || 0}</span>
                  </div>
                </div>

                {/* Selection badge */}
                {isSelected && (
                  <div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-100/60 py-1 rounded-lg">
                    <span>Tracking Flow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Active Technician Flow / Tracking Timeline ── */}
      {activeTech && (
        <div className="card p-4 sm:p-6 bg-white border-slate-200/90 shadow-md animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-md shrink-0">
                {activeTech.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{activeTech.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                    Technician
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
                    @{activeTech.loginId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTech.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {activeTech.isActive !== false ? 'Active' : 'Deactivated'}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                  {activeTech.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{activeTech.email}</span>
                    </span>
                  )}
                  {activeTech.mobile && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{activeTech.mobile}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons & Metrics */}
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              <button
                type="button"
                onClick={() => openEditModal(activeTech)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                Edit Technician Info
              </button>

              <button
                type="button"
                onClick={() => setTechToDelete({ id: activeTech.id || activeTech._id, name: activeTech.name })}
                className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                title="Delete technician"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {techFlowData?.summary && (
                <div className="px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold">
                  {techFlowData.summary.totalVisits} Total Visits
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {flowLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              <p className="text-xs font-medium">Loading technician journey...</p>
            </div>
          ) : !techFlowData?.flow || techFlowData.flow.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-sm font-semibold text-slate-600">No visits recorded for {activeTech.name} yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When {activeTech.name} signs in with email/login ID and logs visits, their live photos, GPS checks, and timestamped tracking flow will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-6 relative pl-6 sm:pl-8 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-slate-200">
              <div className="space-y-6">
                {techFlowData.flow.map((visit, index) => {
                  const visitNum = techFlowData.flow.length - index;
                  const dateStr = new Date(visit.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  });

                  return (
                    <div key={visit._id} className="relative group">
                      {/* Timeline node icon */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md ring-4 ring-white">
                        {visitNum}
                      </div>

                      {/* Content Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-brand-200 transition-all shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="badge badge-blue font-bold text-xs">{visit.clientName}</span>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-brand-500" />
                              {visit.branchLocation}
                            </span>
                            <span className="badge badge-sky text-[11px]">{visit.acType}</span>
                            {visit.serialNumber && (
                              <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                SN: {visit.serialNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>

                        {/* Work Done remarks */}
                        {visit.workDone && (
                          <div className="mb-3 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700">
                            <span className="font-bold text-slate-800 text-[11px] block mb-0.5">Work Done:</span>
                            <p className="leading-relaxed text-slate-600 whitespace-pre-line">{visit.workDone}</p>
                          </div>
                        )}

                        {/* Photos proofs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                          {/* Indoor Photo */}
                          <PhotoModal src={visit.indoorPhotoUrl} label="Indoor Unit Proof" visitId={visit._id} type="indoor">
                            <div className="relative h-28 rounded-xl bg-slate-200 overflow-hidden cursor-zoom-in group/img border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={visit.indoorPhotoUrl}
                                alt="Indoor unit"
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <span className="absolute bottom-1.5 left-1.5 text-white text-[10px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                                🏠 Indoor Unit
                              </span>
                            </div>
                          </PhotoModal>

                          {/* Outdoor Photo */}
                          <PhotoModal src={visit.outdoorPhotoUrl} label="Outdoor Unit Proof" visitId={visit._id} type="outdoor">
                            <div className="relative h-28 rounded-xl bg-slate-200 overflow-hidden cursor-zoom-in group/img border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={visit.outdoorPhotoUrl}
                                alt="Outdoor unit"
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <span className="absolute bottom-1.5 left-1.5 text-white text-[10px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                                🌿 Outdoor Unit
                              </span>
                            </div>
                          </PhotoModal>

                          {/* Geolocation metadata box */}
                          <div className="col-span-2 p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Location & Verification
                              </span>
                              {visit.geoLocation?.lat ? (
                                <div className="text-xs text-slate-700 flex items-center gap-1 font-mono">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{visit.geoLocation.lat.toFixed(4)}, {visit.geoLocation.lng.toFixed(4)}</span>
                                  <a
                                    href={`https://www.google.com/maps?q=${visit.geoLocation.lat},${visit.geoLocation.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-auto text-brand-600 hover:text-brand-800 text-[11px] font-sans font-semibold flex items-center gap-0.5"
                                  >
                                    View Map <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">GPS coordinates recorded</p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Verified Technician:</span>
                              <strong className="text-slate-800">{visit.technicianName}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE TECHNICIAN MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 sm:p-7 shadow-2xl bg-white animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Technician</h3>
                <p className="text-xs text-slate-500">Enter full details to provision field technician</p>
              </div>
            </div>

            {/* Success state */}
            {createdSuccess ? (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Account Created Successfully!
                  </div>
                  <p>Technician <strong>{createdSuccess.name}</strong> can now log in using these credentials:</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-1.5 relative">
                  <p className="text-slate-400 text-[10px] uppercase font-sans font-bold">Technician Credentials</p>
                  <p><span className="text-brand-300">Name:</span> {createdSuccess.name}</p>
                  <p><span className="text-brand-300">Email:</span> {createdSuccess.email}</p>
                  <p><span className="text-brand-300">Mobile:</span> {createdSuccess.mobile}</p>
                  <p><span className="text-brand-300">Login ID:</span> {createdSuccess.loginId}</p>
                  <p><span className="text-brand-300">Password:</span> {createdSuccess.password}</p>
                  <p><span className="text-brand-300">Role:</span> technician (default)</p>
                  <button
                    type="button"
                    onClick={() => copyCredentials(createdSuccess.loginId, createdSuccess.email, createdSuccess.password)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey ? 'Copied to Clipboard!' : 'Copy Credentials'}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedSuccess(null);
                      setCreateForm({ name: '', mobile: '', email: '', loginId: '', password: '' });
                    }}
                    className="btn-secondary w-full py-2.5 text-xs font-semibold"
                  >
                    Create Another
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-primary w-full py-2.5 text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTechnician} className="mt-5 space-y-3.5">
                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Role Indicator */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Role:</span>
                  <span className="font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/60">
                    Technician (Default)
                  </span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technician Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={createForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="form-input text-xs py-2"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="form-input text-xs py-2"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={createForm.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="form-input text-xs py-2"
                  />
                </div>

                {/* Login ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login ID (Username)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank"
                      value={createForm.loginId}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, loginId: e.target.value.toLowerCase().trim() }))}
                      className="form-input text-xs pl-7 py-2 font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestPassword}
                      className="text-[11px] text-brand-600 hover:underline font-semibold"
                    >
                      Generate Password
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Min 4 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="form-input text-xs py-2 font-mono"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary w-full py-2.5 text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {createLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Save & Create Technician
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT TECHNICIAN MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 sm:p-7 shadow-2xl bg-white animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Technician Information</h3>
                <p className="text-xs text-slate-500">Update personal info, contact, and account status</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technician Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs py-2"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                  className="form-input text-xs py-2"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="form-input text-xs py-2"
                />
              </div>

              {/* Login ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login ID (Username)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={editForm.loginId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, loginId: e.target.value.toLowerCase().trim() }))}
                    className="form-input text-xs pl-7 py-2 font-mono"
                  />
                </div>
              </div>

              {/* Reset Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to keep existing password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="form-input text-xs py-2 font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editForm.isActive === true}
                      onChange={() => setEditForm((prev) => ({ ...prev, isActive: true }))}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editForm.isActive === false}
                      onChange={() => setEditForm((prev) => ({ ...prev, isActive: false }))}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Deactivated
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary w-full py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {editLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE TECHNICIAN CONFIRMATION MODAL ── */}
      {techToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6 shadow-2xl bg-white animate-scale-up relative">
            <button
              type="button"
              disabled={deleteTechLoading}
              onClick={() => setTechToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">Delete Technician?</h3>
            <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{techToDelete.name}</strong>? Their login will be disabled and they will no longer be able to log field visits.
            </p>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                disabled={deleteTechLoading}
                onClick={() => setTechToDelete(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTechLoading}
                onClick={confirmDeleteTech}
                className="flex-1 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {deleteTechLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
