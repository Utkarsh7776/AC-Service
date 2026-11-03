'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Plus, MapPin, Trash2, RefreshCw, CheckCircle2,
  AlertCircle, Search, Layers, X, Pencil, Phone, Mail
} from 'lucide-react';

export default function ClientManager({ onClientAdded }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClient, setEditClient] = useState(null); // { id, name }
  const [editForm, setEditForm] = useState({ name: '', mobile: '', email: '' });
  const [editBranches, setEditBranches] = useState([]);
  const [editBranchInput, setEditBranchInput] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete modal & banner state
  const [clientToDelete, setClientToDelete] = useState(null); // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text: '' }

  // Add form state
  const [form, setForm] = useState({ name: '', mobile: '', email: '', city: 'Pune' });
  const [branches, setBranches] = useState([]);
  const [branchInput, setBranchInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('Client name is required.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          branchNames: branches.join(','),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add client.');
      }

      setSuccessMsg(`Client "${form.name}" added successfully!`);
      setForm({ name: '', mobile: '', email: '', city: 'Pune' });
      setBranches([]);
      setBranchInput('');
      await fetchClients();
      if (onClientAdded) onClientAdded();

      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddBranch = () => {
    const val = branchInput.trim();
    if (!val) return;
    if (branches.includes(val)) {
      setErrorMsg('Branch already added.');
      return;
    }
    setBranches((prev) => [...prev, val]);
    setBranchInput('');
    setErrorMsg('');
  };

  const openEditModal = (client) => {
    setEditClient(client);
    setEditForm({
      name: client.name || '',
      mobile: client.mobile || '',
      email: client.email || '',
    });
    setEditBranches((client.branches || []).map((b) => b.name));
    setEditBranchInput('');
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditAddBranch = () => {
    const val = editBranchInput.trim();
    if (!val) return;
    if (editBranches.includes(val)) {
      setEditError('Branch already added.');
      return;
    }
    setEditBranches((prev) => [...prev, val]);
    setEditBranchInput('');
    setEditError('');
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Client name is required.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const res = await fetch(`/api/clients?id=${editClient.id || editClient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          mobile: editForm.mobile.trim(),
          email: editForm.email.trim(),
          branchNames: editBranches.join(','),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client.');
      setEditSuccess(`Client "${editForm.name}" updated!`);
      await fetchClients();
      if (onClientAdded) onClientAdded();
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess('');
      }, 1200);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleteLoading(true);
    const targetId = clientToDelete.id;
    const targetName = clientToDelete.name;

    try {
      const res = await fetch(`/api/clients?id=${targetId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete client.');
      }

      // Instant optimistic removal from UI
      setClients((prev) => prev.filter((c) => (c.id || c._id) !== targetId));
      setClientToDelete(null);
      setBanner({ type: 'success', text: `Client "${targetName}" deleted successfully.` });
      setTimeout(() => setBanner(null), 3000);
      if (onClientAdded) onClientAdded();
    } catch (e) {
      console.error('Failed to delete client:', e);
      setBanner({ type: 'error', text: e.message || 'Failed to delete client.' });
      setClientToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.branches?.some((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ── Notification Banner ── */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span className="font-medium">{banner.text}</span>
          </div>
          <button type="button" onClick={() => setBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Client & Branch Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Add service contracts, retail clients, and branch locations serviced by field technicians.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchClients}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Refresh clients list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setErrorMsg('');
              setSuccessMsg('');
              setBranches([]);
              setBranchInput('');
            }}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-md w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by client, branch, mobile, or email..."
          className="form-input text-xs pl-10 py-2.5 w-full"
        />
      </div>

      {/* ── Clients Grid ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          <p className="text-xs font-medium">Loading clients and branches...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No clients found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'Try a different search keyword.' : 'Click "Add New Client" above to register your first corporate account.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id || client._id}
              className="card p-5 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-sm shadow-sm border border-sky-100 shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{client.name}</h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {client.branches?.length || 0} configured branch{client.branches?.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Edit client"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientToDelete({ id: client.id || client._id, name: client.name })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Branches List */}
                <div className="mt-3.5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Branch Locations
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(client.branches || []).map((branch, idx) => (
                      <span
                        key={branch.id || branch.name + idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg"
                      >
                        <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                        {branch.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Info (Mobile & Email) */}
                {(client.mobile || client.email) && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                    {client.mobile && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <a href={`tel:${client.mobile}`} className="hover:text-brand-600 transition-colors font-medium">
                          {client.mobile}
                        </a>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <a href={`mailto:${client.email}`} className="hover:text-brand-600 transition-colors truncate">
                          {client.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Service Contract</span>
                <span className="text-emerald-600 font-semibold">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD CLIENT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="card max-w-md w-full p-5 sm:p-7 shadow-2xl bg-white animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Client</h3>
                <p className="text-xs text-slate-500">Register new enterprise client & branch locations</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddClient} className="space-y-4">
              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks, Kalyan Jewellers"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs py-2"
                />
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={form.mobile}
                    onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="form-input text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. contact@client.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="form-input text-xs py-2"
                  />
                </div>
              </div>

              {/* Branch Locations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Locations
                </label>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Baner Road Branch"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBranch();
                      }
                    }}
                    className="form-input text-xs py-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Branch chips */}
                {branches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {branches.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-lg"
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        {b}
                        <button
                          type="button"
                          onClick={() => setBranches((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-0.5 text-sky-400 hover:text-red-500 transition-colors"
                          title="Remove branch"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-2">
                  Add each branch individually. Press Enter or click Add. These will be selectable by technicians when logging visits.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary w-full py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── EDIT CLIENT MODAL ── */}
      {showEditModal && editClient && (
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Client</h3>
                <p className="text-xs text-slate-500">Update client name and branch locations</p>
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

            <form onSubmit={handleUpdateClient} className="space-y-4">
              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks, Kalyan Jewellers"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs py-2"
                />
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="form-input text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. contact@client.com"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="form-input text-xs py-2"
                  />
                </div>
              </div>

              {/* Branch Locations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Locations
                </label>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Baner Road Branch"
                    value={editBranchInput}
                    onChange={(e) => setEditBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleEditAddBranch();
                      }
                    }}
                    className="form-input text-xs py-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleEditAddBranch}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Branch chips */}
                {editBranches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {editBranches.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-lg"
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        {b}
                        <button
                          type="button"
                          onClick={() => setEditBranches((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-0.5 text-sky-400 hover:text-red-500 transition-colors"
                          title="Remove branch"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-2">
                  Add or remove branches. Existing visits won't be affected.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
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
      {/* ── DELETE CLIENT CONFIRMATION MODAL ── */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6 shadow-2xl bg-white animate-scale-up relative">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setClientToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">Delete Client?</h3>
            <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{clientToDelete.name}</strong> and all its configured branches? This action cannot be undone.
            </p>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setClientToDelete(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteClient}
                className="flex-1 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {deleteLoading ? (
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
