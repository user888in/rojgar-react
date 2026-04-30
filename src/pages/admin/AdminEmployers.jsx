import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  CheckCircle,
  Timer,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  X,
  AlertTriangle,
  Inbox,
  Check,
  Loader2,
  ChevronDown,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─── Design tokens (match admin-panel.css) ─── */
const T = {
  navy: '#0b2239',
  teal: '#0d9488',
  teal2: '#14b8a6',
  border: '#e8ecf1',
  bg: '#f2f5f9',
  text: '#0f172a',
  sub: '#64748b',
};

/* ─── Helpers ─── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

/* ─── Status pill component ─── */
const StatusPill = ({ status }) => {
  const map = {
    ACTIVE: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Active' },
    PENDING: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Pending' },
    SUSPENDED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Suspended' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 99, fontSize: 11.5,
        fontWeight: 700, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status === 'ACTIVE' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}
      {status === 'SUSPENDED' && <Ban size={11} />}
      {s.label}
    </span>
  );
};

/* ─── Toast ─── */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const ToastContainer = () => {
    const colorMap = {
      success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: <CheckCircle size={15} /> },
      danger: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: <AlertTriangle size={15} /> },
      warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: <AlertTriangle size={15} /> },
    };
    return (
      <div style={{ position: 'fixed', bottom: 90, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => {
          const c = colorMap[t.type] || colorMap.success;
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: c.bg, border: `1.5px solid ${c.border}`,
                color: c.color, fontSize: 13.5, fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                animation: 'toastSlideIn .3s ease',
                minWidth: 240, maxWidth: 320,
              }}
            >
              {c.icon}
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return { push, ToastContainer };
};

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
const AdminEmployers = () => {
  const { getAuthHeaders, user, token, authFetch, login } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  const { push: toast, ToastContainer } = useToast();

  /* ── Server-side pagination state ── */
  const [currentPage, setCurrentPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const searchTimer = useRef(null);

  /* ── Data ── */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Stat cards ── */
  const [stats, setStats] = useState({ total: '0', active: '0', blocked: '0' });

  /* ── Selection ── */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [busyIds, setBusyIds] = useState(new Set());

  /* ── Suspend modal ── */
  const [suspendModal, setSuspendModal] = useState({ open: false, id: null, name: '' });
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendReasonError, setSuspendReasonError] = useState(false);
  const [suspendingId, setSuspendingId] = useState(null);

  /* ── Bulk activate ── */
  const [bulkLoading, setBulkLoading] = useState(false);

  /* ── Build query string ── */
  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set('page', currentPage);
    p.set('size', perPage);
    p.set('direction', 'desc');
    if (search.trim()) p.set('search', search.trim());
    if (statusFilter) p.set('status', statusFilter);
    return p.toString();
  }, [currentPage, perPage, search, statusFilter]);

  /* ── Fetch stat cards ── */
  const fetchStats = useCallback(async () => {
    try {
      const [allRes, activeRes, pendingRes, suspRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/recruiters?page=0&size=1`),
        authFetch(`${API_BASE_URL}/admin/recruiters?page=0&size=1&status=ACTIVE`),
        authFetch(`${API_BASE_URL}/admin/recruiters?page=0&size=1&status=PENDING`),
        authFetch(`${API_BASE_URL}/admin/recruiters?page=0&size=1&status=SUSPENDED`),
      ]);
      const [all, active, pending, susp] = await Promise.all([
        allRes.json(), activeRes.json(), pendingRes.json(), suspRes.json(),
      ]);
      setStats({
        total: all.totalElements ?? '0',
        active: active.totalElements ?? '0',
        blocked: (pending.totalElements ?? 0) + (susp.totalElements ?? 0),
      });
    } catch { /* silent */ }
  }, [authFetch]);

  /* ── Main load ── */
  const loadEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/recruiters?${buildQuery()}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const page = await res.json();
      setData(page.content ?? []);
      setTotalPages(page.totalPages ?? 0);
      setTotalElements(page.totalElements ?? 0);
      if (!search && !statusFilter) fetchStats();
    } catch {
      setData([]);
      toast('Failed to load employers. Please refresh.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, authFetch, search, statusFilter, fetchStats, toast]);

  /* Initial + dependency-driven load */
  useEffect(() => { loadEmployers(); }, [loadEmployers]);

  /* ── Debounce search ── */
  const onSearchChange = (v) => {
    clearTimeout(searchTimer.current);
    setSearch(v);
    searchTimer.current = setTimeout(() => setCurrentPage(0), 400);
  };

  /* ── Stat-card filter click ── */
  const filterByCard = (status) => {
    setStatusFilter(status);
    setSearch('');
    setCurrentPage(0);
    document.getElementById('employers-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Row selection helpers ── */
  const inactiveIds = data.filter((r) => r.recruiterStatus !== 'ACTIVE').map((r) => r.recruiterId);

  const toggleRow = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      inactiveIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllState = (() => {
    if (!inactiveIds.length) return 'none';
    const sel = inactiveIds.filter((id) => selectedIds.has(id)).length;
    if (sel === 0) return 'none';
    if (sel === inactiveIds.length) return 'all';
    return 'indeterminate';
  })();

  /* ── Activate single ── */
  const activateOne = async (id) => {
    if (!window.confirm('Activate this recruiter?')) return;
    setBusyIds((p) => new Set([...p, id]));
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/recruiters/${id}/activate`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error();
      toast('Recruiter activated ✓', 'success');
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      loadEmployers();
    } catch {
      toast('Failed to activate.', 'danger');
    } finally {
      setBusyIds((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  /* ── Impersonate Recruiter ── */
  const impersonateRecruiter = async (targetUserId) => {
    if (!window.confirm('You will be logged in as this recruiter. Continue?')) return;
    setBusyIds((p) => new Set([...p, targetUserId]));
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/impersonate/${targetUserId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Impersonation failed.');
      }
      const data = await res.json();
      sessionStorage.setItem(
        'impersonation',
        JSON.stringify({
          active: true,
          targetUserId: data.userId,
          targetUsername: data.username,
          targetFullName: data.fullName || data.username,
          targetEmail: data.email,
          targetRole: data.role,
          adminUsername: data.impersonatedBy,
          adminUser: user,
        })
      );

      // Update AuthContext to the impersonated user so ProtectedRoute allows access
      const impersonatedUser = {
        userId: data.userId || targetUserId,
        id: data.userId || targetUserId,
        username: data.username,
        fullName: data.fullName || data.username,
        email: data.email,
        role: data.role || 'RECRUITER'
      };

      login(data.token || token, impersonatedUser);

      toast(`Entering session as ${data.username}…`, 'warning');
      setTimeout(() => {
        window.location.href = '/recruiter/dashboard';
      }, 900);
    } catch (err) {
      toast(err.message || 'Network error during impersonation.', 'danger');
    } finally {
      setBusyIds((p) => {
        const n = new Set(p);
        n.delete(targetUserId);
        return n;
      });
    }
  };

  /* ── Open suspend modal ── */
  const openSuspend = (id) => {
    const emp = data.find((r) => r.recruiterId === id);
    setSuspendModal({ open: true, id, name: emp?.fullName || 'this recruiter' });
    setSuspendReason('');
    setSuspendReasonError(false);
  };

  /* ── Confirm suspend ── */
  const confirmSuspend = async () => {
    if (!suspendReason.trim()) { setSuspendReasonError(true); return; }
    setSuspendingId(suspendModal.id);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/recruiters/${suspendModal.id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SUSPENDED', reason: suspendReason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to suspend.');
      }
      toast('Recruiter suspended', 'warning');
      setSuspendModal({ open: false, id: null, name: '' });
      loadEmployers();
    } catch (err) {
      toast(err.message || 'Failed to suspend. Please try again.', 'danger');
    } finally {
      setSuspendingId(null);
    }
  };

  /* ── Bulk activate ── */
  const bulkActivate = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/recruiters/bulk-activate`, {
        method: 'PATCH',
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Bulk activation failed.');
      }
      let activated = ids.length;
      try {
        const text = await res.text();
        if (text) { const d = JSON.parse(text); activated = d.activatedCount ?? ids.length; }
      } catch { /* use ids.length */ }
      toast(`${activated} employer${activated !== 1 ? 's' : ''} activated successfully ✓`, 'success');
      clearSelection();
      loadEmployers();
    } catch (err) {
      toast(err.message || 'Network error. Please try again.', 'danger');
    } finally {
      setBulkLoading(false);
    }
  };

  /* ── Pagination ── */
  const goToPage = (p) => {
    if (p < 0 || p >= totalPages) return;
    setCurrentPage(p);
    document.getElementById('employers-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rowOffset = currentPage * perPage;

  /* ── Pagination page numbers with ellipsis ── */
  const pageNumbers = (() => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) pages.push(i);
    }
    return pages;
  })();

  /* ── Escape key closes suspend modal ── */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSuspendModal({ open: false, id: null, name: '' }); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* CSS keyframes */}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bulkBarIn {
          from { transform: translateX(-50%) translateY(90px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .emp-action-btn { display:inline-flex; align-items:center; gap:5px; border-radius:8px; padding:5px 11px; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .18s; border:1.5px solid transparent; }
        .emp-action-btn:disabled { opacity:.45; cursor:not-allowed; }
        .emp-activate { background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; }
        .emp-activate:hover:not(:disabled) { background:#dcfce7; border-color:#86efac; }
        .emp-suspend  { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
        .emp-suspend:hover:not(:disabled)  { background:#fee2e2; border-color:#fca5a5; }
        .emp-row-check { width:17px; height:17px; accent-color:${T.teal}; cursor:pointer; border-radius:4px; flex-shrink:0; }
        .emp-tr-selected td { background:rgba(13,148,136,0.05) !important; }
        .emp-page-link { display:flex; align-items:center; justify-content:center; min-width:32px; height:32px; border-radius:8px; border:1.5px solid ${T.border}; background:#fff; color:${T.sub}; font-size:12.5px; font-weight:600; cursor:pointer; padding:0 8px; transition:all .18s; font-family:'DM Sans',sans-serif; }
        .emp-page-link:hover:not(:disabled) { border-color:${T.teal}; color:${T.teal}; }
        .emp-page-link.active { background:${T.teal}; border-color:${T.teal}; color:#fff; }
        .emp-page-link:disabled { opacity:.38; cursor:not-allowed; }
        .emp-filter-select { background:#fff; border:1.5px solid ${T.border}; border-radius:9px; padding:7px 12px; font-size:13px; color:${T.text}; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; transition:border-color .2s; }
        .emp-filter-select:focus { border-color:${T.teal}; box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
        .emp-search-box { display:flex; align-items:center; gap:7px; background:#fff; border:1.5px solid ${T.border}; border-radius:9px; padding:7px 12px; transition:border-color .2s; }
        .emp-search-box:focus-within { border-color:${T.teal}; box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
        .emp-search-box input { border:none; outline:none; font-size:13px; color:${T.text}; font-family:'DM Sans',sans-serif; background:transparent; width:180px; }
        .emp-stat-card { background:#fff; border-radius:14px; padding:20px 22px; border:1px solid ${T.border}; box-shadow:0 4px 20px rgba(11,34,57,0.08); cursor:pointer; transition:transform .2s, box-shadow .2s; }
        .emp-stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(11,34,57,0.12); }
        .emp-suspend-textarea { width:100%; padding:11px 14px; border:1.5px solid ${T.border}; border-radius:10px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:${T.text}; outline:none; resize:vertical; transition:border-color .2s, box-shadow .2s; }
        .emp-suspend-textarea:focus { border-color:${T.teal}; box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
      `}</style>

      {/* ── Toasts ── */}
      <ToastContainer />

      {/* ── Topbar ── */}
      <div
        style={{
          background: '#fff',
          padding: '16px 32px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderBottom: `1px solid ${T.border}`,
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
            <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.2 }}>Employers</p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 4, marginBottom: 0 }}>
              Activate, suspend and monitor all recruiter accounts on the platform
            </p>
          </div>
          <button
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              paddingLeft: 12,
              paddingRight: 10,
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
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
              e.currentTarget.style.borderColor = T.border;
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

      {/* ── Content ── */}
      <div style={{ padding: '0 0 24px' }}>

        {/* Page hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, #163554 100%)`,
            borderRadius: 14,
            padding: '24px 28px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute', top: -40, right: -40, width: 180, height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(13,148,136,0.18)',
              border: '1px solid rgba(13,148,136,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={22} color={T.teal2} />
          </div>
          <div style={{ position: 'relative' }}>
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: 0 }}>Employers</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '3px 0 0' }}>
              Activate, suspend and monitor all recruiter accounts on the platform
            </p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>

          {/* Total */}
          <div className="emp-stat-card" onClick={() => filterByCard('')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
                  Total Employers
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: T.text, lineHeight: 1 }}>{stats.total}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={20} />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Show all
            </div>
          </div>

          {/* Active */}
          <div className="emp-stat-card" onClick={() => filterByCard('ACTIVE')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>Active</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{stats.active}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={20} />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Filter active
            </div>
          </div>

          {/* Pending / Suspended */}
          <div className="emp-stat-card" onClick={() => filterByCard('PENDING')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>Pending / Suspended</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.blocked}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Timer size={20} />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Filter pending
            </div>
          </div>
        </div>

        {/* ── Table card ── */}
        <div
          id="employers-table-card"
          style={{ background: '#fff', borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: '0 4px 20px rgba(11,34,57,0.08)', overflow: 'hidden' }}
        >
          {/* Table card header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Building2 size={16} color={T.teal} /> All Employers
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search */}
              <div className="emp-search-box">
                <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search name, company…"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              {/* Status */}
              <select
                className="emp-filter-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {/* Per page */}
              <select
                className="emp-filter-select"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(0); }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '11px 12px 11px 16px', width: 40 }}>
                    <input
                      type="checkbox"
                      className="emp-row-check"
                      checked={selectAllState === 'all'}
                      ref={(el) => { if (el) el.indeterminate = selectAllState === 'indeterminate'; }}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      title="Select all on this page"
                    />
                  </th>
                  {['#', 'Full Name', 'Company', 'Email', 'Status', 'Registered', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        color: T.sub,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.8px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                      <Inbox size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: .5 }} />
                      No employers found
                    </td>
                  </tr>
                ) : (
                  data.map((r, i) => {
                    const isActive = r.recruiterStatus === 'ACTIVE';
                    const isSuspended = r.recruiterStatus === 'SUSPENDED';
                    const isChecked = selectedIds.has(r.recruiterId);
                    const isBusy = busyIds.has(r.recruiterId);
                    const initials = (r.fullName || '?')[0].toUpperCase();

                    return (
                      <tr
                        key={r.recruiterId}
                        className={isChecked ? 'emp-tr-selected' : ''}
                        style={{ borderBottom: `1px solid #f1f5f9` }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '12px 12px 12px 16px', width: 40 }}>
                          {!isActive ? (
                            <input
                              type="checkbox"
                              className="emp-row-check"
                              value={r.recruiterId}
                              checked={isChecked}
                              onChange={(e) => toggleRow(r.recruiterId, e.target.checked)}
                            />
                          ) : (
                            <span style={{ display: 'inline-block', width: 17 }} />
                          )}
                        </td>

                        {/* # */}
                        <td style={{ padding: '12px 16px', color: T.sub }}>{rowOffset + i + 1}</td>

                        {/* Name */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
                                color: '#fff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 700, fontSize: 12,
                              }}
                            >
                              {initials}
                            </div>
                            <strong style={{ color: T.text }}>{r.fullName ?? 'N/A'}</strong>
                          </div>
                        </td>

                        {/* Company */}
                        <td style={{ padding: '12px 16px', color: T.sub }}>{r.companyName ?? 'N/A'}</td>

                        {/* Email */}
                        <td style={{ padding: '12px 16px', color: T.sub, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.email ?? 'N/A'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <StatusPill status={r.recruiterStatus} />
                        </td>

                        {/* Registered */}
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12.5 }}>
                          {fmtDate(r.registeredAt || r.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="emp-action-btn emp-activate"
                              disabled={isActive || isBusy}
                              onClick={() => activateOne(r.recruiterId)}
                            >
                              {isBusy ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                              Activate
                            </button>
                            <button
                              className="emp-action-btn emp-suspend"
                              disabled={isSuspended || isBusy}
                              onClick={() => openSuspend(r.recruiterId)}
                            >
                              <Ban size={12} /> Suspend
                            </button>
                            <button
                              className="emp-action-btn"
                              style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#c4b5fd' }}
                              disabled={isBusy}
                              onClick={() => impersonateRecruiter(r.recruiterId)}
                            >
                              {isBusy ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <UserCog size={12} />}
                              View As
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
          <div
            style={{
              padding: '14px 20px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, color: T.sub }}>
              {totalElements === 0
                ? 'No results found'
                : `Showing ${rowOffset + 1}–${Math.min(rowOffset + data.length, totalElements)} of ${totalElements} employers`}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  className="emp-page-link"
                  disabled={currentPage === 0}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft size={13} />
                </button>

                {(() => {
                  const items = [];
                  let prev = null;
                  for (const p of pageNumbers) {
                    if (prev !== null && p - prev > 1) {
                      items.push(
                        <button key={`ellipsis-${p}`} className="emp-page-link" disabled style={{ cursor: 'default' }}>…</button>
                      );
                    }
                    items.push(
                      <button
                        key={p}
                        className={`emp-page-link${p === currentPage ? ' active' : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p + 1}
                      </button>
                    );
                    prev = p;
                  }
                  return items;
                })()}

                <button
                  className="emp-page-link"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk activate bar ── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: T.navy,
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 16px 48px rgba(9,29,51,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            whiteSpace: 'nowrap',
            animation: 'bulkBarIn .35s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Count badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.75)', fontSize: 13.5, fontWeight: 500 }}>
            <span
              style={{
                background: T.teal, color: '#fff', fontSize: 12, fontWeight: 800,
                minWidth: 26, height: 26, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
              }}
            >
              {selectedIds.size}
            </span>
            employer{selectedIds.size === 1 ? '' : 's'} selected
          </div>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

          {/* Activate */}
          <button
            disabled={bulkLoading}
            onClick={bulkActivate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.teal, color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 20px', fontSize: 13.5, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", cursor: 'pointer',
              transition: 'all .2s',
              opacity: bulkLoading ? .6 : 1,
            }}
          >
            {bulkLoading ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CheckCircle size={15} />
            )}
            {bulkLoading ? 'Activating…' : 'Activate Selected'}
          </button>

          {/* Clear */}
          <button
            onClick={clearSelection}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '9px 14px', fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', transition: 'all .2s',
            }}
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* ── Suspend modal ── */}
      {suspendModal.open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSuspendModal({ open: false, id: null, name: '' }); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(9,29,51,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, padding: '36px 32px 28px',
              maxWidth: 460, width: '100%',
              boxShadow: '0 24px 64px rgba(9,29,51,0.18)',
              animation: 'modalSlideIn .3s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ban size={24} color="#dc2626" />
            </div>

            <h4 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Suspend Employer</h4>
            <p style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.65, margin: '0 0 20px' }}>
              Please provide a reason for suspending <strong style={{ color: T.text }}>{suspendModal.name}</strong>. This may be shared with the recruiter.
            </p>

            {/* Reason textarea */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 8 }}
              >
                Reason for Suspension
              </label>
              <textarea
                className="emp-suspend-textarea"
                rows={3}
                placeholder="e.g. Violation of platform terms, fraudulent activity…"
                value={suspendReason}
                onChange={(e) => { setSuspendReason(e.target.value); if (e.target.value.trim()) setSuspendReasonError(false); }}
              />
              {suspendReasonError && (
                <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> Please enter a reason before suspending.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setSuspendModal({ open: false, id: null, name: '' })}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                  background: '#f1f5f9', color: T.sub, border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", transition: 'all .18s',
                }}
              >
                Cancel
              </button>
              <button
                disabled={!!suspendingId}
                onClick={confirmSuspend}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                  background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", transition: 'all .18s',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  opacity: suspendingId ? .6 : 1,
                }}
              >
                {suspendingId ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Ban size={14} />
                )}
                {suspendingId ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner CSS for lucide Loader2 */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminEmployers;
