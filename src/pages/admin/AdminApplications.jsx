import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Star,
  Send,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─────────────────────────────────────────────────────────
   Design tokens — exact values from admin-panel.css :root
───────────────────────────────────────────────────────── */
const C = {
  navy:    '#0b2239',
  navy2:   '#0f2d4a',
  teal:    '#0d9488',
  teal2:   '#14b8a6',
  border:  '#e8ecf1',
  bg:      '#f2f5f9',
  text:    '#0f172a',
  sub:     '#64748b',
  shadow:  '0 4px 20px rgba(11,34,57,0.08)',
  radius:  14,
};

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/* ─────────────────────────────────────────────────────────
   Status Badge
   Matches: .status-pill + .status-APPLIED / SHORTLISTED / HIRED / REJECTED
   The ::before dot has no explicit background in the original CSS for
   these statuses, so we omit it (matching actual rendered output).
───────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  APPLIED:     { background: '#eff6ff', color: '#1d4ed8' },
  SHORTLISTED: { background: '#fffbeb', color: '#d97706' },
  HIRED:       { background: '#f0fdf4', color: '#16a34a' },
  REJECTED:    { background: '#fef2f2', color: '#dc2626' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || { background: '#f8fafc', color: C.sub };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        ...s,
      }}
    >
      {status || 'N/A'}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const AdminApplications = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  const isSubAdmin = user?.role === "SUB_ADMIN";

  /* ── server-side state (mirrors JS variables in HTML) ── */
  const [currentPage,   setCurrentPage]   = useState(0);
  const [perPage,       setPerPage]       = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusKeyword, setStatusKeyword] = useState('');
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  /* ── data ── */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  /* ── stat card counts (fetched once, preserved across filter changes) ── */
  const [statCounts, setStatCounts] = useState({
    total: '--', hired: '--', shortlisted: '--', applied: '--',
  });

  /* ── search debounce ── */
  const searchTimer = useRef(null);
  const tableCardRef = useRef(null);

  /* ────────────────────────────────────────────────────
     Build URL — mirrors buildUrl() in the HTML script
  ──────────────────────────────────────────────────── */
  const buildUrl = useCallback(
    (page) => {
      const p = new URLSearchParams();
      p.set('page',      page ?? currentPage);
      p.set('size',      perPage);
      p.set('direction', 'desc');
      if (searchKeyword) p.set('search', searchKeyword);
      if (statusKeyword) p.set('status', statusKeyword);
      return `${API_BASE_URL}/admin/applications?${p.toString()}`;
    },
    [currentPage, perPage, searchKeyword, statusKeyword],
  );

  /* ────────────────────────────────────────────────────
     fetchStatCount — mirrors fetchStatCount() in HTML
     Uses size=1 to minimise data transfer
  ──────────────────────────────────────────────────── */
  const fetchStatCount = useCallback(
    async (status) => {
      try {
        const p = new URLSearchParams({ page: 0, size: 1, status });
        const res = await authFetch(`${API_BASE_URL}/admin/applications?${p}`);
        if (!res.ok) return '--';
        const data = await res.json();
        return data.totalElements ?? (Array.isArray(data) ? data.length : '--');
      } catch {
        return '--';
      }
    },
    [authFetch],
  );

  /* ────────────────────────────────────────────────────
     loadApplications — mirrors loadApplications() in HTML
  ──────────────────────────────────────────────────── */
  const loadApplications = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(false);
      try {
        const res = await authFetch(buildUrl(page));
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        /* Support both plain array and Spring Page<> response */
        const content  = Array.isArray(data) ? data : (data.content || []);
        const pages    = data.totalPages    ?? 1;
        const elements = data.totalElements ?? content.length;
        const pageNum  = data.number       ?? page;

        setRows(content);
        setTotalPages(pages);
        setTotalElements(elements);
        setCurrentPage(pageNum);

        /* Update stat-card counts only on the unfiltered first load */
        if (!searchKeyword && !statusKeyword && page === 0) {
          setStatCounts((prev) => ({ ...prev, total: elements }));
          fetchStatCount('HIRED').then((n) =>
            setStatCounts((prev) => ({ ...prev, hired: n })),
          );
          fetchStatCount('SHORTLISTED').then((n) =>
            setStatCounts((prev) => ({ ...prev, shortlisted: n })),
          );
          fetchStatCount('APPLIED').then((n) =>
            setStatCounts((prev) => ({ ...prev, applied: n })),
          );
        }
      } catch {
        setError(true);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl, authFetch, searchKeyword, statusKeyword, fetchStatCount],
  );

  /* Initial load */
  useEffect(() => {
    loadApplications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Re-load when perPage / status / search changes */
  useEffect(() => {
    loadApplications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, statusKeyword]);

  /* ────────────────────────────────────────────────────
     Event handlers
  ──────────────────────────────────────────────────── */
  const onSearchInput = (value) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchKeyword(value.trim());
      // trigger load via the useEffect above by updating state that triggers it
      loadApplications(0);
    }, 300);
  };

  const onStatusFilter = (value) => {
    setStatusKeyword(value);
    setCurrentPage(0);
  };

  const onPerPageChange = (value) => {
    setPerPage(Number(value));
    setCurrentPage(0);
  };

  /* stat-card click: set status filter and reset search */
  const filterByStat = (status) => {
    setSearchKeyword('');
    setStatusKeyword(status);
    setCurrentPage(0);
    tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToPage = (page) => {
    if (page < 0 || page >= totalPages) return;
    loadApplications(page);
    tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ────────────────────────────────────────────────────
     Pagination page numbers with ellipsis
     Mirrors renderPagination() in HTML
  ──────────────────────────────────────────────────── */
  const pageNumbers = (() => {
    if (totalPages <= 1) return [];
    const visible = new Set([0, totalPages - 1]);
    for (
      let i = Math.max(0, currentPage - 2);
      i <= Math.min(totalPages - 1, currentPage + 2);
      i++
    ) visible.add(i);
    return [...visible].sort((a, b) => a - b);
  })();

  /* ────────────────────────────────────────────────────
     Offset for row numbers
  ──────────────────────────────────────────────────── */
  const globalOffset = currentPage * perPage;

  /* ────────────────────────────────────────────────────
     Pagination info text — mirrors updatePaginationInfo()
  ──────────────────────────────────────────────────── */
  const paginationInfoText = (() => {
    if (totalElements === 0 || rows.length === 0) return 'No results found';
    const from = globalOffset + 1;
    const to   = globalOffset + rows.length;
    return `Showing ${from}–${to} of ${totalElements} applications`;
  })();

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        background: C.bg,
        minHeight: '100vh',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Inline CSS for hover animations and pseudo-elements ── */}
      <style>{`
        /* Stat card bottom-bar animation — mirrors .stat-card::after */
        .aap-stat-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px 22px;
          border: 1px solid #e8ecf1;
          transition: all .22s;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(11,34,57,0.08);
        }
        .aap-stat-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .35s;
          border-radius: 0;
        }
        .aap-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }
        .aap-stat-card:hover::after { transform: scaleX(1); }
        .aap-stat-amber::after  { background: linear-gradient(90deg, #f59e0b, #fcd34d); }
        .aap-stat-green::after  { background: linear-gradient(90deg, #22c55e, #86efac); }
        .aap-stat-yellow::after { background: linear-gradient(90deg, #eab308, #fde047); }
        .aap-stat-blue::after   { background: linear-gradient(90deg, #3b82f6, #93c5fd); }

        /* Table row hover — matches Bootstrap table-hover */
        .aap-tbody tr:hover td { background: #f8fafc; }

        /* Search box focus */
        .aap-search-box { display:flex; align-items:center; gap:8px; background:#f8fafc; border:1.5px solid #e8ecf1; border-radius:99px; padding:6px 14px; transition:border-color .2s; }
        .aap-search-box:focus-within { border-color: #0d9488; }
        .aap-search-box input { border:none; outline:none; background:transparent; font-size:13px; width:100%; font-family:'DM Sans',sans-serif; color:#0f172a; }
        .aap-search-box input::placeholder { color:#aab; }

        /* Filter select */
        .aap-filter-select { font-size:13px; border:1.5px solid #e8ecf1; border-radius:99px; padding:6px 14px; background:#f8fafc; color:#64748b; outline:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .aap-filter-select:focus { border-color:#0d9488; }

        /* Pagination page-link — mirrors Bootstrap override in admin-panel.css */
        .aap-page-link { display:inline-flex; align-items:center; justify-content:center; min-width:34px; height:34px; padding:0 10px; font-size:13px; color:#0b2239; border:1px solid #e8ecf1; border-radius:4px; background:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; text-decoration:none; }
        .aap-page-link:hover:not(:disabled) { background:#f1f5f9; color:#0b2239; border-color:#e8ecf1; }
        .aap-page-link.active { background:#0b2239; border-color:#0b2239; color:#fff; cursor:default; }
        .aap-page-link.disabled { color:#cbd5e1; cursor:not-allowed; pointer-events:none; }

        @keyframes aapSpin { to { transform: rotate(360deg); } }
      `}</style>

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
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Applications</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 0 }}>View and manage all job applications across the platform</p>
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

      {/* ── PAGE HERO ── */}
        {/* Mirrors: .page-hero + ::before + ::after in admin-panel.css */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0b2239 0%, #1a3a5c 60%, #0d4a4a 100%)',
            borderRadius: C.radius,
            padding: '28px 32px',
            marginBottom: 24,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ::before — top-right decorative circle */}
          <div
            style={{
              content: '',
              position: 'absolute',
              top: -60,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(13,148,136,0.25), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* ::after — bottom-center decorative circle */}
          <div
            style={{
              content: '',
              position: 'absolute',
              bottom: -80,
              left: '30%',
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(20,184,166,0.1), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* .page-hero h4 */}
          <h4
            style={{
              fontWeight: 800,
              fontSize: '1.3rem',
              margin: '0 0 4px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileText size={22} />
            Applications
          </h4>
          {/* .page-hero p */}
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13.5,
              margin: 0,
              position: 'relative',
            }}
          >
            Track and monitor all job applications across the platform
          </p>
        </div>

        {/* ── STAT CARDS  (row g-3 mb-4 → 4 cols on md, 2 on sm) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
          className="aap-stat-grid"
        >
          {/* ── Total Applications (amber) ── */}
          <div
            className="aap-stat-card aap-stat-amber"
            onClick={() => filterByStat('')}
          >
            {/* .stat-top */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {/* .stat-label */}
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>
                  Total Applications
                </div>
                {/* .stat-value */}
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                  {statCounts.total}
                </div>
              </div>
              {/* .stat-icon */}
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fffbeb', color: '#f59e0b',
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>
            </div>
            {/* CTA line */}
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={10} /> Show all
            </div>
          </div>

          {/* ── Hired (green) ── */}
          <div
            className="aap-stat-card aap-stat-green"
            onClick={() => filterByStat('HIRED')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Hired</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>
                  {statCounts.hired}
                </div>
              </div>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f0fdf4', color: '#22c55e', flexShrink: 0,
                }}
              >
                <CheckCircle size={20} />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={10} /> Filter hired
            </div>
          </div>

          {/* ── Shortlisted (yellow) ── */}
          <div
            className="aap-stat-card aap-stat-yellow"
            onClick={() => filterByStat('SHORTLISTED')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Shortlisted</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
                  {statCounts.shortlisted}
                </div>
              </div>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fffbeb', color: '#f59e0b', flexShrink: 0,
                }}
              >
                <Star size={20} />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={10} /> Filter shortlisted
            </div>
          </div>

          {/* ── Applied (blue) ── */}
          <div
            className="aap-stat-card aap-stat-blue"
            onClick={() => filterByStat('APPLIED')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Applied</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>
                  {statCounts.applied}
                </div>
              </div>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#eff6ff', color: '#3b82f6', flexShrink: 0,
                }}
              >
                <Send size={20} />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={10} /> Filter applied
            </div>
          </div>
        </div>

        {/* Responsive stat grid for smaller screens */}
        <style>{`
          @media (max-width: 991px) { .aap-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
          @media (max-width: 480px) { .aap-stat-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* ── TABLE CARD ── */}
        {/* Mirrors: .table-card + .table-card-header + table + .pagination-wrapper */}
        <div
          ref={tableCardRef}
          style={{
            background: '#fff',
            borderRadius: C.radius,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: C.shadow,
          }}
        >
          {/* .table-card-header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {/* .table-card-title */}
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: C.text,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <FileText size={15} color={C.teal} />
              All Applications
            </span>

            {/* .filter-bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* .search-box */}
              <div className="aap-search-box">
                <Search size={14} color={C.sub} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search candidate, job…"
                  defaultValue={searchKeyword}
                  onChange={(e) => onSearchInput(e.target.value)}
                />
              </div>

              {/* Status filter — .filter-select */}
              <select
                className="aap-filter-select"
                value={statusKeyword}
                onChange={(e) => onStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Per-page — .filter-select */}
              <select
                className="aap-filter-select"
                value={perPage}
                onChange={(e) => onPerPageChange(e.target.value)}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* .table-responsive */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13.5,
              }}
            >
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['#', 'Candidate', 'Job Title', 'Company', 'Status', 'Date Applied'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        color: C.sub,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.8px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="aap-tbody">
                {/* ── Loading state ── */}
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Loader2
                          size={18}
                          style={{ animation: 'aapSpin 1s linear infinite', color: '#0d9488' }}
                        />
                        Loading…
                      </div>
                    </td>
                  </tr>
                )}

                {/* ── Error state ── */}
                {!loading && error && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', color: '#dc2626', padding: 32 }}
                    >
                      <AlertTriangle
                        size={28}
                        style={{ display: 'block', margin: '0 auto 8px' }}
                      />
                      Failed to load. Please refresh.
                    </td>
                  </tr>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}
                    >
                      <Inbox
                        size={36}
                        style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }}
                      />
                      No applications found
                    </td>
                  </tr>
                )}

                {/* ── Data rows ── */}
                {!loading && !error && rows.map((app, i) => (
                  <tr key={app.applicationId ?? app.id ?? i}>
                    {/* # */}
                    <td style={{ padding: '12px 16px', color: C.sub, borderBottom: '1px solid #f8fafc' }}>
                      {globalOffset + i + 1}
                    </td>

                    {/* Candidate — name + email */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                      <strong style={{ color: C.text, fontSize: 13.5 }}>
                        {app.candidateName ?? 'N/A'}
                      </strong>
                      {app.candidateEmail && (
                        <>
                          <br />
                          <small style={{ color: '#94a3b8', fontSize: 11.5 }}>
                            {app.candidateEmail}
                          </small>
                        </>
                      )}
                    </td>

                    {/* Job Title */}
                    <td style={{ padding: '12px 16px', color: C.text, borderBottom: '1px solid #f8fafc' }}>
                      {app.jobTitle ?? 'N/A'}
                    </td>

                    {/* Company */}
                    <td style={{ padding: '12px 16px', color: C.sub, borderBottom: '1px solid #f8fafc' }}>
                      {app.companyName ?? 'N/A'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                      <StatusBadge status={app.applicationStatus} />
                    </td>

                    {/* Date Applied */}
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#94a3b8',
                        fontSize: 12.5,
                        borderBottom: '1px solid #f8fafc',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDate(app.appliedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION WRAPPER ── */}
          {/* Mirrors: .pagination-wrapper + .pagination-info + .pagination (Bootstrap) */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {/* .pagination-info */}
            <div style={{ fontSize: 13, color: C.sub }}>
              {paginationInfoText}
            </div>

            {/* .pagination — Bootstrap-style nav */}
            {totalPages > 1 && (
              <nav>
                <ul
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {/* Prev */}
                  <li>
                    <button
                      className={`aap-page-link${currentPage === 0 ? ' disabled' : ''}`}
                      disabled={currentPage === 0}
                      onClick={() => goToPage(currentPage - 1)}
                      aria-label="Previous"
                    >
                      <ChevronLeft size={11} />
                    </button>
                  </li>

                  {/* Page numbers with ellipsis */}
                  {(() => {
                    const items = [];
                    let prev = null;
                    for (const p of pageNumbers) {
                      if (prev !== null && p - prev > 1) {
                        items.push(
                          <li key={`ellipsis-${p}`}>
                            <span className="aap-page-link disabled">…</span>
                          </li>,
                        );
                      }
                      items.push(
                        <li key={p}>
                          <button
                            className={`aap-page-link${p === currentPage ? ' active' : ''}`}
                            onClick={() => goToPage(p)}
                          >
                            {p + 1}
                          </button>
                        </li>,
                      );
                      prev = p;
                    }
                    return items;
                  })()}

                  {/* Next */}
                  <li>
                    <button
                      className={`aap-page-link${currentPage >= totalPages - 1 ? ' disabled' : ''}`}
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => goToPage(currentPage + 1)}
                      aria-label="Next"
                    >
                      <ChevronRight size={11} />
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
        {/* /table-card */}

    </div>
  );
};

export default AdminApplications;
