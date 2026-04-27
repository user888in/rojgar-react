import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import {
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CheckCircle,
  Ban,
  AlertTriangle,
  X,
  ShieldAlert,
  ChevronDown
} from "lucide-react";

// Helper components
const StatCard = ({ title, value, subText, icon: Icon, colorClass, onClick, activeFilter }) => {
  const styles = {
    sky: { bg: '#f0f9ff', text: '#0ea5e9', gradient: 'linear-gradient(90deg, #0ea5e9, #7dd3fc)', valText: '#0f172a' },
    green: { bg: '#f0fdf4', text: '#22c55e', gradient: 'linear-gradient(90deg, #22c55e, #86efac)', valText: '#16a34a' },
    red: { bg: '#fef2f2', text: '#ef4444', gradient: 'linear-gradient(90deg, #ef4444, #fca5a5)', valText: '#dc2626' }
  };
  const cur = styles[colorClass];

  return (
    <div 
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '20px 22px',
        border: '1px solid #e8ecf1',
        boxShadow: 'none',
        transition: 'all 0.22s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
        // Show gradient bar on hover
        const bar = e.currentTarget.querySelector('.stat-card-bar');
        if (bar) bar.style.transform = 'scaleX(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        // Hide gradient bar on leave
        const bar = e.currentTarget.querySelector('.stat-card-bar');
        if (bar) bar.style.transform = 'scaleX(0)';
      }}
    >
      {/* Bottom gradient bar */}
      <div 
        className="stat-card-bar"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: cur.gradient,
          transition: 'transform 0.35s',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
        }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: cur.valText }}>{value}</div>
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          background: cur.bg,
          color: cur.text,
        }}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{
        marginTop: 10,
        fontSize: 11,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: cur.text,
      }}>
        <Filter size={10} /> {subText}
      </div>
    </div>
  );
};

const getStatusPill = (status) => {
  if (status === "ACTIVE") return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#f0fdf4] text-[#16a34a]"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>Active</span>;
  if (status === "SUSPENDED") return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fef2f2] text-[#dc2626]"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>Suspended</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#f8fafc] text-[#64748b]"><span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>{status ? status.charAt(0) + status.slice(1).toLowerCase() : "Pending"}</span>;
};

