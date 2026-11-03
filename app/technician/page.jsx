'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Building2, MapPin, Thermometer,
  Camera, CheckCircle2, AlertCircle, Upload, X, Loader2,
  ShieldCheck, ArrowRight, Clock, History, Sparkles, LogIn,
  Hash, Wrench, FileText,
} from 'lucide-react';
import PhotoModal from '../dashboard/PhotoModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const CLIENTS = [
  'Dmart',
  'Pantaloons',
  'Big Bazaar',
  'Reliance Trends',
  'Max Fashion',
  'Croma',
  'Vijay Sales',
  'Other',
];

const AC_TYPES = ['Ducted AC', 'Cassette AC', 'Split AC', 'VRV System'];

const BRANCH_MAP = {
  Dmart:            ['Baner Branch', 'Wakad Branch', 'Aundh Branch', 'Kothrud Branch', 'Hadapsar Branch', 'Other Branch'],
  Pantaloons:       ['MG Road', 'Camp Branch', 'Viman Nagar', 'Koregaon Park', 'Pimpri Branch', 'Other Branch'],
  'Big Bazaar':     ['Navi Peth', 'Kalyani Nagar', 'Nigdi Branch', 'Bhosari Branch', 'Other Branch'],
  'Reliance Trends':['FC Road', 'Satara Road', 'Bibvewadi Branch', 'Other Branch'],
  'Max Fashion':    ['Clover Center', 'SGS Mall Branch', 'Westend Mall', 'Other Branch'],
  Croma:            ['Aundh', 'Phoenix Mall', 'Kalyani Nagar', 'Other Branch'],
  'Vijay Sales':    ['Swargate', 'JM Road', 'Pimpri', 'Other Branch'],
  Other:            ['Main Branch', 'Branch 1', 'Custom Location'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PhotoPreview({ label, file, onClear, icon }) {
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="form-label flex items-center gap-1.5">{icon}{label}</span>
      <div className="relative upload-box min-h-[140px] overflow-hidden">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="w-full h-40 object-cover rounded-lg" />
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 w-7 h-7 bg-slate-900/70 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400 py-4">
            <Camera className="w-8 h-8 opacity-60" />
            <span className="text-xs font-medium">Tap to open camera or upload</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TechnicianPage() {
  const router = useRouter();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state (notice technicianName is locked to currentUser.name)
  const [form, setForm] = useState({
    clientName: '',
    branchLocation: '',
    customBranch: '',
    acType: '',
    serialNumber: '',
    workDone: '',
  });

  const [indoorPhoto,  setIndoorPhoto]  = useState(null);
  const [outdoorPhoto, setOutdoorPhoto] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | done | denied
  const [geoCoords, setGeoCoords] = useState(null);
  const [lastSubmittedVisit, setLastSubmittedVisit] = useState(null);
  const [dynamicClients, setDynamicClients] = useState([]);

  const indoorInputRef  = useRef(null);
  const outdoorInputRef = useRef(null);

  // ── Fetch current user on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();

    // Fetch dynamic clients
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (data.success && data.clients?.length > 0) {
          setDynamicClients(data.clients);
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
      }
    }
    loadClients();
  }, []);

  // Auto-attempt geolocation capture
  useEffect(() => {
    if (currentUser && geoStatus === 'idle') {
      captureGeo();
    }
  }, [currentUser]);

  // ── Field updater ──────────────────────────────────────────────────────────
  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'clientName') {
        next.branchLocation = '';
        next.customBranch = '';
      }
      return next;
    });
  };

  // ── Geolocation ───────────────────────────────────────────────────────────
  const captureGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('done');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setErrorMsg('You must be signed in as a technician to log a visit.');
      return;
    }

    const actualBranch = form.branchLocation === 'Other Branch'
      ? form.customBranch.trim()
      : form.branchLocation;

    // Validation
    if (!form.clientName)            return setErrorMsg('Please select a client.');
    if (!actualBranch)               return setErrorMsg('Please specify the branch location.');
    if (!form.acType)                return setErrorMsg('Please select an AC type.');
    if (!indoorPhoto)                return setErrorMsg('Please capture the indoor unit photo.');
    if (!outdoorPhoto)               return setErrorMsg('Please capture the outdoor unit photo.');

    setErrorMsg('');
    setStatus('loading');

    try {
      const fd = new FormData();
      // Technician info is already known from admin panel / auth session
      fd.append('technicianName', currentUser.name);
      if (currentUser.id) fd.append('technicianId', currentUser.id);

      fd.append('clientName',     form.clientName);
      fd.append('branchLocation', actualBranch);
      fd.append('acType',         form.acType);
      fd.append('serialNumber',   form.serialNumber.trim());
      fd.append('workDone',       form.workDone.trim());
      fd.append('indoorPhoto',    indoorPhoto);
      fd.append('outdoorPhoto',   outdoorPhoto);
      if (geoCoords) {
        fd.append('lat', geoCoords.lat);
        fd.append('lng', geoCoords.lng);
      }

      const res = await fetch('/api/visits', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed. Please try again.');

      setStatus('success');
      setLastSubmittedVisit(data.visit);
      // Reset form
      setForm({ clientName: '', branchLocation: '', customBranch: '', acType: '', serialNumber: '', workDone: '' });
      setIndoorPhoto(null);
      setOutdoorPhoto(null);
      if (indoorInputRef.current) indoorInputRef.current.value = '';
      if (outdoorInputRef.current) outdoorInputRef.current.value = '';

    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const allClients = dynamicClients.length > 0
    ? Array.from(new Set([...dynamicClients.map((c) => c.name), 'Other']))
    : CLIENTS;

  let branches = [];
  if (form.clientName) {
    const dynMatch = dynamicClients.find((c) => c.name.toLowerCase() === form.clientName.toLowerCase());
    if (dynMatch && dynMatch.branches?.length > 0) {
      branches = dynMatch.branches.map((b) => b.name);
    } else if (BRANCH_MAP[form.clientName]) {
      branches = [...BRANCH_MAP[form.clientName]];
    }
    if (!branches.includes('Other Branch')) {
      branches.push('Other Branch');
    }
  }

  const isLoading = status === 'loading';

  // ── Auth Loading Screen ─────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Checking technician session...</p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated State ───────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center animate-slide-up shadow-xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Technician Sign In Required</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Please sign in with your technician Email or Login ID and password provided by your admin to log visits.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login?redirect=/technician"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Technician Portal
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/20 to-sky-50/20 py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* ── Admin quick jump if admin logged in ── */}
        {currentUser.role === 'admin' && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              You are signed in as Admin ({currentUser.name})
            </span>
            <Link href="/dashboard" className="font-bold underline hover:text-sky-950 flex items-center gap-1">
              Admin Dashboard →
            </Link>
          </div>
        )}

        {/* ── Verified Technician Header (Name already set by admin) ── */}
        <div className="mb-6 card p-4 sm:p-5 bg-white/95 backdrop-blur-sm border-brand-200/80 shadow-md animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 truncate">{currentUser.name}</h2>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Technician
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span className="font-mono text-slate-600">@{currentUser.loginId}</span>
                  {currentUser.email && <span>• {currentUser.email}</span>}
                  {currentUser.mobile && <span>• {currentUser.mobile}</span>}
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-brand-600 font-medium transition-colors shrink-0"
            >
              Switch
            </Link>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-brand-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              Service visits logged under your account only
            </span>
            <Link
              href="/technician/my-visits"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-semibold hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              <History className="w-3.5 h-3.5" />
              My Visits
            </Link>
          </div>
        </div>

        {/* ── Success Banner ── */}
        {status === 'success' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-emerald-900">Service Visit Logged Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Proof photos uploaded to cloud and visit recorded under <strong>{currentUser.name}</strong>.
                </p>
                {lastSubmittedVisit && (
                  <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{lastSubmittedVisit.clientName} · {lastSubmittedVisit.branchLocation} ({lastSubmittedVisit.acType})</span>
                      <span className="text-[10px] text-emerald-600 font-mono">Just now</span>
                    </div>
                    {lastSubmittedVisit.serialNumber && (
                      <p className="text-[11px] text-emerald-800"><span className="font-semibold">Serial/Unit #:</span> {lastSubmittedVisit.serialNumber}</p>
                    )}
                    {lastSubmittedVisit.workDone && (
                      <p className="text-[11px] text-emerald-800"><span className="font-semibold">Work Done:</span> {lastSubmittedVisit.workDone}</p>
                    )}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                  >
                    Log Another Visit
                  </button>
                  <Link
                    href="/technician/my-visits"
                    className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    View My Visits <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 animate-shake shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-800">Submission Error</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ── Main Form Card ── */}
        <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-6 shadow-xl animate-slide-up">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              New Service Visit Entry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select client and complete equipment verification
            </p>
          </div>

          {/* STEP 1: Client Selection */}
          <div>
            <label className="form-label flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-brand-500" />
                1. Select Client *
              </span>
              <span className="text-[11px] text-brand-600 font-medium">Step 1 of 5</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {allClients.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setField('clientName', c)}
                  disabled={isLoading}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                    form.clientName === c
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Branch Location */}
          <div>
            <label className="form-label flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-brand-500" />
                2. Branch / Store Location *
              </span>
              <span className="text-[11px] text-brand-600 font-medium">Step 2 of 5</span>
            </label>

            {form.clientName ? (
              <div className="space-y-2 mt-1">
                <select
                  id="branchLocation"
                  className="form-select"
                  value={form.branchLocation}
                  onChange={(e) => setField('branchLocation', e.target.value)}
                  disabled={isLoading}
                  required
                >
                  <option value="">Choose {form.clientName} branch...</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                {form.branchLocation === 'Other Branch' && (
                  <input
                    type="text"
                    placeholder="Enter custom branch or address name"
                    value={form.customBranch}
                    onChange={(e) => setField('customBranch', e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 mt-1">
                Please select a client above to view its branches
              </div>
            )}
          </div>

          {/* STEP 3: AC Type */}
          <div>
            <label className="form-label flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Thermometer className="w-4 h-4 text-brand-500" />
                3. AC Equipment Type *
              </span>
              <span className="text-[11px] text-brand-600 font-medium">Step 3 of 5</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {AC_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  id={`acType-${type.replace(/\s/g, '-')}`}
                  onClick={() => setField('acType', type)}
                  disabled={isLoading}
                  className={`
                    px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-150
                    ${form.acType === type
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: AC Serial Number & Work Done */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Wrench className="w-4 h-4 text-brand-500" />
                4. Service Details & AC Serial / Unit Number
              </span>
              <span className="text-[11px] text-brand-600 font-medium">Step 4 of 5</span>
            </div>

            {/* Serial / Unit Number input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                AC Serial Number / Unit Number
              </label>
              <input
                type="text"
                placeholder="e.g. SN-8492014, Unit #3, Indoor-A"
                value={form.serialNumber}
                onChange={(e) => setField('serialNumber', e.target.value)}
                disabled={isLoading}
                className="form-input text-xs py-2.5"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter the unit identifier, barcode, or equipment serial number found on the AC label.
              </p>
            </div>

            {/* Work Done textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Work Done / Service Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Describe work performed (e.g. Air filter cleaning, coil jet wash, refrigerant gas refilled to 65 PSI, wiring checked, cooling temperature measured at 18°C)..."
                value={form.workDone}
                onChange={(e) => setField('workDone', e.target.value)}
                disabled={isLoading}
                className="form-input text-xs py-2 leading-relaxed resize-y"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Write details of maintenance, parts replaced, or service checks completed during this visit.
              </p>
            </div>
          </div>

          {/* STEP 5: Live Photo Captures */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Camera className="w-4 h-4 text-brand-500" />
                5. Live Photo Documentation *
              </span>
              <span className="text-[11px] text-brand-600 font-medium">Step 5 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Indoor Photo */}
              <div>
                <PhotoPreview
                  label="Indoor Unit Photo"
                  file={indoorPhoto}
                  onClear={() => {
                    setIndoorPhoto(null);
                    if (indoorInputRef.current) indoorInputRef.current.value = '';
                  }}
                  icon={<span className="text-sm">🏠</span>}
                />
                <input
                  ref={indoorInputRef}
                  id="indoorPhotoInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setIndoorPhoto(file);
                  }}
                  disabled={isLoading}
                />
                {!indoorPhoto && (
                  <button
                    type="button"
                    onClick={() => indoorInputRef.current?.click()}
                    disabled={isLoading}
                    className="btn-secondary w-full mt-2 text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Capture Indoor Photo
                  </button>
                )}
              </div>

              {/* Outdoor Photo */}
              <div>
                <PhotoPreview
                  label="Outdoor Unit Photo"
                  file={outdoorPhoto}
                  onClear={() => {
                    setOutdoorPhoto(null);
                    if (outdoorInputRef.current) outdoorInputRef.current.value = '';
                  }}
                  icon={<span className="text-sm">🌿</span>}
                />
                <input
                  ref={outdoorInputRef}
                  id="outdoorPhotoInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setOutdoorPhoto(file);
                  }}
                  disabled={isLoading}
                />
                {!outdoorPhoto && (
                  <button
                    type="button"
                    onClick={() => outdoorInputRef.current?.click()}
                    disabled={isLoading}
                    className="btn-secondary w-full mt-2 text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Capture Outdoor Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GPS Geolocation Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">GPS Location Tag</p>
                {geoStatus === 'done' && geoCoords ? (
                  <p className="text-[11px] text-emerald-600 font-medium font-mono truncate">
                    {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)} (Verified)
                  </p>
                ) : geoStatus === 'denied' ? (
                  <p className="text-[11px] text-amber-600">Location permission denied (Optional)</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Not captured yet</p>
                )}
              </div>
            </div>
            <button
              type="button"
              id="captureGeoBtn"
              onClick={captureGeo}
              disabled={isLoading || geoStatus === 'loading'}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all self-start sm:self-auto
                ${geoStatus === 'done'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }
              `}
            >
              {geoStatus === 'loading' ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Detecting…</span>
              ) : geoStatus === 'done' ? (
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Updated</span>
              ) : 'Detect GPS'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            id="submitVisitBtn"
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-base shadow-lg shadow-brand-500/25 active:scale-[0.99] transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading Photos & Saving Visit...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Submit AC Service Visit
              </span>
            )}
          </button>
        </form>

        {/* ── App-Mode Tip for Mobile Technicians ── */}
        <div className="mt-6 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold text-xs mb-1">
            <span className="text-base">📱</span>
            <span>Use like a Mobile App</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Add this portal to your mobile home screen. It opens like a native app with full screen and stays signed in for 30 days!
          </p>
          <p className="text-[10px] text-brand-600 font-medium mt-1.5">
            Android: Chrome Menu (⋮) → &quot;Install App&quot; &bull; iPhone: Safari Share (⎋) → &quot;Add to Home Screen&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
