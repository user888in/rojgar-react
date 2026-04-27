import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Building2, Building, ShieldCheck, Hourglass, Ban, Filter, 
  Search, Plus, CheckCircle, Eye, ChevronLeft, ChevronRight, 
  UploadCloud, X, ShieldAlert, Clock, AlertCircle, AlertTriangle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─── Design tokens ─── */
const T = {
  navy:   '#0b2239',
  teal:   '#0d9488',
  teal2:  '#14b8a6',
  border: '#e8ecf1',
  bg:     '#f2f5f9',
  text:   '#0f172a',
  sub:    '#64748b',
};

const AdminCompanies = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};

  // -- Page State --
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ total: '--', verified: '--', pending: '--', suspended: '--' });
  const [loading, setLoading] = useState(true);
  
  // -- Filters & Pagination --
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [busyRows, setBusyRows] = useState(new Set());

  // -- Modals State --
  const [suspendModal, setSuspendModal] = useState({ open: false, id: null, name: '', reason: '', error: false, saving: false });
  const [viewModal, setViewModal] = useState({ open: false, data: null, loading: false, error: false });
  const [createModal, setCreateModal] = useState({ open: false, name: '', desc: '', file: null, preview: '', nameErr: false, fileErr: false, saving: false, alert: null });
  
  // -- Toasts --
  const [toasts, setToasts] = useState([]);

  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';

  // Helper: Format Date
  const formatDate = (d) => {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  };

  // Helper: Toast
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Stats
  const loadStats = useCallback(async () => {
    try {
      const [resAll, resVerified, resPending, resSuspended] = await Promise.all([
        authFetch(`${API_BASE_URL}/companies?page=0&size=1`),
        authFetch(`${API_BASE_URL}/companies?page=0&size=1&status=VERIFIED`),
        authFetch(`${API_BASE_URL}/companies?page=0&size=1&status=PENDING`),
        authFetch(`${API_BASE_URL}/companies?page=0&size=1&status=SUSPENDED`)
      ]);
      setStats({
        total: resAll.ok ? (await resAll.json()).totalElements : '--',
        verified: resVerified.ok ? (await resVerified.json()).totalElements : '--',
        pending: resPending.ok ? (await resPending.json()).totalElements : '--',
        suspended: resSuspended.ok ? (await resSuspended.json()).totalElements : '--',
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, [authFetch]);

  // Load Companies
  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size });
      if (searchKeyword) params.set('search', searchKeyword);
      if (statusFilter) params.set('status', statusFilter);

      const res = await authFetch(`${API_BASE_URL}/companies?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      setCompanies(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchKeyword, statusFilter, authFetch]);

  useEffect(() => {
    loadStats();
    loadCompanies();
  }, [loadStats, loadCompanies]);

  // --- ACTIONS ---
  
  const handleVerify = async (id) => {
    if (!window.confirm("Verify this company?")) return;
    setBusyRows(prev => new Set(prev).add(id));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/companies/${id}/activate`, {
        method: "PATCH", body: JSON.stringify({ status: "VERIFIED" })
      });
      if (!res.ok) throw new Error();
      showToast("Company verified successfully ✓");
      loadCompanies();
      loadStats();
    } catch {
      showToast("Failed to verify company", "danger");
    } finally {
      setBusyRows(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleSuspend = async () => {
    if (!suspendModal.reason.trim()) {
      setSuspendModal(prev => ({ ...prev, error: true }));
      return;
    }
    setSuspendModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/companies/${suspendModal.id}/suspend`, { 
        method: "PATCH", body: JSON.stringify({ status: "SUSPENDED", reason: suspendModal.reason.trim() }) 
      });
      if (!res.ok) throw new Error();
      showToast("Company suspended successfully", "warning");
      setSuspendModal({ open: false, id: null, name: '', reason: '', error: false, saving: false });
      loadCompanies();
      loadStats();
    } catch {
      showToast("Failed to suspend company", "danger");
      setSuspendModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleView = async (id) => {
    setViewModal({ open: true, data: null, loading: true, error: false });
    try {
      const res = await authFetch(`${API_BASE_URL}/companies/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViewModal({ open: true, data, loading: false, error: false });
    } catch {
      setViewModal({ open: true, data: null, loading: false, error: true });
    }
  };

  const handleCreateCompany = async () => {
    if (!createModal.name.trim()) {
      setCreateModal(prev => ({ ...prev, nameErr: true }));
      return;
    }
    setCreateModal(prev => ({ ...prev, saving: true, alert: null }));
    const formData = new FormData();
    formData.append("companyName", createModal.name.trim());
    formData.append("description", createModal.desc.trim());
    if (createModal.file) formData.append("logo", createModal.file);

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/company/create`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      showToast("Company created successfully ✓");
      setCreateModal({ open: false, name: '', desc: '', file: null, preview: '', nameErr: false, fileErr: false, saving: false, alert: null });
      loadCompanies();
      loadStats();
    } catch (e) {
      setCreateModal(prev => ({ ...prev, saving: false, alert: e.message || "Failed to create company." }));
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 2 * 1024 * 1024) {
        setCreateModal(prev => ({ ...prev, fileErr: true }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setCreateModal(prev => ({ ...prev, file, preview: ev.target.result, fileErr: false }));
      reader.readAsDataURL(file);
    }
  };

  // --- RENDER HELPERS ---
  
  const renderPaginationInfo = () => {
    if (totalElements === 0) return "No results found";
    const from = (page * size) + 1;
    const to = Math.min((page + 1) * size, totalElements);
    return `Showing ${from}–${to} of ${totalElements} companies`;
  };

  const getPaginationArray = () => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= page - 2 && i <= page + 2)) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="relative">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Companies</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">Verify, suspend and manage all company accounts</p>
          </div>
          <div className="flex items-center gap-3">
            {isSubAdmin && (
              <div className="inline-flex items-center gap-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-xs font-semibold px-3.5 py-1.5 rounded-full">
                <ShieldAlert size={14} /> Sub Admin Mode
              </div>
            )}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-white border border-[#e8ecf1] rounded-full pl-3 pr-2.5 py-1.5 text-sm font-semibold text-[#0f172a] cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[rgba(13,148,136,0.3)]"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white text-xs font-bold flex items-center justify-center">
                {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <span>{user?.fullName || user?.username || 'Admin'}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0b2239] to-[#163554] rounded-[14px] p-6 mb-6 flex items-center gap-3.5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="w-[46px] h-[46px] rounded-xl bg-[rgba(13,148,136,0.18)] border border-[rgba(13,148,136,0.3)] flex items-center justify-center flex-shrink-0">
          <Building2 size={22} color={T.teal2} />
        </div>
        <div className="relative">
          <h4 className="text-white font-extrabold text-xl m-0">Companies</h4>
          <p className="text-white/50 text-sm mt-1 mb-0">
            Verify, suspend and manage all company accounts on the platform
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Companies', value: stats.total, color: '#0ea5e9', bg: '#f0f9ff', icon: <Building size={20} />, text: 'Show all', filter: '' },
          { label: 'Verified', value: stats.verified, color: '#16a34a', bg: '#f0fdf4', icon: <ShieldCheck size={20} />, text: 'Filter verified', filter: 'VERIFIED', valueColor: '#16a34a' },
          { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fffbeb', icon: <Hourglass size={20} />, text: 'Filter pending', filter: 'PENDING', valueColor: '#d97706' },
          { label: 'Suspended', value: stats.suspended, color: '#dc2626', bg: '#fef2f2', icon: <Ban size={20} />, text: 'Filter suspended', filter: 'SUSPENDED', valueColor: '#dc2626' },
        ].map((stat, idx) => (
          <div 
            key={idx}
            onClick={() => { setStatusFilter(stat.filter); setSearchInput(''); }}
            className="bg-white rounded-[14px] p-5 border border-[#e8ecf1] cursor-pointer transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg group"
          >
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--stat-color)] to-[var(--stat-color)]/50 transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100" style={{ '--stat-color': stat.color }} />
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[11.5px] font-semibold text-[#64748b] uppercase tracking-wide mb-1.5">{stat.label}</div>
                <div className="text-[30px] font-extrabold leading-none" style={{ color: stat.valueColor || T.text }}>{stat.value}</div>
              </div>
              <div className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-3 text-xs font-bold flex items-center gap-1" style={{ color: stat.color }}>
              <Filter size={11} /> {stat.text}
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden">
        {/* Table card header */}
        <div className="p-5 border-b border-[#e8ecf1] flex items-center justify-between flex-wrap gap-3">
          <span className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
            <Building2 size={16} color={T.teal} /> All Companies
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-1.5 bg-white border-[1.5px] border-[#e8ecf1] rounded-[9px] px-3 py-1.5 transition-[border-color] duration-200 focus-within:border-[#0d9488]">
              <Search size={13} color="#94a3b8" className="flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search company name…" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none outline-none text-[13px] text-[#0f172a] bg-transparent w-[180px]"
              />
            </div>
            {/* Status */}
            <select 
              className="bg-white border-[1.5px] border-[#e8ecf1] rounded-[9px] px-3 py-1.5 text-[13px] text-[#0f172a] outline-none cursor-pointer transition-[border-color] duration-200 focus:border-[#0d9488]"
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            {/* Per page */}
            <select 
              className="bg-white border-[1.5px] border-[#e8ecf1] rounded-[9px] px-3 py-1.5 text-[13px] text-[#0f172a] outline-none cursor-pointer transition-[border-color] duration-200 focus:border-[#0d9488]"
              value={size} 
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
          <button 
            className="inline-flex items-center gap-1.5 bg-[#0d9488] text-white border-none rounded-[9px] px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-[#0f766e]"
            onClick={() => setCreateModal({ open: true, name: '', desc: '', file: null, preview: '', nameErr: false, fileErr: false, saving: false, alert: null })}
          >
            <Plus size={14} /> Create Company
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {['#', 'Company', 'Description', 'Status', 'Registered', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[#64748b] text-[11px] font-bold uppercase tracking-wider text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="align-middle">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-[#94a3b8]">
                  <div className="inline-block w-5 h-5 border-[3px] border-current border-t-transparent text-[#0d9488] rounded-full animate-spin mr-2 align-middle"></div>
                  Loading…
                </td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-[#94a3b8]">
                  <Building2 size={36} className="block mx-auto mb-2 opacity-50" />
                  No companies found
                </td></tr>
              ) : (
                companies.map((c, i) => {
                  const isVerified = c.verificationStatus === 'VERIFIED';
                  const isSuspended = c.verificationStatus === 'SUSPENDED';
                  const isBusy = busyRows.has(c.id);
                  const firstChar = (c.companyName || '?')[0].toUpperCase();
                  
                  return (
                    <tr key={c.id} className="border-b border-[#f1f5f9] transition-[background] duration-150 hover:bg-[#fafbfc]">
                      <td className="px-4 py-3 text-[#64748b]">{(page * size) + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {c.companyLogo ? (
                            <img src={c.companyLogo} alt={firstChar} className="min-w-[36px] h-9 rounded-lg object-contain border border-[#e2e8f0] bg-[#f8fafc] flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white items-center justify-center font-bold text-sm flex-shrink-0" style={{ display: c.companyLogo ? 'none' : 'flex' }}>
                            {firstChar}
                          </div>
                          <strong className="text-[13.5px] text-[#0f172a]">{c.companyName || 'N/A'}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#94a3b8] text-[12.5px] max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {c.description || <span className="text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isVerified && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">Verified</span>}
                        {isSuspended && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">Suspended</span>}
                        {(!isVerified && !isSuspended) && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">{c.verificationStatus || 'Pending'}</span>}
                      </td>
                      <td className="px-4 py-3 text-[#94a3b8] text-[12.5px]">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button disabled={isVerified || isBusy} onClick={() => handleVerify(c.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border-[1.5px] border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#dcfce7] hover:border-[#86efac]">
                            <CheckCircle size={14} /> Verify
                          </button>
                          <button disabled={isSuspended || isBusy} onClick={() => setSuspendModal({ open: true, id: c.id, name: c.companyName || 'this company', reason: '', error: false, saving: false })} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border-[1.5px] border-[#fecaca] bg-[#fef2f2] text-[#dc2626] transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#fee2e2] hover:border-[#fca5a5]">
                            <Ban size={14} /> Suspend
                          </button>
                          <button onClick={() => handleView(c.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] transition-all duration-150 hover:border-[#cbd5e1] hover:text-[#0f172a]" title="View Details">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-[#e8ecf1] flex justify-between items-center flex-wrap gap-2.5">
          <div className="text-sm text-[#64748b]">
            {renderPaginationInfo()}
          </div>
          <nav>
            <ul className="flex items-center gap-0.5 list-none m-0 p-0">
              <li>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center justify-center min-w-8 h-8 rounded-lg border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] text-[12.5px] font-semibold px-2 transition-all duration-150 disabled:opacity-38 disabled:cursor-not-allowed disabled:text-[#cbd5e1] hover:border-[#0d9488] hover:text-[#0d9488]"
                >
                  <ChevronLeft size={14} />
                </button>
              </li>
              {getPaginationArray().map((p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${p}`}>
                      <li>
                        <span className="flex items-center justify-center min-w-8 h-8 text-[#64748b] text-[12.5px]">…</span>
                      </li>
                      <li>
                        <button
                          onClick={() => setPage(p)}
                          className="flex items-center justify-center min-w-8 h-8 rounded-lg border-[1.5px] bg-white text-[#64748b] text-[12.5px] font-semibold px-2 transition-all duration-150 hover:border-[#0d9488] hover:text-[#0d9488]"
                          style={{ borderColor: p === page ? T.teal : T.border, background: p === page ? T.teal : '#fff', color: p === page ? '#fff' : T.sub }}
                        >
                          {p + 1}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                }
                return (
                  <li key={p}>
                    <button
                      onClick={() => setPage(p)}
                      className="flex items-center justify-center min-w-8 h-8 rounded-lg border-[1.5px] text-[12.5px] font-semibold px-2 transition-all duration-150 hover:border-[#0d9488] hover:text-[#0d9488]"
                      style={{ borderColor: p === page ? T.teal : T.border, background: p === page ? T.teal : '#fff', color: p === page ? '#fff' : T.sub }}
                    >
                      {p + 1}
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center justify-center min-w-8 h-8 rounded-lg border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] text-[12.5px] font-semibold px-2 transition-all duration-150 disabled:opacity-38 disabled:cursor-not-allowed disabled:text-[#cbd5e1] hover:border-[#0d9488] hover:text-[#0d9488]"
                >
                  <ChevronRight size={14} />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Suspend Modal */}
      {suspendModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setSuspendModal(prev => ({...prev, open: false})) }}>
          <div className="bg-white rounded-[20px] max-w-[460px] w-[calc(100%-32px)] p-7 shadow-[0_24px_64px_rgba(11,34,57,0.18)]">
            <div className="mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#d97706]">
                <Ban size={28} />
              </div>
            </div>
            <div className="text-lg font-extrabold text-[#0f172a] mb-2">Suspend Company</div>
            <p className="text-[13.5px] text-[#64748b] mb-4 leading-relaxed">
              Please provide a reason for suspending <strong>{suspendModal.name}</strong>. This may be shared with the company.
            </p>
            <div className="mb-5">
              <label className="text-[11px] font-bold tracking-wider uppercase text-[#64748b] block mb-2">Reason for Suspension</label>
              <textarea 
                rows="3" 
                placeholder="e.g. Violation of platform terms, fraudulent activity…"
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal(prev => ({...prev, reason: e.target.value, error: false}))}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[13.5px] text-[#0f172a] outline-none resize-vertical transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:ring-[3px] focus:ring-[rgba(13,148,136,0.1)]"
              />
              {suspendModal.error && (
                <div className="text-[#dc2626] text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> Please enter a reason before suspending.
                </div>
              )}
            </div>
            <div className="flex gap-2.5 mt-5 justify-end">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-4.5 py-2 text-sm font-semibold border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5e1]" onClick={() => setSuspendModal(prev => ({...prev, open: false}))}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-4.5 py-2 text-sm font-semibold border-[1.5px] border-[#fecaca] bg-[#fef2f2] text-[#dc2626] transition-all duration-200 hover:bg-[#fee2e2] hover:border-[#fca5a5] disabled:opacity-50" disabled={suspendModal.saving} onClick={handleSuspend}>
                <Ban size={16} /> {suspendModal.saving ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Company Modal */}
      {viewModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setViewModal({ open: false, data: null, loading: false, error: false }) }}>
          <div className="bg-white rounded-[20px] max-w-[600px] w-[calc(100%-32px)] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(11,34,57,0.18)]">
            <div className="flex items-start justify-between px-6 py-5 bg-gradient-to-r from-[#0b2239] to-[#163554] border-b border-[#e8ecf1]">
              <div className="flex-1">
                <p className="text-base font-extrabold text-white m-0">Company Details</p>
                <p className="text-white/60 text-[12.5px] mt-1 mb-0">{viewModal.loading ? 'Fetching information…' : 'Company profile'}</p>
              </div>
              <button className="w-8 h-8 rounded-lg border-none bg-white/10 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/20"
                      onClick={() => setViewModal({ open: false, data: null, loading: false, error: false })}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-6 overflow-y-auto flex-1">
              {viewModal.loading ? (
                 <div className="text-center py-10 text-[#94a3b8]">
                   <div className="inline-block w-5 h-5 border-[3px] border-current border-t-transparent text-[#0d9488] rounded-full animate-spin mr-2 align-middle"></div> Loading…
                 </div>
              ) : viewModal.error ? (
                <div className="text-center py-10 text-[#dc2626]">
                  <AlertTriangle size={32} className="block mx-auto mb-2" />
                  Failed to load company details.
                </div>
              ) : viewModal.data && (
                <>
                  <div className="flex items-center gap-4 pb-5 border-b border-[#f1f5f9]">
                    {viewModal.data.companyLogo ? (
                       <img src={viewModal.data.companyLogo} alt="logo" className="w-16 h-16 rounded-xl object-contain border border-[#e2e8f0] bg-[#f8fafc] flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white items-center justify-center font-bold text-xl flex-shrink-0" style={{ display: viewModal.data.companyLogo ? 'none' : 'flex' }}>
                       {(viewModal.data.companyName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-[#0f172a]">{viewModal.data.companyName || 'N/A'}</div>
                      <div className="mt-2">
                        {viewModal.data.verificationStatus === 'VERIFIED' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">Verified</span>}
                        {viewModal.data.verificationStatus === 'SUSPENDED' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">Suspended</span>}
                        {viewModal.data.verificationStatus !== 'VERIFIED' && viewModal.data.verificationStatus !== 'SUSPENDED' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">{viewModal.data.verificationStatus || 'Pending'}</span>}
                      </div>
                    </div>
                  </div>
                  {viewModal.data.description && (
                    <div className="mt-[18px]">
                      <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        About <span className="flex-1 h-px bg-[#e8ecf1]"></span>
                      </div>
                      <div className="bg-[#f8fafc] border border-[#e8ecf1] border-l-[3px] border-l-[#0d9488] rounded-xl p-4 text-[13.5px] text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                        {viewModal.data.description}
                      </div>
                    </div>
                  )}
                  <div className="mt-[18px] flex items-center gap-2.5 px-3.5 py-3 bg-[#f8fafc] border border-[#e8ecf1] rounded-xl">
                    <Clock size={15} color={T.teal} className="flex-shrink-0" />
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748b]">Registered</div>
                      <div className="text-[13.5px] text-[#0f172a] mt-0.5">{formatDate(viewModal.data.createdAt)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#e8ecf1] bg-[#fafbfc] flex-shrink-0">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-4.5 py-2 text-sm font-semibold border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5e1]" onClick={() => setViewModal({ open: false, data: null, loading: false, error: false })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setCreateModal(prev => ({...prev, open: false})) }}>
          <div className="bg-white rounded-[20px] max-w-[560px] w-[calc(100%-32px)] overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)]">
            <div className="flex items-start justify-between px-6 py-5 bg-gradient-to-r from-[#0b2239] to-[#163554] border-b border-[#e8ecf1]">
              <div className="flex-1">
                <p className="text-base font-extrabold text-white m-0">Create New Company</p>
                <p className="text-white/60 text-[12.5px] mt-1 mb-0">Fill in the details to register a company</p>
              </div>
              <button className="w-8 h-8 rounded-lg border-none bg-white/10 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/20"
                      onClick={() => setCreateModal(prev => ({...prev, open: false}))}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-6 bg-white max-h-[65vh] overflow-y-auto">
              {createModal.alert && (
                <div className="px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 mb-4 bg-[#fef2f2] border-[1.5px] border-[#fecaca] text-[#dc2626]">
                  <AlertCircle size={16} /> <span>{createModal.alert}</span>
                </div>
              )}
              <div className="mb-4">
                <label className="text-[11px] font-bold tracking-wider uppercase text-[#64748b] block mb-2">Company Name <span className="text-[#ef4444]">*</span></label>
                <input 
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[13.5px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 bg-white focus:border-[#0d9488] focus:ring-[3px] focus:ring-[rgba(13,148,136,0.1)]" 
                  type="text" 
                  placeholder="Company Name" 
                  value={createModal.name}
                  onChange={(e) => setCreateModal(prev => ({...prev, name: e.target.value, nameErr: false}))}
                />
                {createModal.nameErr && (
                  <div className="text-[#dc2626] text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> Company name is required.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="text-[11px] font-bold tracking-wider uppercase text-[#64748b] block mb-2">Description</label>
                <textarea 
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[13.5px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 bg-white min-h-[80px] resize-vertical focus:border-[#0d9488] focus:ring-[3px] focus:ring-[rgba(13,148,136,0.1)]"
                  rows="3" 
                  placeholder="Brief description of the company…"
                  value={createModal.desc}
                  onChange={(e) => setCreateModal(prev => ({...prev, desc: e.target.value.substring(0, 500)}))}
                />
                <div className="text-right text-[11.5px] text-[#64748b] mt-1">
                  <span>{createModal.desc.length}</span> / 500
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[11px] font-bold tracking-wider uppercase text-[#64748b] block mb-2">Company Logo</label>
                <div 
                  className="border-2 rounded-xl p-5 text-center cursor-pointer transition-all duration-200"
                  style={{
                    borderStyle: createModal.preview ? 'solid' : 'dashed',
                    borderColor: createModal.preview ? T.teal : '#d1d5db',
                    background: createModal.preview ? 'rgba(13,148,136,0.04)' : '#fafbfc',
                  }}
                  onClick={() => document.getElementById('ccLogoFileInput').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.background = 'rgba(13,148,136,0.04)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafbfc'; }}
                  onDrop={handleFileDrop}
                >
                  <input type="file" id="ccLogoFileInput" accept="image/*" className="hidden" onChange={handleFileDrop} />
                  
                  {!createModal.preview ? (
                    <div>
                      <UploadCloud size={28} className="text-[#cbd5e1] block mx-auto mb-2" />
                      <p className="text-[13.5px] font-semibold text-[#374151] m-0 mb-1">Click to upload or drag & drop</p>
                      <p className="text-xs text-[#64748b] m-0">PNG, JPG, SVG · Max 2 MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-[60px] h-[60px] rounded-xl border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img src={createModal.preview} alt="preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] m-0 whitespace-nowrap overflow-hidden text-ellipsis">{createModal.file?.name}</p>
                        <p className="text-xs text-[#64748b] mt-1 mb-0">{(createModal.file?.size / 1024).toFixed(1)} KB</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={(e) => { e.stopPropagation(); document.getElementById('ccLogoFileInput').click(); }} className="text-xs font-semibold text-[#0d9488] bg-[rgba(13,148,136,0.15)] border border-[rgba(13,148,136,0.2)] rounded px-2.5 py-1 cursor-pointer">Change</button>
                          <button onClick={(e) => { e.stopPropagation(); setCreateModal(prev => ({...prev, file: null, preview: '', fileErr: false})); }} className="text-xs font-semibold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded px-2.5 py-1 cursor-pointer">Remove</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {createModal.fileErr && (
                  <div className="text-[#dc2626] text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> File too large. Max size is 2 MB.
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#e8ecf1] bg-[#fafbfc]">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-4.5 py-2 text-sm font-semibold border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5e1]" onClick={() => setCreateModal(prev => ({...prev, open: false}))}>Cancel</button>
              <button className="inline-flex items-center gap-1.5 bg-[#0d9488] text-white border-none rounded-[9px] px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f766e]" disabled={createModal.saving} onClick={handleCreateCompany}>
                <Plus size={15} /> {createModal.saving ? 'Creating…' : 'Create Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toasts Container */}
      <div className="fixed bottom-[90px] right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(t => {
          const toastClasses = {
            success: 'bg-[#f0fdf4] border-[1.5px] border-[#bbf7d0] text-[#15803d]',
            danger: 'bg-[#fef2f2] border-[1.5px] border-[#fecaca] text-[#dc2626]',
            warning: 'bg-[#fffbeb] border-[1.5px] border-[#fde68a] text-[#d97706]',
          };
          const className = toastClasses[t.type] || toastClasses.success;
          return (
            <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-semibold shadow-lg min-w-[240px] max-w-[320px] animate-[toastSlideIn_0.3s_ease] ${className}`}>
              <CheckCircle size={16} /> {t.msg}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AdminCompanies;