const AdminCandidates = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  const isSubAdmin = user?.role === "SUB_ADMIN";

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [stats, setStats] = useState({ total: '--', active: '--', suspended: '--' });
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", direction: "desc" });
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rowBusy, setRowBusy] = useState({});

  const [suspendModal, setSuspendModal] = useState({ isOpen: false, id: null, name: "", reason: "", error: false, submitting: false });
  const [toasts, setToasts] = useState([]);

  // Debounce for search
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchTerm }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const fetchStats = async () => {
    try {
      const [resAll, resActive, resSuspended] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/candidates?page=0&size=1&direction=desc`),
        authFetch(`${API_BASE_URL}/admin/candidates?page=0&size=1&direction=desc&status=ACTIVE`),
        authFetch(`${API_BASE_URL}/admin/candidates?page=0&size=1&direction=desc&status=SUSPENDED`)
      ]);
      const dataAll = resAll.ok ? await resAll.json() : {};
      const dataAct = resActive.ok ? await resActive.json() : {};
      const dataSus = resSuspended.ok ? await resSuspended.json() : {};
      
      setStats({
        total: dataAll.totalElements ?? '--',
        active: dataAct.totalElements ?? '--',
        suspended: dataSus.totalElements ?? '--'
      });
    } catch (err) {
      console.error("Stats error", err);
    }
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        direction: filters.direction
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      const res = await authFetch(`${API_BASE_URL}/admin/candidates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setCandidates(data.content || []);
      setPagination(p => ({ ...p, totalElements: data.totalElements || 0, totalPages: data.totalPages || 0 }));

      // Clean up selectedIds to only include visible/valid ones on this page if they changed status, 
      // though typically we clear on page change anyway.
      
    } catch (err) {
      console.error(err);
      showToast("Failed to load candidates", "danger");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [API_BASE_URL, pagination.page, pagination.size, filters, authFetch]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Handlers
  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= pagination.totalPages) return;
    clearSelection();
    setPagination(p => ({ ...p, page: newPage }));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const getPageInactiveIds = () => candidates.filter(c => c.userStatus !== "ACTIVE").map(c => c.id);

  const toggleAllSelection = (e) => {
    const checked = e.target.checked;
    const pageIds = getPageInactiveIds();
    const newSet = new Set(selectedIds);
    pageIds.forEach(id => {
      if (checked) newSet.add(id);
      else newSet.delete(id);
    });
    setSelectedIds(newSet);
  };

  const toggleRowSelection = (id, checked) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  // Bulk activate
  const bulkActivate = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/candidates/bulk-activate`, {
        method: "PATCH",
        body: JSON.stringify({ ids })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Bulk activation failed");
      }
      showToast(`${ids.length} candidate${ids.length > 1 ? 's' : ''} activated successfully ✓`, "success");
      clearSelection();
      fetchStats();
      fetchCandidates();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setBulkLoading(false);
    }
  };

  // Single Action
  const activateCandidate = async (id) => {
    if (!window.confirm("Activate this candidate?")) return;
    setRowBusy(p => ({ ...p, [id]: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/candidates/${id}/activate`, {
        method: "PATCH"
      });
      if (!res.ok) throw new Error("Failed to activate");
      showToast("Candidate activated successfully ✓", "success");
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
      fetchStats();
      fetchCandidates();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setRowBusy(p => ({ ...p, [id]: false }));
    }
  };

  // Suspend
  const confirmSuspend = async () => {
    if (!suspendModal.reason.trim()) {
      setSuspendModal(p => ({ ...p, error: true }));
      return;
    }
    setSuspendModal(p => ({ ...p, submitting: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/candidates/${suspendModal.id}/deactivate`, {
        method: "PATCH",
        body: JSON.stringify({ reason: suspendModal.reason.trim() })
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      showToast("Candidate deactivated", "warning");
      setSuspendModal({ isOpen: false, id: null, name: "", reason: "", error: false, submitting: false });
      fetchStats();
      fetchCandidates();
    } catch (err) {
      showToast(err.message, "danger");
      setSuspendModal(p => ({ ...p, submitting: false }));
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  
  // Calculate indeterminate state
  const pageInactiveIds = getPageInactiveIds();
  const selectedOnPage = pageInactiveIds.filter(id => selectedIds.has(id)).length;
  const isAllSelected = pageInactiveIds.length > 0 && selectedOnPage === pageInactiveIds.length;
  const isIndeterminate = selectedOnPage > 0 && selectedOnPage < pageInactiveIds.length;

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="relative font-['DM_Sans',sans-serif] text-[#0f172a] max-w-[1600px] mx-auto min-h-screen">
      
      {/* Spinner Overlay */}
      {initialLoad && (
        <div className="fixed inset-0 bg-white/70 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9488]"></div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-[13.5px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[240px] animate-[toastIn_0.3s_ease] border-l-[3px] border-white/30 ${t.type === 'success' ? 'bg-[#15803d]' : t.type === 'danger' ? 'bg-[#b91c1c]' : 'bg-[#b45309]'}`}>
            {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'danger' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      <div className={`fixed bottom-[28px] left-1/2 -translate-x-1/2 z-[1000] bg-[#0b2239] rounded-[16px] px-5 py-[14px] flex items-center gap-4 shadow-[0_16px_48px_rgba(9,29,51,0.35)] border border-white/10 transition-all duration-[350ms] ${selectedIds.size > 0 ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[90px] opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 text-white/75 text-[13.5px] font-medium whitespace-nowrap">
          <span className="bg-[#0d9488] text-white text-[12px] font-extrabold min-w-[26px] h-[26px] rounded-lg flex items-center justify-center px-1.5">{selectedIds.size}</span>
          <span>candidate{selectedIds.size !== 1 ? 's' : ''} selected</span>
        </div>
        <div className="w-[1px] h-[28px] bg-white/10"></div>
        <button 
          onClick={bulkActivate} disabled={bulkLoading}
          className="inline-flex items-center gap-[7px] bg-[#0d9488] text-white border-none rounded-[10px] px-5 py-[9px] text-[13.5px] font-bold cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.4)] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {bulkLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
          Activate Selected
        </button>
        <button onClick={clearSelection} className="inline-flex items-center gap-1.5 bg-white/5 text-white/65 border border-white/10 rounded-[10px] px-3.5 py-[9px] text-[13px] font-semibold cursor-pointer transition-all hover:bg-white/10 hover:text-white/90 whitespace-nowrap">
          <X size={16} /> Clear
        </button>
      </div>

      {/* Topbar */}
      <div
        style={{
          background: '#fff',
          padding: '16px 32px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderBottom: '1px solid #e8ecf1',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          marginLeft: '-32px',
          marginRight: '-32px',
          marginTop: '-32px',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Candidates</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 0 }}>View, activate and manage all job seeker accounts</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isSubAdmin && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#d97706',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 999,
              }}>
                <ShieldAlert size={14} /> Sub Admin Mode
              </div>
            )}
            <button
              onClick={onOpenProfile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: '1px solid #e8ecf1',
                borderRadius: 999,
                paddingLeft: 12,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'rgba(13,148,136,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8ecf1';
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <span>{user?.fullName || user?.username || 'Admin'}</span>
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] p-[28px_32px] mb-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative flex items-center gap-2">
          <Users size={24} /> Candidates
        </h4>
        <p className="text-white/55 text-[13.5px] m-0 relative">
          View, activate and manage all job seeker accounts on the platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Total Candidates" value={stats.total} subText="Show all" icon={Users} colorClass="sky" 
          onClick={() => { setFilters(f => ({ ...f, status: "" })); clearSelection(); setPagination(p => ({ ...p, page: 0 })); }}
          activeFilter={filters.status === ""}
        />
        <StatCard 
          title="Active" value={stats.active} subText="Filter active" icon={CheckCircle2} colorClass="green" 
          onClick={() => { setFilters(f => ({ ...f, status: "ACTIVE" })); clearSelection(); setPagination(p => ({ ...p, page: 0 })); }}
          activeFilter={filters.status === "ACTIVE"}
        />
        <StatCard 
          title="Suspend" value={stats.suspended} subText="Filter Suspend" icon={XCircle} colorClass="red" 
          onClick={() => { setFilters(f => ({ ...f, status: "SUSPENDED" })); clearSelection(); setPagination(p => ({ ...p, page: 0 })); }}
          activeFilter={filters.status === "SUSPENDED"}
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden">
        
        {/* Header & Controls */}
        <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-3">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <Users size={16} className="text-[#0d9488]" /> All Candidates
          </span>
          
          <div className="flex items-center gap-[10px] flex-wrap">
            <div className="flex items-center gap-2 bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-full px-[14px] py-[6px] focus-within:border-[#0d9488] transition-colors">
              <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search name, email…" 
                className="border-none outline-none bg-transparent text-[13px] w-[140px] md:w-[180px] text-[#0f172a] placeholder-[#aab]"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); clearSelection(); setPagination(p => ({ ...p, page: 0 })); }}
              />
            </div>
            
            <select 
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); clearSelection(); setPagination(p => ({ ...p, page: 0 })); }}
              className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-full px-[14px] py-[6px] bg-[#f8fafc] text-[#64748b] outline-none cursor-pointer focus:border-[#0d9488] transition-colors"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspend</option>
            </select>
            
            <select 
              value={filters.direction}
              onChange={(e) => { setFilters(f => ({ ...f, direction: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}
              className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-full px-[14px] py-[6px] bg-[#f8fafc] text-[#64748b] outline-none cursor-pointer focus:border-[#0d9488] transition-colors"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            
            <select 
              value={pagination.size}
              onChange={(e) => { setPagination(p => ({ ...p, size: Number(e.target.value), page: 0 })); clearSelection(); }}
              className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-full px-[14px] py-[6px] bg-[#f8fafc] text-[#64748b] outline-none cursor-pointer focus:border-[#0d9488] transition-colors"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto relative min-h-[300px]">
          {loading && !initialLoad && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="p-[12px_12px_12px_16px] w-[40px]">
                  <input 
                    type="checkbox" 
                    ref={selectAllRef}
                    checked={isAllSelected}
                    onChange={toggleAllSelection}
                    className="w-[17px] h-[17px] accent-[#0d9488] cursor-pointer" 
                    title="Select all non-active on this page"
                  />
                </th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">#</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Name</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Email</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Phone</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Status</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Registered</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px]">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13.5px] align-middle">
              {candidates.length === 0 && !loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-10 text-[#94a3b8]">
                    <Inbox size={36} className="mx-auto mb-2 opacity-60" />
                    No candidates found
                  </td>
                </tr>
              ) : (
                candidates.map((c, i) => {
                  const active = c.userStatus === "ACTIVE";
                  const isChecked = selectedIds.has(c.id);
                  const offset = pagination.page * pagination.size;

                  return (
                    <tr key={c.id} className={`hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-0 transition-colors ${isChecked ? 'bg-[#0d9488]/5' : ''}`}>
                      <td className="p-[12px_12px_12px_16px] w-[40px]">
                        {!active ? (
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => toggleRowSelection(c.id, e.target.checked)}
                            className="w-[17px] h-[17px] accent-[#0d9488] cursor-pointer"
                          />
                        ) : <span className="inline-block w-[17px]"></span>}
                      </td>
                      <td className="p-[12px_16px] text-[#64748b]">{offset + i + 1}</td>
                      <td className="p-[12px_16px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[32px] h-[32px] rounded-lg bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                            {(c.fullName || "?")[0].toUpperCase()}
                          </div>
                          <strong className="text-[#0f172a]">{c.fullName || "N/A"}</strong>
                        </div>
                      </td>
                      <td className="p-[12px_16px] text-[#64748b]">{c.email || "N/A"}</td>
                      <td className="p-[12px_16px] text-[#64748b]">{c.phone || "—"}</td>
                      <td className="p-[12px_16px]">{getStatusPill(c.userStatus)}</td>
                      <td className="p-[12px_16px] text-[#94a3b8] text-[12.5px]">{formatDate(c.createdAt)}</td>
                      <td className="p-[12px_16px]">
                        <div className="flex gap-[6px] flex-wrap">
                          <button 
                            disabled={active || rowBusy[c.id]}
                            onClick={() => activateCandidate(c.id)}
                            className="inline-flex items-center gap-1.5 px-[12px] py-[5px] rounded-lg text-[12px] font-semibold transition-all duration-200 border-[1.5px] text-[#16a34a] border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#16a34a] hover:text-white hover:border-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <CheckCircle size={14} /> Activate
                          </button>
                          <button 
                            disabled={!active || rowBusy[c.id]}
                            onClick={() => setSuspendModal({ isOpen: true, id: c.id, name: c.fullName || 'this candidate', reason: "", error: false, submitting: false })}
                            className="inline-flex items-center gap-1.5 px-[12px] py-[5px] rounded-lg text-[12px] font-semibold transition-all duration-200 border-[1.5px] text-[#d97706] border-[#fde68a] bg-[#fffbeb] hover:bg-[#d97706] hover:text-white hover:border-[#d97706] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-[14px_20px] border-t border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <div className="text-[13px] text-[#64748b]">
            {pagination.totalElements === 0 
              ? "No results found" 
              : `Showing ${pagination.page * pagination.size + 1}–${Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of ${pagination.totalElements} candidates`}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex gap-[4px]">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="w-[32px] h-[32px] rounded-lg border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                // simple window logic
                if (i === 0 || i === pagination.totalPages - 1 || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
                  return (
                    <button 
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-[32px] h-[32px] rounded-lg border-[1.5px] text-[12.5px] font-semibold flex items-center justify-center transition-all ${
                        i === pagination.page 
                          ? 'bg-[#0d9488] border-[#0d9488] text-white' 
                          : 'border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-teal-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                }
                if (i === pagination.page - 2 || i === pagination.page + 2) {
                  return <span key={i} className="flex items-center justify-center w-[32px] text-[#64748b] text-[12px]">...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="w-[32px] h-[32px] rounded-lg border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Deactivate Reason Modal */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#091d33]/55 backdrop-blur-[4px] p-4 animate-[modalIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="bg-white rounded-[20px] p-[44px_40px_36px] max-w-[460px] w-full shadow-[0_32px_80px_rgba(9,29,51,0.22)]">
            <div className="w-[68px] h-[68px] rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-[1.7rem] mb-[16px]">
              <Ban size={32} />
            </div>
            <div className="text-[1.2rem] font-bold text-[#091d33] mb-[10px]">Deactivate Candidate</div>
            <p className="text-[0.9rem] text-[#64748b] leading-[1.7] mb-[14px]">
              Please provide a reason for deactivating <strong>{suspendModal.name}</strong>. 
              This may be shared with the candidate.
            </p>
            <div className="mb-[20px]">
              <label className="block text-[11px] font-bold tracking-[.8px] uppercase text-[#94a3b8] mb-[8px]">
                Reason for Deactivation
              </label>
              <textarea 
                rows="3" 
                placeholder="e.g. Violation of platform terms, fraudulent activity…"
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal(p => ({ ...p, reason: e.target.value, error: false }))}
                className={`w-full p-[11px_14px] border-[1.5px] rounded-[10px] text-[13.5px] font-['DM_Sans',sans-serif] text-[#0f172a] outline-none resize-y transition-colors focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,.1)] ${suspendModal.error ? 'border-[#dc2626]' : 'border-[#e8ecf1]'}`}
              ></textarea>
              {suspendModal.error && (
                <div className="text-[#dc2626] text-[12px] mt-[5px] flex items-center gap-1">
                  <AlertTriangle size={12} /> Please enter a reason before deactivating.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-[10px]">
              <button 
                onClick={() => setSuspendModal({ ...suspendModal, isOpen: false })}
                disabled={suspendModal.submitting}
                className="inline-flex items-center gap-[7px] border-none rounded-full px-[26px] py-[11px] text-[.88rem] font-bold cursor-pointer transition-all bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] disabled:opacity-60"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSuspend}
                disabled={suspendModal.submitting}
                className="inline-flex items-center gap-[7px] border-none rounded-full px-[26px] py-[11px] text-[.88rem] font-bold cursor-pointer transition-all bg-[#ef4444] text-white hover:bg-[#dc2626] disabled:opacity-60"
              >
                <Ban size={16} />
                {suspendModal.submitting ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for animations used in this component */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.88) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
export default AdminCandidates;
