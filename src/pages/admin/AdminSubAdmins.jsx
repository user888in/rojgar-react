import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Hourglass,
  Search,
  Plus,
  XCircle,
  Pencil,
  CheckCircle,
  Ban, // For slash-circle / deactivate
  X,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  Lock,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';

const AdminSubAdmins = () => {
  const { authFetch, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  
  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // Data State
  const [allSubAdmins, setAllSubAdmins] = useState([]);
  const [filteredSubAdmins, setFilteredSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: '--', active: '--', inactive: '--' });

  // Modals State
  const initialCreateState = { fullname: '', username: '', email: '', phone: '', password: '' };
  const [createModal, setCreateModal] = useState({ open: false, data: { ...initialCreateState }, saving: false, error: null });
  const [editModal, setEditModal] = useState({ open: false, id: null, data: { fullname: '', username: '', email: '', phone: '' }, saving: false, error: null });
  
  // UI States
  const [showPw, setShowPw] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of the subadmin being activated/deactivated

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Compute Stats
  const computeStats = useCallback((data) => {
    const total = data.length;
    const active = data.filter((s) => s.userStatus === 'ACTIVE').length;
    const inactive = total - active;
    setStats({ total, active, inactive });
  }, []);

  // Fetch Data
  const loadSubAdmins = useCallback(async () => {
    if (isSubAdmin) return; // Sub admins don't fetch this data
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/sub-admins`);
      if (!res.ok) throw new Error('Failed to load sub-admins');
      const data = await res.json();
      const content = Array.isArray(data) ? data : data.content || [];
      setAllSubAdmins(content);
      setFilteredSubAdmins(content);
      computeStats(content);
    } catch (err) {
      console.error('SubAdmins load error:', err);
      setError('Failed to load. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, computeStats, isSubAdmin]);

  useEffect(() => {
    loadSubAdmins();
  }, [loadSubAdmins]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply Filters
  useEffect(() => {
    const kw = debouncedSearch.toLowerCase().trim();
    let result = allSubAdmins;

    if (kw) {
      result = result.filter((s) => 
        (s.fullName || '').toLowerCase().includes(kw) ||
        (s.username || '').toLowerCase().includes(kw) ||
        (s.email || '').toLowerCase().includes(kw)
      );
    }

    if (statusFilter) {
      result = result.filter((s) => s.userStatus === statusFilter);
    }

    setFilteredSubAdmins(result);
    setPage(1);
  }, [debouncedSearch, statusFilter, allSubAdmins]);

  // Actions
  const handleCreate = async () => {
    const { fullname, username, email, phone, password } = createModal.data;
    setCreateModal(prev => ({ ...prev, error: null }));

    if (!fullname || !username || !email || !password) {
      setCreateModal(prev => ({ ...prev, error: 'Please fill all required fields.' }));
      return;
    }

    setCreateModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/sub-admins`, {
        method: 'POST',
        body: JSON.stringify({ fullname, username, email, password, phone: phone ? Number(phone) : null })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create sub-admin');
      }
      setCreateModal({ open: false, data: { ...initialCreateState }, saving: false, error: null });
      addToast('Sub-admin created successfully', 'success');
      loadSubAdmins();
    } catch (err) {
      setCreateModal(prev => ({ ...prev, error: err.message || 'Failed to create', saving: false }));
    }
  };

  const handleEdit = async () => {
    const { fullname, username, email, phone } = editModal.data;
    setEditModal(prev => ({ ...prev, error: null }));

    setEditModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/sub-admins/${editModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ fullname, username, email, phone: phone ? Number(phone) : null })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update sub-admin');
      }
      setEditModal({ open: false, id: null, data: { fullname: '', username: '', email: '', phone: '' }, saving: false, error: null });
      addToast('Sub-admin updated successfully', 'success');
      loadSubAdmins();
    } catch (err) {
      setEditModal(prev => ({ ...prev, error: err.message || 'Failed to update', saving: false }));
    }
  };

  const handleStatusChange = async (id, activate) => {
    if (!window.confirm(`${activate ? 'Activate' : 'Deactivate'} this sub-admin?`)) return;
    
    setActionLoading(id);
    try {
      const endpoint = activate ? 'activate' : 'deactivate';
      const status = activate ? 'ACTIVE' : 'INACTIVE';
      const res = await authFetch(`${API_BASE_URL}/admin/sub-admins/${id}/${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      addToast(`Sub-admin ${activate ? 'activated' : 'deactivated'}`, activate ? 'success' : 'warning');
      loadSubAdmins();
    } catch {
      addToast(`Failed to ${activate ? 'activate' : 'deactivate'}`, 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  // Helpers
  const formatDate = (d) => {
    return d
      ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';
  };

  const getStatusPill = (status) => {
    if (status === "ACTIVE") return <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f0fdf4] text-[#16a34a]"><span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" />Active</span>;
    if (status === "PENDING") return <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fffbeb] text-[#d97706]"><span className="w-[6px] h-[6px] rounded-full bg-[#f59e0b] shrink-0" />Pending</span>;
    if (status === "SUSPENDED") return <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fef2f2] text-[#dc2626]"><span className="w-[6px] h-[6px] rounded-full bg-[#ef4444] shrink-0" />Suspended</span>;
    return <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f8fafc] text-[#64748b]"><span className="w-[6px] h-[6px] rounded-full bg-[#94a3b8] shrink-0" />{status || "Inactive"}</span>;
  };

  // Password Strength Logic
  const getPwStrength = (pw) => {
    if (!pw) return { score: 0, label: '', bars: ['bg-[#e2e8f0]', 'bg-[#e2e8f0]', 'bg-[#e2e8f0]'], color: '' };
    const score = [
      pw.length >= 8,
      /[A-Z]/.test(pw),
      /[0-9]/.test(pw),
      /[^A-Za-z0-9]/.test(pw)
    ].filter(Boolean).length;

    if (score <= 2) return { score, label: 'Weak', bars: ['bg-[#ef4444]', 'bg-[#e2e8f0]', 'bg-[#e2e8f0]'], color: 'text-[#ef4444]' };
    if (score === 3) return { score, label: 'Medium', bars: ['bg-[#f59e0b]', 'bg-[#f59e0b]', 'bg-[#e2e8f0]'], color: 'text-[#f59e0b]' };
    return { score, label: 'Strong', bars: ['bg-[#22c55e]', 'bg-[#22c55e]', 'bg-[#22c55e]'], color: 'text-[#22c55e]' };
  };

  const pwStrength = getPwStrength(createModal.data.password);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSubAdmins.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, filteredSubAdmins.length);
  const currentData = filteredSubAdmins.slice(start, end);

  const renderPaginationBtns = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '…') {
        pages.push('…');
      }
    }

    return (
      <div className="flex gap-[4px]">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, idx) => (
          p === '…' ? (
            <button key={`ell-${idx}`} disabled className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] text-[12.5px] font-semibold flex items-center justify-center opacity-40 cursor-not-allowed">
              …
            </button>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-[32px] h-[32px] rounded-[8px] border-[1.5px] text-[12.5px] font-semibold flex items-center justify-center transition-all font-['DM_Sans',sans-serif] ${
                p === page
                  ? 'bg-[#0d9488] border-[#0d9488] text-white'
                  : 'bg-[#f8fafc] text-[#64748b] border-[#e8ecf1] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] cursor-pointer'
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // RESTRICTED VIEW
  if (isSubAdmin) {
    return (
      <div className="font-['DM_Sans',sans-serif] text-[#0f172a]">
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[60px_40px] text-center shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <div className="w-[80px] h-[80px] rounded-[20px] bg-[#fef2f2] flex items-center justify-center text-[#dc2626] mx-auto mb-[20px]">
            <Lock size={36} className="fill-current" />
          </div>
          <h5 className="text-[18px] font-extrabold text-[#0f172a] mb-[8px]">Access Restricted</h5>
          <p className="text-[#64748b] text-[14px] max-w-[360px] mx-auto mb-[24px] leading-[1.6]">
            Sub Admins cannot access this section. Only Administrators can manage sub-admin accounts.
          </p>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all no-underline"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="font-['DM_Sans',sans-serif] text-[#0f172a] relative min-h-[80vh]">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Sub Admins</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">Manage sub administrator accounts and permissions</p>
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
                {initials}
              </div>
              <span>{fullName}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[8px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-[10px] p-[12px_18px] rounded-[12px] text-white text-[13.5px] font-['DM_Sans',sans-serif] shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[240px] border-l-[3px] border-white/30 animate-[slideDown_0.3s_ease] ${
              t.type === 'success' ? 'bg-[#15803d]' : t.type === 'warning' ? 'bg-[#b45309]' : 'bg-[#b91c1c]'
            }`}
          >
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'danger' && <XCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] px-[32px] py-[28px] mb-[24px] text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative z-10 flex items-center gap-2">
          <Shield size={22} className="fill-current" /> Sub Admins
        </h4>
        <p className="text-[13.5px] text-white/55 m-0 relative z-10">
          Manage sub administrator accounts and their permissions
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[24px]">
        {/* Total */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#0ea5e9] to-[#7dd3fc]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Total Sub Admins</div>
              <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.total}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#eff6ff] text-[#3b82f6]">
              <Shield size={20} className="fill-current" />
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#22c55e] to-[#86efac]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Active</div>
              <div className="text-[26px] font-extrabold text-[#16a34a] leading-none">{stats.active}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f0fdf4] text-[#22c55e]">
              <ShieldCheck size={20} className="fill-current" />
            </div>
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#f59e0b] to-[#fcd34d]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Inactive / Pending</div>
              <div className="text-[26px] font-extrabold text-[#f59e0b] leading-none">{stats.inactive}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#fffbeb] text-[#f59e0b]">
              <Hourglass size={20} className="fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        {/* Header & Filters */}
        <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <Shield size={16} className="text-[#0d9488]" /> All Sub Admins
          </span>
          <div className="flex items-center gap-[10px] flex-wrap">
            <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] transition-all focus-within:border-[#0d9488]">
              <Search size={13} className="text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search name, email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] font-['DM_Sans',sans-serif] text-[#0f172a] placeholder-[#aab] w-full min-w-[150px]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[8px] bg-[#f8fafc] text-[#64748b] outline-none cursor-pointer font-['DM_Sans',sans-serif] transition-all focus:border-[#0d9488]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button
              onClick={() => {
                setCreateModal({ open: true, data: { ...initialCreateState }, saving: false, error: null });
                setShowPw(false);
              }}
              className="inline-flex items-center gap-[6px] px-[18px] py-[8px] bg-[#0d9488] text-white border-none rounded-[99px] text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)]"
            >
              <Plus size={14} /> Add Sub Admin
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-[13.5px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {['#', 'Name', 'Username', 'Email', 'Phone', 'Status', 'Registered', 'Actions'].map((h, i) => (
                  <th key={i} className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] whitespace-nowrap border-b border-[#f1f5f9]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-[40px] text-[#94a3b8]">
                    <div className="flex items-center justify-center gap-[8px]">
                      <Loader2 size={20} className="animate-spin text-[#0d9488]" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="text-center p-[32px] text-[#dc2626]">
                    <AlertTriangle size={28} className="mx-auto mb-[8px] text-[#ef4444]" />
                    Failed to load. Please refresh.
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-[40px] text-[#94a3b8]">
                    <Shield size={36} className="mx-auto mb-[8px] text-[#cbd5e1]" />
                    No sub-admins found.
                  </td>
                </tr>
              ) : (
                currentData.map((sa, i) => (
                  <tr key={sa.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="p-[12px_16px] text-[#64748b] align-middle border-b border-[#f1f5f9]">{start + i + 1}</td>
                    <td className="p-[12px_16px] align-middle border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                          {(sa.fullName || '?')[0].toUpperCase()}
                        </div>
                        <strong className="text-[#0f172a] font-semibold text-[13.5px]">{sa.fullName ?? 'N/A'}</strong>
                      </div>
                    </td>
                    <td className="p-[12px_16px] text-[#64748b] align-middle border-b border-[#f1f5f9]">{sa.username ?? 'N/A'}</td>
                    <td className="p-[12px_16px] text-[#64748b] align-middle border-b border-[#f1f5f9]">{sa.email ?? 'N/A'}</td>
                    <td className="p-[12px_16px] text-[#64748b] align-middle border-b border-[#f1f5f9]">{sa.phone ?? '—'}</td>
                    <td className="p-[12px_16px] align-middle border-b border-[#f1f5f9]">{getStatusPill(sa.userStatus)}</td>
                    <td className="p-[12px_16px] text-[#94a3b8] text-[12.5px] align-middle border-b border-[#f1f5f9]">{formatDate(sa.createdAt)}</td>
                    <td className="p-[12px_16px] align-middle border-b border-[#f1f5f9]">
                      <div className="flex gap-[6px] flex-wrap">
                        <button
                          disabled={sa.userStatus === 'ACTIVE' || actionLoading === sa.id}
                          onClick={() => handleStatusChange(sa.id, true)}
                          className="inline-flex items-center gap-[5px] p-[5px_12px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] whitespace-nowrap text-[#16a34a] border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#16a34a] hover:text-white hover:border-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#f0fdf4] disabled:hover:text-[#16a34a] disabled:hover:border-[#bbf7d0]"
                        >
                          <CheckCircle size={12} /> Activate
                        </button>
                        <button
                          disabled={sa.userStatus !== 'ACTIVE' || actionLoading === sa.id}
                          onClick={() => handleStatusChange(sa.id, false)}
                          className="inline-flex items-center gap-[5px] p-[5px_12px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] whitespace-nowrap text-[#d97706] border-[#fde68a] bg-[#fffbeb] hover:bg-[#d97706] hover:text-white hover:border-[#d97706] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#fffbeb] disabled:hover:text-[#d97706] disabled:hover:border-[#fde68a]"
                        >
                          <Ban size={12} /> Deactivate
                        </button>
                        <button
                          onClick={() => setEditModal({ open: true, id: sa.id, data: { fullname: sa.fullName || '', username: sa.username || '', email: sa.email || '', phone: sa.phone || '' }, saving: false, error: null })}
                          className="inline-flex items-center gap-[5px] p-[5px_12px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] whitespace-nowrap text-[#d97706] border-[#fde68a] bg-[#fffbeb] hover:bg-[#d97706] hover:text-white hover:border-[#d97706]"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-[14px_20px] border-t border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <div className="text-[13px] text-[#64748b]">
            {filteredSubAdmins.length === 0
              ? 'No results found'
              : `Showing ${start + 1}–${end} of ${filteredSubAdmins.length} sub-admins`}
          </div>
          <nav>{renderPaginationBtns()}</nav>
        </div>
      </div>

      {/* CREATE MODAL */}
      {createModal.open && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => !createModal.saving && setCreateModal({ ...createModal, open: false })}>
          <div className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] max-w-[580px] w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0b2239] p-[20px_24px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] border-2 border-white/15">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">Create Sub Admin</p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">Add a new sub administrator account</p>
                </div>
              </div>
              <button
                disabled={createModal.saving}
                onClick={() => setCreateModal({ ...createModal, open: false })}
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white relative z-10 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-[24px] bg-white overflow-y-auto">
              {createModal.error && (
                <div className="flex items-start gap-[10px] p-[12px_14px] rounded-[10px] text-[13px] mb-[14px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] animate-[slideDown_0.25s_ease]">
                  <AlertCircle size={16} className="shrink-0 mt-[1px]" />
                  <span>{createModal.error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[16px]">
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Full Name <span className="text-[#dc2626]">*</span></label>
                  <input
                    type="text"
                    value={createModal.data.fullname}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, data: { ...prev.data, fullname: e.target.value } }))}
                    placeholder="Full name"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Username <span className="text-[#dc2626]">*</span></label>
                  <input
                    type="text"
                    value={createModal.data.username}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, data: { ...prev.data, username: e.target.value } }))}
                    placeholder="username"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Email <span className="text-[#dc2626]">*</span></label>
                  <input
                    type="email"
                    value={createModal.data.email}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                    placeholder="email@example.com"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Phone</label>
                  <input
                    type="number"
                    value={createModal.data.phone}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
              </div>
              
              <div className="mb-[16px]">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Password <span className="text-[#dc2626]">*</span></label>
                <div className="flex border-[1.5px] border-[#e8ecf1] rounded-[10px] overflow-hidden transition-all focus-within:border-[#0d9488] focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={createModal.data.password}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, data: { ...prev.data, password: e.target.value } }))}
                    placeholder="Min. 8 characters"
                    className="flex-1 px-[14px] py-[10px] border-none shadow-none rounded-none text-[14px] text-[#0f172a] bg-white outline-none font-['DM_Sans',sans-serif]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="bg-[#f8fafc] border-none border-l-[1.5px] border-l-[#e8ecf1] px-[14px] text-[#64748b] cursor-pointer transition-all hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] flex items-center justify-center"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {createModal.data.password && (
                  <div className="mt-[8px]">
                    <div className="flex gap-[4px] mb-[4px]">
                      {pwStrength.bars.map((bg, i) => (
                        <div key={i} className={`h-[4px] flex-1 rounded-full transition-colors ${bg}`} />
                      ))}
                    </div>
                    <span className={`text-[11.5px] font-semibold ${pwStrength.color}`}>{pwStrength.label}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-[16px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                disabled={createModal.saving}
                onClick={() => setCreateModal({ ...createModal, open: false })}
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={createModal.saving}
                onClick={handleCreate}
                className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
              >
                {createModal.saving && <Loader2 size={16} className="animate-spin" />}
                {createModal.saving ? 'Creating…' : 'Create Sub Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal.open && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => !editModal.saving && setEditModal({ ...editModal, open: false })}>
          <div className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] max-w-[580px] w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0b2239] p-[20px_24px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] border-2 border-white/15">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">Edit Sub Admin</p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">Update account details</p>
                </div>
              </div>
              <button
                disabled={editModal.saving}
                onClick={() => setEditModal({ ...editModal, open: false })}
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white relative z-10 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-[24px] bg-white overflow-y-auto">
              {editModal.error && (
                <div className="flex items-start gap-[10px] p-[12px_14px] rounded-[10px] text-[13px] mb-[14px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] animate-[slideDown_0.25s_ease]">
                  <AlertCircle size={16} className="shrink-0 mt-[1px]" />
                  <span>{editModal.error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[16px]">
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Full Name</label>
                  <input
                    type="text"
                    value={editModal.data.fullname}
                    onChange={(e) => setEditModal(prev => ({ ...prev, data: { ...prev.data, fullname: e.target.value } }))}
                    placeholder="Full name"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Username</label>
                  <input
                    type="text"
                    value={editModal.data.username}
                    onChange={(e) => setEditModal(prev => ({ ...prev, data: { ...prev.data, username: e.target.value } }))}
                    placeholder="username"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Email</label>
                  <input
                    type="email"
                    value={editModal.data.email}
                    onChange={(e) => setEditModal(prev => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                    placeholder="email@example.com"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Phone</label>
                  <input
                    type="number"
                    value={editModal.data.phone}
                    onChange={(e) => setEditModal(prev => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  />
                </div>
              </div>
            </div>

            <div className="p-[16px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                disabled={editModal.saving}
                onClick={() => setEditModal({ ...editModal, open: false })}
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={editModal.saving}
                onClick={handleEdit}
                className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
              >
                {editModal.saving && <Loader2 size={16} className="animate-spin" />}
                {editModal.saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubAdmins;
