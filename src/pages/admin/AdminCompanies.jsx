import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Building2, Building, ShieldCheck, Hourglass, Ban, Filter, 
  Search, Plus, CheckCircle, Eye, ChevronLeft, ChevronRight, 
  UploadCloud, X, ShieldAlert, Clock, AlertCircle, AlertTriangle, 
  ChevronDown, LayoutGrid, Users, Briefcase, MapPin, MessageSquare,
  AlignLeft, Info, Globe, ExternalLink, Hash, Star, StarHalf,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─── Mappings ─── */
const SIZE_MAP = {
  SIZE_1_50: '1–50', SIZE_51_200: '51–200', SIZE_201_500: '201–500',
  SIZE_501_1000: '501–1,000', SIZE_1001_5000: '1,001–5,000',
  SIZE_5001_10000: '5,001–10,000', SIZE_10000_PLUS: '10,000+'
};
const TYPE_MAP = {
  PRIVATE: 'Private', PUBLIC: 'Public Listed', MNC: 'MNC',
  STARTUP: 'Startup', NGO: 'NGO / Non-profit', GOVERNMENT: 'Government'
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

  // -- Dropdowns --
  const [typeOptions, setTypeOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);

  // -- Modals State --
  const [suspendModal, setSuspendModal] = useState({ open: false, id: null, name: '', reason: '', error: false, saving: false });
  const [viewModal, setViewModal] = useState({ open: false, data: null, loading: false, error: false });
  
  const initialCreateForm = {
    name: '', desc: '', foundedYear: '', hq: '', type: '', size: '', industry: '', website: '', file: null, preview: ''
  };
  const [createModal, setCreateModal] = useState({ 
    open: false, 
    ...initialCreateForm,
    errors: { name: false, foundedYear: false, type: false, size: false, file: false },
    saving: false, 
    alert: null,
    dragOver: false
  });
  
  // -- Toasts --
  const [toasts, setToasts] = useState([]);

  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const fileInputRef = useRef(null);

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

  // Load Dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [typeRes, sizeRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/companies/company-type`),
          authFetch(`${API_BASE_URL}/companies/enums/company-size`)
        ]);
        if (typeRes.ok) setTypeOptions(await typeRes.json());
        if (sizeRes.ok) setSizeOptions(await sizeRes.json());
      } catch (e) {
        console.warn("Failed to load dropdowns");
      }
    };
    loadDropdowns();
  }, [authFetch]);

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
    const { name, desc, foundedYear, hq, type, size, industry, website, file } = createModal;
    let hasErr = false;
    const errors = { name: false, foundedYear: false, type: false, size: false, file: false };

    if (!name.trim()) { errors.name = true; hasErr = true; }
    if (!foundedYear || isNaN(parseInt(foundedYear))) { errors.foundedYear = true; hasErr = true; }
    if (!type) { errors.type = true; hasErr = true; }
    if (!size) { errors.size = true; hasErr = true; }

    if (hasErr) {
      setCreateModal(prev => ({ ...prev, errors }));
      return;
    }

    setCreateModal(prev => ({ ...prev, saving: true, alert: null, errors }));
    
    const params = new URLSearchParams();
    params.set("companyName", name.trim());
    params.set("foundedYear", parseInt(foundedYear));
    params.set("companyType", type);
    params.set("companySize", size);
    if (desc.trim()) params.set("description", desc.trim());
    if (hq.trim()) params.set("headquarters", hq.trim());
    if (industry.trim()) params.set("industry", industry.trim());
    if (website.trim()) params.set("websiteUrl", website.trim());

    const formData = new FormData();
    if (file) formData.append("logo", file);

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/company/create?${params.toString()}`, { 
        method: "POST", 
        body: file ? formData : null 
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      showToast("Company created successfully ✓");
      setCreateModal({ open: false, ...initialCreateForm, errors: { name: false, foundedYear: false, type: false, size: false, file: false }, saving: false, alert: null, dragOver: false });
      loadCompanies();
      loadStats();
    } catch (e) {
      setCreateModal(prev => ({ ...prev, saving: false, alert: e.message || "Failed to create company." }));
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setCreateModal(prev => ({ ...prev, dragOver: false }));
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 2 * 1024 * 1024) {
        setCreateModal(prev => ({ ...prev, errors: { ...prev.errors, file: true } }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setCreateModal(prev => ({ ...prev, file, preview: ev.target.result, errors: { ...prev.errors, file: false } }));
      reader.readAsDataURL(file);
    }
  };

  // --- RENDER HELPERS ---
  
  const getStatusPill = (status) => {
    if (status === "VERIFIED") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Verified</span>;
    if (status === "PENDING") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Pending</span>;
    if (status === "SUSPENDED") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Suspended</span>;
    if (status === "REJECT") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> {status || 'Unknown'}</span>;
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-[#cbd5e1] text-xs">—</span>;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      <div className="flex items-center gap-1">
        {[...Array(full)].map((_, i) => <Star key={`f-${i}`} size={11} className="text-[#f59e0b] fill-current" />)}
        {half ? <StarHalf key="h" size={11} className="text-[#f59e0b] fill-current" /> : null}
        {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} size={11} className="text-[#e2e8f0]" />)}
        <span className="text-[11px] font-bold text-[#92400e] ml-1">{Number(rating).toFixed(1)}</span>
      </div>
    );
  };

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
    <div className="relative font-['DM_Sans',sans-serif] min-h-[80vh] text-[#0f172a]">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[17px] font-bold text-[#0f172a] m-0 leading-tight">Companies</p>
            <p className="text-[#64748b] text-[12px] mt-px mb-0">Verify, suspend and manage all company accounts on the platform</p>
          </div>
          <div className="flex items-center gap-2.5">
            {isSubAdmin && (
              <div className="inline-flex items-center gap-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[12px] font-semibold px-3.5 py-1.5 rounded-[99px]">
                <ShieldAlert size={14} /> Sub Admin Mode
              </div>
            )}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-[#f8fafc] border border-[#e8ecf1] rounded-[99px] pl-2 pr-3.5 py-1.5 text-[13px] font-medium text-[#0f172a] cursor-pointer transition-all duration-200 hover:bg-[rgba(13,148,136,0.15)] hover:border-[#0d9488] hover:text-[#0d9488]"
            >
              <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white text-[11px] font-bold flex items-center justify-center">
                {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <span>{user?.fullName || user?.username || 'Admin'}</span>
              <ChevronDown size={10} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] p-[28px_32px] mb-6 relative overflow-hidden text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1)_0%,transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative flex items-center gap-2">
          <Building2 size={22} className="fill-current" /> Companies
        </h4>
        <p className="text-white/55 text-[13.5px] m-0 relative">
          Verify, suspend and manage all company accounts on the platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Companies', value: stats.total, color: '#0ea5e9', bg: '#f0f9ff', icon: <Building size={20} />, text: 'Show all', filter: '' },
          { label: 'Verified', value: stats.verified, color: '#16a34a', bg: '#f0fdf4', icon: <ShieldCheck size={20} />, text: 'Filter verified', filter: 'VERIFIED', valueColor: '#16a34a' },
          { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fffbeb', icon: <Hourglass size={20} />, text: 'Filter pending', filter: 'PENDING', valueColor: '#d97706' },
          { label: 'Suspended', value: stats.suspended, color: '#dc2626', bg: '#fef2f2', icon: <Ban size={20} />, text: 'Filter suspended', filter: 'SUSPENDED', valueColor: '#dc2626' },
        ].map((stat) => (
          <div 
            key={stat.label}
            onClick={() => { setStatusFilter(stat.filter); setSearchInput(''); }}
            className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] cursor-pointer transition-all duration-220 relative overflow-hidden hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] group"
          >
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--stat-color)] to-[var(--stat-color)]/50 transition-transform duration-350 origin-left scale-x-0 group-hover:scale-x-100" style={{ '--stat-color': stat.color }} />
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] text-[#64748b] mb-1">{stat.label}</div>
                <div className="text-[26px] font-extrabold leading-none" style={{ color: stat.valueColor || '#0f172a' }}>{stat.value}</div>
              </div>
              <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-2.5 text-[11px] font-semibold flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-all duration-200" style={{ color: stat.color }}>
              <Filter size={10} className="group-hover:translate-x-[2px] transition-transform" /> {stat.text}
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden">
        {/* Table card header */}
        <div className="p-[16px_20px] border-b border-[#f1f5f9] flex items-center justify-between flex-wrap gap-2.5">
          <span className="font-bold text-[13.5px] text-[#0f172a] flex items-center gap-[7px]">
            <Building2 size={16} color="#0d9488" /> All Companies
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] transition-[border-color] duration-200 focus-within:border-[#0d9488]">
              <Search size={14} color="#94a3b8" className="flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search company name…" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none outline-none text-[13px] text-[#0f172a] bg-transparent w-[180px] font-['DM_Sans',sans-serif] placeholder:text-[#aab]"
              />
            </div>
            {/* Status */}
            <select 
              className="bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] text-[13px] text-[#64748b] outline-none cursor-pointer transition-[border-color] duration-200 focus:border-[#0d9488] font-['DM_Sans',sans-serif]"
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
              className="bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] text-[13px] text-[#64748b] outline-none cursor-pointer transition-[border-color] duration-200 focus:border-[#0d9488] font-['DM_Sans',sans-serif]"
              value={size} 
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
          {!isSubAdmin && (
            <button 
              className="inline-flex items-center gap-[6px] bg-[#0d9488] text-white border-none rounded-[99px] px-[18px] py-[8px] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)]"
              onClick={() => setCreateModal({ open: true, ...initialCreateForm, errors: { name: false, foundedYear: false, type: false, size: false, file: false }, saving: false, alert: null, dragOver: false })}
            >
              <Plus size={14} /> Create Company
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {['#', 'Company', 'Industry / Type', 'Size', 'Rating', 'Jobs', 'Status', 'Registered', 'Actions'].map((h, idx) => (
                  <th
                    key={h}
                    className={`px-4 py-[11px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] text-left border-b border-[#e8ecf1] whitespace-nowrap ${idx === 0 ? 'w-[44px]' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="align-middle">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-10 text-[#94a3b8]">
                  <div className="inline-block w-5 h-5 border-[3px] border-current border-t-transparent text-[#0d9488] rounded-full animate-spin mr-2 align-middle"></div>
                  Loading…
                </td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-10 text-[#94a3b8]">
                  <Building2 size={36} className="block mx-auto mb-2 opacity-50" />
                  No companies found
                </td></tr>
              ) : (
                companies.map((c, i) => {
                  const companyId = c.companyId || c.id;
                  const isVerified = c.verificationStatus === 'VERIFIED';
                  const isSuspended = c.verificationStatus === 'SUSPENDED';
                  const isBusy = busyRows.has(companyId);
                  const firstChar = (c.companyName || '?')[0].toUpperCase();
                  
                  return (
                    <tr key={companyId || i} className="border-b border-[#f1f5f9] transition-[background] duration-150 hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 text-[#64748b] text-[12px]">{(page * size) + i + 1}</td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex items-center gap-[10px]">
                          {c.companyLogo ? (
                            <img src={c.companyLogo} alt={firstChar} className="min-w-[38px] w-[38px] h-[38px] rounded-[9px] object-contain border border-[#e2e8f0] bg-[#f8fafc] flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <div className="w-[38px] h-[38px] min-w-[38px] rounded-[9px] bg-gradient-to-br from-[#0d9488] to-[#0ea5e9] text-white items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ display: c.companyLogo ? 'none' : 'flex' }}>
                            {firstChar}
                          </div>
                          <div>
                            <div className="font-bold text-[13.5px] text-[#0f172a]">{c.companyName || 'N/A'}</div>
                            {c.headquarters && (
                              <div className="text-[11.5px] text-[#94a3b8] mt-[2px] flex items-center gap-[3px]">
                                <MapPin size={10} className="fill-current" /> {c.headquarters}
                              </div>
                            )}
                            {c.foundedYear && (
                              <div className="text-[11px] text-[#94a3b8] mt-[2px]">
                                <Calendar size={10} /> Est. {c.foundedYear}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[150px]">
                        <div className="flex flex-col gap-[5px] items-start">
                          {c.industry ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#eff6ff] text-[#3b82f6]">
                              <LayoutGrid size={10} className="fill-current" /> {c.industry}
                            </span>
                          ) : <span className="text-[#cbd5e1] text-[12px]">—</span>}
                          {c.companyType && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#faf5ff] text-[#9333ea]">
                              {TYPE_MAP[c.companyType] || c.companyType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.companySize ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#f0fdf4] text-[#16a34a]">
                            <Users size={10} className="fill-current" /> {SIZE_MAP[c.companySize] || c.companySize}
                          </span>
                        ) : <span className="text-[#cbd5e1] text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {c.avgRating ? (
                          <div className="flex items-center gap-[3px]">
                            <Star size={11} className="text-[#f59e0b] fill-current" />
                            <span className="text-[12.5px] font-bold text-[#92400e]">{Number(c.avgRating).toFixed(1)}</span>
                            <span className="text-[11px] text-[#94a3b8]">({c.totalReviews ?? 0})</span>
                          </div>
                        ) : <span className="text-[#cbd5e1] text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {c.totalJobOpenings != null ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#fff7ed] text-[#ea580c]">
                            <Briefcase size={10} className="fill-current" /> {c.totalJobOpenings} open
                          </span>
                        ) : <span className="text-[#cbd5e1] text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusPill(c.verificationStatus)}
                      </td>
                      <td className="px-4 py-3 text-[#94a3b8] text-[12px] whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-[5px] items-center flex-nowrap">
                          <button onClick={() => handleView(companyId)} className="inline-flex justify-center items-center gap-[4px] rounded-[8px] px-[9px] py-[6px] text-[13px] font-semibold border-[1.5px] border-[#bae6fd] bg-[#f0f9ff] text-[#0284c7] transition-all duration-150 hover:bg-[#e0f2fe]" title="View full details">
                            <Eye size={12} className="fill" />
                          </button>
                          {!isSubAdmin && (
                            <>
                              <button disabled={isVerified || isBusy} onClick={() => handleVerify(companyId)} className="inline-flex items-center gap-[5px] rounded-[8px] px-[12px] py-[5px] text-[12px] font-semibold border-[1.5px] border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#16a34a] hover:text-white hover:border-[#16a34a]">
                                <CheckCircle size={12} /> Verify
                              </button>
                              <button disabled={isSuspended || isBusy} onClick={() => setSuspendModal({ open: true, id: companyId, name: c.companyName || 'this company', reason: '', error: false, saving: false })} className="inline-flex items-center gap-[5px] rounded-[8px] px-[12px] py-[5px] text-[12px] font-semibold border-[1.5px] border-[#fde68a] bg-[#fffbeb] text-[#d97706] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d97706] hover:text-white hover:border-[#d97706]">
                                <Ban size={12} /> Suspend
                              </button>
                            </>
                          )}
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
        <div className="px-[20px] py-[14px] border-t border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <div className="text-[13px] text-[#64748b]">
            {renderPaginationInfo()}
          </div>
          {totalPages > 1 && (
            <nav>
              <ul className="flex items-center gap-[4px] list-none m-0 p-0">
                <li>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] text-[12.5px] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </li>
                {getPaginationArray().map((p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${p}`}>
                        <li>
                          <span className="flex items-center justify-center w-[32px] h-[32px] text-[#64748b] text-[12.5px]">…</span>
                        </li>
                        <li>
                          <button
                            onClick={() => setPage(p)}
                            className={`flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border-[1.5px] text-[12.5px] font-semibold transition-all duration-150 ${p === page ? 'bg-[#0d9488] border-[#0d9488] text-white' : 'bg-[#f8fafc] border-[#e8ecf1] text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]'}`}
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
                        className={`flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border-[1.5px] text-[12.5px] font-semibold transition-all duration-150 ${p === page ? 'bg-[#0d9488] border-[#0d9488] text-white' : 'bg-[#f8fafc] border-[#e8ecf1] text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]'}`}
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
                    className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] text-[12.5px] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Suspend Modal */}
      {suspendModal.open && (
        <div className="fixed inset-0 bg-[#091d33]/55 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setSuspendModal(prev => ({...prev, open: false})) }}>
          <div className="bg-white rounded-[20px] max-w-[420px] w-full p-[44px_40px_36px] text-center shadow-[0_32px_80px_rgba(9,29,51,0.22)] animate-[modalIn_0.3s_cubic-bezier(.34,1.56,.64,1)]">
            <div className="w-[68px] h-[68px] rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-[1.7rem] mx-auto mb-[22px]">
              <Ban size={30} className="fill-current" />
            </div>
            <div className="text-[1.2rem] font-bold text-[#0b2239] mb-[10px] text-left">Suspend Company</div>
            <p className="text-[.9rem] text-[#64748b] leading-[1.7] mb-[28px] text-left">
              Please provide a reason for suspending <strong>{suspendModal.name}</strong>. This may be shared with the company.
            </p>
            <div className="mb-[20px] text-left">
              <label className="text-[11px] font-bold tracking-[.8px] uppercase text-[#94a3b8] block mb-[8px]">Reason for Suspension</label>
              <textarea 
                rows="3" 
                placeholder="e.g. Violation of platform terms, fraudulent activity…"
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal(prev => ({...prev, reason: e.target.value, error: false}))}
                className="w-full px-[14px] py-[11px] border-[1.5px] border-[#e2e8f0] rounded-[10px] text-[13.5px] font-['DM_Sans',sans-serif] text-[#0f172a] outline-none resize-vertical transition-all duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,.1)]"
              />
              {suspendModal.error && (
                <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                  <AlertCircle size={12} /> Please enter a reason before suspending.
                </div>
              )}
            </div>
            <div className="flex gap-[10px] justify-end">
              <button className="inline-flex items-center justify-center gap-[7px] border-none rounded-[50px] px-[26px] py-[11px] text-[.88rem] font-bold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-180 bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]" onClick={() => setSuspendModal(prev => ({...prev, open: false}))}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-[7px] border-none rounded-[50px] px-[26px] py-[11px] text-[.88rem] font-bold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-180 bg-[#ef4444] text-white hover:bg-[#dc2626] disabled:opacity-60 disabled:cursor-not-allowed" disabled={suspendModal.saving} onClick={handleSuspend}>
                <Ban size={16} /> {suspendModal.saving ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Company Modal */}
      {viewModal.open && (
        <div className="fixed inset-0 bg-[#0b2239]/55 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4 animate-[fadeInBd_0.2s_ease]" onClick={(e) => { if (e.target === e.currentTarget) setViewModal({ open: false, data: null, loading: false, error: false }) }}>
          <div className="bg-white rounded-[22px] w-full max-w-[680px] max-h-[92vh] flex flex-col shadow-[0_28px_72px_rgba(11,34,57,0.22),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden animate-[slideUp_0.25s_cubic-bezier(.34,1.4,.64,1)]">
            
            {/* Banner */}
            <div className="h-[120px] bg-gradient-to-br from-[#0d9488] via-[#0ea5e9] to-[#6366f1] relative shrink-0">
              {viewModal.data?.companyBanner && (
                <img src={viewModal.data.companyBanner} alt="" className="w-full h-full object-cover block" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
              <button className="absolute top-[12px] right-[12px] w-[32px] h-[32px] rounded-full bg-white/20 border border-white/35 text-white flex items-center justify-center cursor-pointer text-[13px] transition-colors duration-150 hover:bg-white/35" onClick={() => setViewModal({ open: false, data: null, loading: false, error: false })}>
                <X size={16} />
              </button>
              
              {/* Logo float */}
              <div className="absolute -bottom-[28px] left-[24px] w-[64px] h-[64px] rounded-[14px] border-[3px] border-white bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden flex items-center justify-center">
                {viewModal.loading ? (
                   <div className="w-full h-full bg-gradient-to-br from-[#0d9488] to-[#0ea5e9] flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>
                ) : viewModal.data?.companyLogo ? (
                   <img src={viewModal.data.companyLogo} alt="" className="w-full h-full object-contain" />
                ) : (
                   <div className="w-full h-full bg-gradient-to-br from-[#0d9488] to-[#0ea5e9] flex items-center justify-center font-extrabold text-[22px] text-white">
                     {(viewModal.data?.companyName || '?')[0].toUpperCase()}
                   </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-[44px_28px_24px] overflow-y-auto flex-1">
              {viewModal.loading ? (
                 <div className="text-center py-12 text-[#94a3b8]">
                   <Loader2 size={24} className="animate-spin mx-auto text-[#0d9488]" /> Loading…
                 </div>
              ) : viewModal.error ? (
                <div className="text-center py-12 text-[#dc2626]">
                  <AlertTriangle size={36} className="block mx-auto mb-3" />
                  <div className="font-bold text-[15px]">Failed to load</div>
                  <div className="text-[13px] text-[#94a3b8] mt-[6px]">Could not retrieve company details.</div>
                </div>
              ) : viewModal.data && (
                <>
                  <div className="flex items-start justify-between gap-[12px] flex-wrap mb-[6px]">
                    <div className="text-[20px] font-extrabold text-[#0f172a] leading-[1.2]">{viewModal.data.companyName || 'N/A'}</div>
                    {getStatusPill(viewModal.data.verificationStatus)}
                  </div>
                  {viewModal.data.tagline && <div className="text-[13px] text-[#64748b] mb-[14px] italic">"{viewModal.data.tagline}"</div>}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] my-[18px]">
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-[12px_14px] text-center">
                      <div className="text-[20px] font-extrabold text-[#f59e0b] leading-none mb-[4px]">{viewModal.data.avgRating ? Number(viewModal.data.avgRating).toFixed(1) : '—'}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[.7px] color-[#94a3b8]"><Star size={10} className="inline fill-[#f59e0b] text-[#f59e0b] -mt-[2px]" /> Avg Rating</div>
                    </div>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-[12px_14px] text-center">
                      <div className="text-[20px] font-extrabold text-[#0284c7] leading-none mb-[4px]">{viewModal.data.totalReviews ?? '—'}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[.7px] color-[#94a3b8]"><MessageSquare size={10} className="inline text-[#0284c7] -mt-[2px]" /> Reviews</div>
                    </div>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-[12px_14px] text-center">
                      <div className="text-[20px] font-extrabold text-[#ea580c] leading-none mb-[4px]">{viewModal.data.totalJobOpenings ?? '—'}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[.7px] color-[#94a3b8]"><Briefcase size={10} className="inline text-[#ea580c] -mt-[2px]" /> Open Jobs</div>
                    </div>
                  </div>

                  {viewModal.data.description && (
                    <>
                      <div className="text-[10px] font-bold uppercase tracking-[.8px] text-[#94a3b8] m-[20px_0_10px] flex items-center gap-[6px] after:content-[''] after:flex-1 after:h-px after:bg-[#f1f5f9]">
                        <AlignLeft size={12} /> About
                      </div>
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] border-l-[3px] border-l-[#0d9488] rounded-[10px] p-[14px_16px] text-[13.5px] color-[#374151] leading-[1.7] whitespace-pre-wrap">
                        {viewModal.data.description}
                      </div>
                    </>
                  )}

                  <div className="text-[10px] font-bold uppercase tracking-[.8px] text-[#94a3b8] m-[20px_0_10px] flex items-center gap-[6px] after:content-[''] after:flex-1 after:h-px after:bg-[#f1f5f9]">
                    <Info size={12} /> Company Info
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
                    {[
                      { icon: MapPin, label: 'Headquarters', val: viewModal.data.headquarters || '—' },
                      { icon: LayoutGrid, label: 'Industry', val: viewModal.data.industry || '—' },
                      { icon: Building2, label: 'Company Type', val: TYPE_MAP[viewModal.data.companyType] || viewModal.data.companyType || '—' },
                      { icon: Users, label: 'Company Size', val: (SIZE_MAP[viewModal.data.companySize] || viewModal.data.companySize || '—') + (viewModal.data.companySize ? ' employees' : '') },
                      { icon: Calendar, label: 'Founded', val: viewModal.data.foundedYear ? `${viewModal.data.foundedYear}` : '—' },
                      { icon: CheckCircle, label: 'Registered', val: formatDate(viewModal.data.createdAt) },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-[11px_13px] flex items-center gap-[10px]">
                        <div className="w-[28px] h-[28px] rounded-[7px] bg-[rgba(13,148,136,0.09)] text-[#0d9488] flex items-center justify-center flex-shrink-0">
                          <item.icon size={12} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[.6px] text-[#94a3b8]">{item.label}</div>
                          <div className="text-[13px] font-semibold text-[#1e293b] mt-px break-words">{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {viewModal.data.websiteUrl && (
                    <>
                      <div className="text-[10px] font-bold uppercase tracking-[.8px] text-[#94a3b8] m-[20px_0_10px] flex items-center gap-[6px] after:content-[''] after:flex-1 after:h-px after:bg-[#f1f5f9]">
                        <Globe size={12} /> Website
                      </div>
                      <a href={viewModal.data.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[8px] bg-[#f0fdfa] border border-[#ccfbf1] rounded-[10px] p-[10px_14px] no-underline text-[#0d9488] text-[13px] font-semibold transition-colors duration-150 hover:bg-[#ccfbf1] break-all">
                        <ExternalLink size={14} /> {viewModal.data.websiteUrl}
                      </a>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {viewModal.data && (
              <div className="p-[16px_28px] border-t border-[#f1f5f9] flex items-center justify-between gap-[10px] shrink-0 flex-wrap">
                <div className="text-[12px] text-[#94a3b8] flex items-center gap-[6px]">
                  <Hash size={14} /> Company ID: <strong>{viewModal.data.companyId || viewModal.data.id}</strong>
                </div>
                {!isSubAdmin && (
                  <div className="flex gap-[8px]">
                    <button className="inline-flex items-center gap-[6px] text-[13px] font-semibold p-[8px_18px] rounded-[10px] border-none cursor-pointer transition-all duration-150 bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]" onClick={() => setViewModal({ open: false, data: null, loading: false, error: false })}>Close</button>
                    <button disabled={viewModal.data.verificationStatus === 'VERIFIED'} className="inline-flex items-center gap-[6px] text-[13px] font-semibold p-[8px_18px] rounded-[10px] border-none cursor-pointer transition-all duration-150 bg-gradient-to-br from-[#0d9488] to-[#059669] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setViewModal({ open: false, data: null, loading: false, error: false }); handleVerify(viewModal.data.companyId || viewModal.data.id); }}>
                      <CheckCircle size={14} className="fill-current text-white" /> Verify
                    </button>
                    <button disabled={viewModal.data.verificationStatus === 'SUSPENDED'} className="inline-flex items-center gap-[6px] text-[13px] font-semibold p-[8px_18px] rounded-[10px] cursor-pointer transition-all duration-150 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] hover:bg-[#fee2e2] disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setViewModal({ open: false, data: null, loading: false, error: false }); setSuspendModal({ open: true, id: viewModal.data.companyId || viewModal.data.id, name: viewModal.data.companyName, reason: '', error: false, saving: false }); }}>
                      <Ban size={14} /> Suspend
                    </button>
                  </div>
                )}
                {isSubAdmin && (
                   <button className="inline-flex items-center gap-[6px] text-[13px] font-semibold p-[8px_18px] rounded-[10px] border-none cursor-pointer transition-all duration-150 bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]" onClick={() => setViewModal({ open: false, data: null, loading: false, error: false })}>Close</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-[#091d33]/55 backdrop-blur-[4px] z-[9999] flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setCreateModal(prev => ({...prev, open: false})) }}>
          <div className="bg-white rounded-[20px] max-w-[620px] w-[calc(100%-32px)] overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)]">
            <div className="bg-[#0b2239] p-[20px_24px] flex items-center justify-between relative overflow-hidden">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3)_0%,transparent_70%)] pointer-events-none" />
              <div className="relative">
                <p className="text-[17px] font-extrabold text-white m-0">Create New Company</p>
                <p className="text-[12.5px] text-white/50 m-0 mt-[3px]">Fill in the details to register a company</p>
              </div>
              <button className="relative w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-white" onClick={() => setCreateModal(prev => ({...prev, open: false}))}>
                <X size={16} />
              </button>
            </div>

            <div className="p-[24px] bg-white max-h-[65vh] overflow-y-auto font-['DM_Sans',sans-serif]">
              {createModal.alert && (
                <div className="flex items-center gap-[10px] p-[12px_14px] rounded-[10px] text-[13px] mb-[14px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] animate-[slideDown_0.25s_ease]">
                  <AlertCircle size={16} /> <span>{createModal.alert}</span>
                </div>
              )}

              {/* Company Name */}
              <div className="mb-[16px]">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Company Name <span className="text-[#ef4444]">*</span></label>
                <input 
                  className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]" 
                  type="text" 
                  placeholder="e.g. Acme Corp" 
                  value={createModal.name}
                  onChange={(e) => setCreateModal(prev => ({...prev, name: e.target.value, errors: {...prev.errors, name: false}}))}
                />
                {createModal.errors.name && (
                  <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                    <AlertCircle size={12} /> Company name is required.
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-[16px]">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Description</label>
                <textarea 
                  className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 resize-vertical min-h-[80px] focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                  rows="3" 
                  placeholder="Brief description of the company…"
                  value={createModal.desc}
                  onChange={(e) => setCreateModal(prev => ({...prev, desc: e.target.value.substring(0, 1000)}))}
                />
                <div className="text-right text-[11.5px] text-[#94a3b8] mt-[4px]">
                  <span>{createModal.desc.length}</span> / 1000
                </div>
              </div>

              {/* Founded Year & Headquarters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Founded Year <span className="text-[#ef4444]">*</span></label>
                  <input 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]" 
                    type="number" 
                    min="1800" max="2099"
                    placeholder="e.g. 2010" 
                    value={createModal.foundedYear}
                    onChange={(e) => setCreateModal(prev => ({...prev, foundedYear: e.target.value, errors: {...prev.errors, foundedYear: false}}))}
                  />
                  {createModal.errors.foundedYear && (
                    <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                      <AlertCircle size={12} /> Valid founded year is required.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Headquarters</label>
                  <input 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]" 
                    type="text" 
                    placeholder="e.g. Mumbai, India" 
                    value={createModal.hq}
                    onChange={(e) => setCreateModal(prev => ({...prev, hq: e.target.value}))}
                  />
                </div>
              </div>

              {/* Company Type & Company Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Company Type <span className="text-[#ef4444]">*</span></label>
                  <select 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[13.5px] text-[#0f172a] bg-white outline-none cursor-pointer transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    value={createModal.type}
                    onChange={(e) => setCreateModal(prev => ({...prev, type: e.target.value, errors: {...prev.errors, type: false}}))}
                  >
                    <option value="">Select type…</option>
                    {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {createModal.errors.type && (
                    <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                      <AlertCircle size={12} /> Company type is required.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Company Size <span className="text-[#ef4444]">*</span></label>
                  <select 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[13.5px] text-[#0f172a] bg-white outline-none cursor-pointer transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    value={createModal.size}
                    onChange={(e) => setCreateModal(prev => ({...prev, size: e.target.value, errors: {...prev.errors, size: false}}))}
                  >
                    <option value="">Select size…</option>
                    {sizeOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {createModal.errors.size && (
                    <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                      <AlertCircle size={12} /> Company size is required.
                    </div>
                  )}
                </div>
              </div>

              {/* Industry & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Industry</label>
                  <input 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]" 
                    type="text" 
                    placeholder="e.g. Information Technology" 
                    value={createModal.industry}
                    onChange={(e) => setCreateModal(prev => ({...prev, industry: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Website URL</label>
                  <input 
                    className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]" 
                    type="url" 
                    placeholder="https://example.com" 
                    value={createModal.website}
                    onChange={(e) => setCreateModal(prev => ({...prev, website: e.target.value}))}
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mt-[14px]">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">Company Logo</label>
                <div 
                  className="border-2 rounded-[12px] p-[20px_16px] text-center cursor-pointer transition-all duration-200"
                  style={{
                    borderStyle: createModal.preview ? 'solid' : 'dashed',
                    borderColor: createModal.preview ? T.teal : (createModal.dragOver ? T.teal : '#d1d5db'),
                    background: (createModal.preview || createModal.dragOver) ? 'rgba(13,148,136,0.04)' : '#fafbfc',
                  }}
                  onClick={() => document.getElementById('ccLogoFileInput').click()}
                  onDragOver={(e) => { e.preventDefault(); setCreateModal(prev => ({...prev, dragOver: true})); }}
                  onDragLeave={(e) => { e.preventDefault(); setCreateModal(prev => ({...prev, dragOver: false})); }}
                  onDrop={handleFileDrop}
                >
                  <input type="file" id="ccLogoFileInput" accept="image/*" className="hidden" onChange={handleFileDrop} />
                  
                  {!createModal.preview ? (
                    <div>
                      <UploadCloud size={28} className="text-[#cbd5e1] block mx-auto mb-[8px]" />
                      <p className="text-[13.5px] font-semibold text-[#374151] m-[0_0_4px]">Click to upload or drag & drop</p>
                      <p className="text-[12px] text-[#94a3b8] m-0">PNG, JPG, SVG · Max 2 MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-[14px] text-left">
                      <div className="w-[60px] h-[60px] rounded-[12px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img src={createModal.preview} alt="preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f172a] m-0 whitespace-nowrap overflow-hidden text-ellipsis">{createModal.file?.name}</p>
                        <p className="text-[12px] text-[#64748b] m-[4px_0_0]">{(createModal.file?.size / 1024).toFixed(1)} KB</p>
                        <div className="flex gap-[8px] mt-[8px]">
                          <button onClick={(e) => { e.stopPropagation(); document.getElementById('ccLogoFileInput').click(); }} className="text-[12px] font-semibold text-[#0d9488] bg-[rgba(13,148,136,0.15)] border border-[rgba(13,148,136,0.2)] rounded-[6px] px-[10px] py-[4px] cursor-pointer">Change</button>
                          <button onClick={(e) => { e.stopPropagation(); setCreateModal(prev => ({...prev, file: null, preview: '', errors: {...prev.errors, file: false}})); }} className="text-[12px] font-semibold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[6px] px-[10px] py-[4px] cursor-pointer">Remove</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {createModal.errors.file && (
                  <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                    <AlertCircle size={12} /> File too large. Max size is 2 MB.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-[10px] px-[24px] py-[16px] border-t border-[#e8ecf1] bg-[#fafbfc]">
              <button className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] transition-all duration-200 hover:bg-[#e2e8f0] hover:text-[#0f172a]" onClick={() => setCreateModal(prev => ({...prev, open: false}))}>Cancel</button>
              <button className="inline-flex items-center gap-[7px] bg-[#0d9488] text-white border-none rounded-[99px] px-[22px] py-[10px] text-[13.5px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f766e]" disabled={createModal.saving} onClick={handleCreateCompany}>
                {createModal.saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {createModal.saving ? 'Creating…' : 'Create Company'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCompanies;
