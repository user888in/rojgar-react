import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookMarked,
  CalendarPlus,
  Star,
  Search,
  Plus,
  Pencil,
  Inbox,
  AlertTriangle,
  Loader2,
  X,
  Info,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const thisMonthCount = (list) => {
  const now = new Date();
  return list.filter((c) => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
};

/* ─────────────────────────────────────────
   Toast hook
───────────────────────────────────────── */
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const Toasts = () => {
    const bg = { success: 'bg-[#15803d]', danger: 'bg-[#b91c1c]', warning: 'bg-[#b45309]' };
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-[18px] py-3 rounded-xl text-white text-[13.5px] font-['DM_Sans'] min-w-[240px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] border-l-[3px] border-l-white/30 animate-[toastIn_.3s_ease] ${bg[t.type] || bg.success}`}
          >
            {t.type === 'success' && <CheckCircle size={15} className="shrink-0" />}
            {t.type === 'danger' && <AlertCircle size={15} className="shrink-0" />}
            {t.type === 'warning' && <AlertTriangle size={15} className="shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    );
  };
  return { push: push, Toasts };
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AdminBlogCategories = () => {
  const { getAuthHeaders, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  
  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  
  const { push: toast, Toasts } = useToast();

  /* ── Data state (client-side filter + pagination) ── */
  const [allCategories,      setAllCategories]      = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [currentPage,        setCurrentPage]        = useState(1);
  const perPage = 15;

  /* ── UI state ── */
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);

  /* ── Add form ── */
  const [newName,    setNewName]    = useState('');
  const [addBusy,    setAddBusy]    = useState(false);

  /* ── Search ── */
  const [searchVal, setSearchVal] = useState('');
  const searchTimer = useRef(null);

  /* ── Edit modal ── */
  const [editOpen,   setEditOpen]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [editName,   setEditName]   = useState('');
  const [editBusy,   setEditBusy]   = useState(false);

  /* ── Table card ref for scroll ── */
  const tableCardRef = useRef(null);

  /* ─────────────────────────────────────────
     LOAD
  ───────────────────────────────────────── */
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/public/blog-categories`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllCategories(data);
      setFilteredCategories(data);
      setCurrentPage(1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  /* ─────────────────────────────────────────
     Derived stats
  ───────────────────────────────────────── */
  const statTotal  = allCategories.length;
  const statMonth  = thisMonthCount(allCategories);
  const statLatest = allCategories.length ? allCategories[allCategories.length - 1].name : '—';

  /* ─────────────────────────────────────────
     CLIENT-SIDE FILTER
  ───────────────────────────────────────── */
  const filterCategories = (keyword) => {
    clearTimeout(searchTimer.current);
    setSearchVal(keyword);
    searchTimer.current = setTimeout(() => {
      const kw = keyword.toLowerCase().trim();
      setFilteredCategories(
        !kw ? [...allCategories] : allCategories.filter((c) => c.name.toLowerCase().includes(kw)),
      );
      setCurrentPage(1);
    }, 300);
  };

  /* ─────────────────────────────────────────
     PAGINATION (1-indexed client-side)
  ───────────────────────────────────────── */
  const totalPages  = Math.ceil(filteredCategories.length / perPage);
  const startIdx    = (currentPage - 1) * perPage;
  const endIdx      = Math.min(startIdx + perPage, filteredCategories.length);
  const pageData    = filteredCategories.slice(startIdx, endIdx);

  const paginationInfo = filteredCategories.length === 0
    ? 'No results found'
    : `Showing ${startIdx + 1}–${endIdx} of ${filteredCategories.length} categories`;

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* visible page numbers with ellipsis */
  const pageNumbers = (() => {
    const visible = new Set([1, totalPages]);
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) visible.add(i);
    return [...visible].sort((a, b) => a - b);
  })();

  /* ─────────────────────────────────────────
     ADD
  ───────────────────────────────────────── */
  const addCategory = async () => {
    const name = newName.trim();
    if (!name) { toast('Please enter a category name', 'warning'); return; }
    setAddBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blog-categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
      setNewName('');
      setSearchVal('');
      toast(`Category "${name}" added successfully ✓`);
      await loadCategories();
    } catch (err) {
      toast(err.message || 'Failed to add category', 'danger');
    } finally {
      setAddBusy(false);
    }
  };

  /* ─────────────────────────────────────────
     EDIT
  ───────────────────────────────────────── */
  const openEdit = (id, name) => { setEditId(id); setEditName(name); setEditOpen(true); };

  const saveEdit = async () => {
    if (!editName.trim()) { toast('Category name cannot be empty', 'warning'); return; }
    setEditBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blog-categories/${editId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditOpen(false);
      toast('Category updated successfully ✓');
      await loadCategories();
    } catch (err) {
      toast(err.message || 'Failed to update', 'danger');
    } finally {
      setEditBusy(false);
    }
  };

  /* ─────────────────────────────────────────
     Escape key closes modals
  ───────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') { setEditOpen(false); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f2f5f9] font-['DM_Sans']">

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes modalIn  { from { opacity:0; transform:scale(.88) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin     { to { transform:rotate(360deg); } }

        /* Stat card bottom bar animation */
        .bc-stat-card { position:relative; overflow:hidden; }
        .bc-stat-card::after {
          content:''; position:absolute; bottom:0; left:0; right:0; height:3px;
          transform:scaleX(0); transform-origin:left; transition:transform .35s;
        }
        .bc-stat-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.09); }
        .bc-stat-card:hover::after { transform:scaleX(1); }
        .bc-teal::after   { background:linear-gradient(90deg,#0d9488,#14b8a6); }
        .bc-sky::after    { background:linear-gradient(90deg,#0ea5e9,#7dd3fc); }
        .bc-violet::after { background:linear-gradient(90deg,#8b5cf6,#c4b5fd); }

        /* pm-header decorative ring */
        .bc-pm-header::before {
          content:''; position:absolute; top:-60px; right:-40px;
          width:180px; height:180px; border-radius:50%;
          background:radial-gradient(circle,rgba(13,148,136,0.3),transparent 70%);
          pointer-events:none;
        }

        /* table row hover */
        .bc-tbody tr:hover td { background:#f8fafc; }

        /* page link */
        .bc-page-link { display:inline-flex; align-items:center; justify-content:center; min-width:34px; height:34px; padding:0 10px; font-size:13px; color:#0b2239; border:1px solid #e8ecf1; border-radius:4px; background:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .bc-page-link:hover:not(:disabled) { background:#f1f5f9; }
        .bc-page-link.active { background:#0b2239; border-color:#0b2239; color:#fff; cursor:default; }
        .bc-page-link.disabled { color:#cbd5e1; pointer-events:none; cursor:not-allowed; }

        /* pm-close-btn hover */
        .bc-close-btn:hover { background:rgba(255,255,255,0.15) !important; color:#fff !important; }

        /* search focus */
        .bc-search-wrap:focus-within { border-color:#0d9488 !important; }
        .bc-pm-input:focus { border-color:#0d9488 !important; box-shadow:0 0 0 3px rgba(13,148,136,0.1) !important; outline:none; }
      `}</style>

      <Toasts />

      {/* ══════════════════════════════════════════
          TOPBAR
          Exact: .topbar → sticky white, border-bottom #e8ecf1,
          padding 14px 28px, box-shadow 0 1px 0 rgba(0,0,0,0.04)
      ══════════════════════════════════════════ */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Blog Categories</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">Create and manage blog categories used across the platform</p>
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

      {/* ══════════════════════════════════════════
          CONTENT  .content { padding: 24px 28px }
      ══════════════════════════════════════════ */}
      <div>

        {/* ── PAGE HERO ──
            .page-hero: gradient 135→navy/1a3a5c/0d4a4a, radius 14px,
            padding 28px 32px, mb 24px, white text, relative, overflow-hidden
            ::before top-right teal circle, ::after bottom-center lighter circle
        ── */}
        <div
          className="relative overflow-hidden rounded-[14px] text-white mb-6"
          style={{
            background: 'linear-gradient(135deg, #0b2239 0%, #1a3a5c 60%, #0d4a4a 100%)',
            padding: '28px 32px',
          }}
        >
          {/* ::before */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              top: -60, right: -40, width: 220, height: 220,
              background: 'radial-gradient(circle, rgba(13,148,136,0.25), transparent 70%)',
            }}
          />
          {/* ::after */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              bottom: -80, left: '30%', width: 180, height: 180,
              background: 'radial-gradient(circle, rgba(20,184,166,0.1), transparent 70%)',
            }}
          />
          <h4 className="relative flex items-center gap-2 font-extrabold text-[1.3rem] m-0 mb-1">
            <BookMarked size={22} />
            Blog Categories
          </h4>
          <p className="relative text-[13.5px] text-white/55 m-0">
            Create and manage blog categories used across the platform
          </p>
        </div>

        {/* ══════════════════════════════════════════
            STAT CARDS — 3-col grid
            teal / sky / violet variants
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* Total — teal */}
          <div
            className="bc-stat-card bc-teal bg-white rounded-[14px] border border-[#e8ecf1] transition-all duration-200"
            style={{ padding: '20px 22px', boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
          >
            {/* .stat-top */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] text-[#64748b] mb-1">Total Categories</div>
                <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">
                  {loading ? '--' : statTotal}
                </div>
              </div>
              {/* .stat-icon teal */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}
              >
                <BookMarked size={20} />
              </div>
            </div>
          </div>

          {/* Added This Month — sky */}
          <div
            className="bc-stat-card bc-sky bg-white rounded-[14px] border border-[#e8ecf1] transition-all duration-200"
            style={{ padding: '20px 22px', boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] text-[#64748b] mb-1">Added This Month</div>
                <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">
                  {loading ? '--' : statMonth}
                </div>
              </div>
              {/* sky icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#f0f9ff', color: '#0ea5e9' }}
              >
                <CalendarPlus size={20} />
              </div>
            </div>
          </div>

          {/* Latest Category — violet */}
          <div
            className="bc-stat-card bc-violet bg-white rounded-[14px] border border-[#e8ecf1] transition-all duration-200"
            style={{ padding: '20px 22px', boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] text-[#64748b] mb-1">Latest Category</div>
                {/* font-size:14px;margin-top:4px;line-height:1.3 */}
                <div
                  className="font-extrabold text-[#0f172a] leading-[1.3]"
                  style={{ fontSize: 14, marginTop: 4 }}
                >
                  {loading ? '--' : statLatest}
                </div>
              </div>
              {/* violet icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#f5f3ff', color: '#8b5cf6' }}
              >
                <Star size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SUB-ADMIN READ-ONLY NOTICE
        ══════════════════════════════════════════ */}
        {isSubAdmin && (
          <div
            className="flex items-center gap-2 rounded-[14px] text-[13px] text-[#92400e] mb-[18px]"
            style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px' }}
          >
            <Info size={16} className="shrink-0" />
            <span>
              You have <strong>view-only</strong> access to blog categories. Contact an Admin to add or edit categories.
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ADD CATEGORY CARD (admin only)
        ══════════════════════════════════════════ */}
        {!isSubAdmin && (
          <div
            className="bg-white rounded-[14px] border border-[#e8ecf1] mb-5"
            style={{ padding: '20px 22px', boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
          >
            <div className="flex items-center gap-[7px] text-[13.5px] font-bold text-[#0f172a] mb-4">
              <Plus size={15} className="text-[#0d9488]" />
              Add New Blog Category
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="bc-pm-input w-full text-[14px] text-[#0f172a] bg-white rounded-[10px] transition-all font-['DM_Sans']"
                  style={{ padding: '10px 14px', border: '1.5px solid #e8ecf1' }}
                  placeholder="e.g. Career Tips"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }}
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[110px]">
                <button
                  disabled={addBusy}
                  onClick={addCategory}
                  className="w-full flex items-center justify-center gap-1.5 text-white font-semibold text-[13.5px] rounded-full border-none cursor-pointer transition-all font-['DM_Sans'] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    padding: '9px 20px',
                    background: '#0d9488',
                    boxShadow: addBusy ? 'none' : undefined,
                  }}
                  onMouseEnter={(e) => { if (!addBusy) { e.currentTarget.style.background = '#0f766e'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(13,148,136,0.28)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {addBusy
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Plus size={14} />}
                  {addBusy ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TABLE CARD
        ══════════════════════════════════════════ */}
        <div
          ref={tableCardRef}
          className="bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
        >
          <div
            className="flex justify-between items-center flex-wrap gap-2.5"
            style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}
          >
            <span className="flex items-center gap-[7px] text-[13.5px] font-bold text-[#0f172a]">
              <BookMarked size={15} className="text-[#0d9488]" />
              All Blog Categories
            </span>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="bc-search-wrap flex items-center gap-2 transition-all"
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e8ecf1',
                  borderRadius: 99,
                  padding: '6px 14px',
                }}
              >
                <Search size={13} className="text-[#94a3b8] shrink-0" />
                <input
                  type="text"
                  className="border-none outline-none bg-transparent text-[13px] text-[#0f172a] font-['DM_Sans'] placeholder:text-[#aab] w-[180px]"
                  placeholder="Search categories…"
                  value={searchVal}
                  onChange={(e) => filterCategories(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {[
                    { label: '#',              w: 50  },
                    { label: 'Category Name',  w: null },
                    { label: 'Created',        w: 150 },
                    { label: 'Actions',        w: 120 },
                  ].map(({ label, w }) => (
                    <th
                      key={label}
                      style={{
                        padding: '11px 16px',
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e8ecf1',
                        width: w || undefined,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bc-tbody">
                {loading && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-[#94a3b8]">
                      <div className="flex items-center justify-content-center gap-2 justify-center">
                        <Loader2 size={16} className="text-[#0d9488]" style={{ animation: 'spin 1s linear infinite' }} />
                        Loading…
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[#dc2626]">
                      <AlertTriangle size={28} className="block mx-auto mb-2" />
                      Failed to load. Please refresh.
                    </td>
                  </tr>
                )}

                {!loading && !error && pageData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-[#94a3b8]">
                      <Inbox size={36} className="block mx-auto mb-2 opacity-50" />
                      No categories found.
                    </td>
                  </tr>
                )}

                {!loading && !error && pageData.map((cat, i) => (
                  <tr key={cat.id ?? cat.categoryId ?? i}>
                    <td style={{ padding: '12px 16px', color: '#64748b', borderBottom: '1px solid #f8fafc' }}>
                      {startIdx + i + 1}
                    </td>

                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-content-center justify-center text-white font-bold text-[12px] shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)' }}
                        >
                          {(cat.name || '?')[0].toUpperCase()}
                        </div>
                        <span
                          className="inline-flex items-center gap-[6px] text-[13px] font-medium"
                          style={{
                            padding: '5px 12px',
                            borderRadius: 20,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                          }}
                        >
                          <BookMarked size={12} />
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#94a3b8',
                        fontSize: 12.5,
                        borderBottom: '1px solid #f8fafc',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDate(cat.createdAt)}
                    </td>

                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                      {isSubAdmin ? (
                        <span className="text-[12px] italic text-[#94a3b8]">View only</span>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => openEdit(cat.id ?? cat.categoryId, cat.name)}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold cursor-pointer rounded-lg transition-all font-['DM_Sans'] border-[1.5px]"
                            style={{ padding: '5px 12px', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#d97706'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706'; e.currentTarget.style.borderColor = '#fde68a'; }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="flex justify-between items-center flex-wrap gap-2.5"
            style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}
          >
            <div className="text-[13px] text-[#64748b]">{paginationInfo}</div>

            {totalPages > 1 && (
              <nav>
                <ul className="flex items-center gap-0.5 list-none m-0 p-0">
                  <li>
                    <button
                      className={`bc-page-link${currentPage === 1 ? ' disabled' : ''}`}
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                    </button>
                  </li>

                  {(() => {
                    const items = [];
                    let prev = null;
                    for (const p of pageNumbers) {
                      if (prev !== null && p - prev > 1) {
                        items.push(
                          <li key={`dots-${p}`}>
                            <span className="bc-page-link disabled">…</span>
                          </li>,
                        );
                      }
                      items.push(
                        <li key={p}>
                          <button
                            className={`bc-page-link${p === currentPage ? ' active' : ''}`}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </button>
                        </li>,
                      );
                      prev = p;
                    }
                    return items;
                  })()}

                  <li>
                    <button
                      className={`bc-page-link${currentPage === totalPages ? ' disabled' : ''}`}
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
        </div>
      </div>
    </div>
      {/* ══════════════════════════════════════════
          EDIT MODAL
          .modal-content: border-none, radius 20px, overflow-hidden,
          box-shadow 0 24px 64px rgba(11,34,57,0.18)
      ══════════════════════════════════════════ */}
      {editOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div
            className="bg-white w-full max-w-[500px] rounded-[20px] overflow-hidden"
            style={{
              boxShadow: '0 24px 64px rgba(11,34,57,0.18)',
              animation: 'modalIn .3s cubic-bezier(.34,1.56,.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* .pm-header: navy bg, padding 20px 24px, flex between, relative, overflow-hidden */}
            {/* ::before decorative ring is in .bc-pm-header class */}
            <div
              className="bc-pm-header relative flex items-center justify-between overflow-hidden"
              style={{ background: '#0b2239', padding: '20px 24px' }}
            >
              {/* .pm-header-left */}
              <div className="relative flex items-center gap-[14px]">
                {/* .pm-big-avatar: 52px, radius 14px, teal gradient, white, flex center,
                     font-size 18px, font-weight 800, border 2px rgba(255,255,255,0.15) */}
                <div
                  className="flex items-center justify-center shrink-0 text-white font-extrabold"
                  style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg,#0d9488,#14b8a6)',
                    fontSize: 18,
                    border: '2px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Pencil size={18} />
                </div>
                <div>
                  {/* .pm-header-name */}
                  <p className="text-[16px] font-extrabold text-white m-0">Edit Blog Category</p>
                  {/* .pm-header-email */}
                  <p className="text-[12px] text-white/50 mt-[2px] m-0">Update the category name</p>
                </div>
              </div>
              {/* .pm-close-btn */}
              <button
                onClick={() => setEditOpen(false)}
                className="bc-close-btn relative z-[2] flex items-center justify-center cursor-pointer transition-all"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 16,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* .pm-body: padding 24px, bg white */}
            <div style={{ padding: 24, background: '#fff' }}>
              {/* .pm-form-group mb-4 */}
              <div className="mb-4">
                {/* .pm-label */}
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                  Category Name <span className="text-red-500">*</span>
                </label>
                {/* .pm-input */}
                <input
                  type="text"
                  className="bc-pm-input w-full text-[14px] text-[#0f172a] bg-white rounded-[10px] transition-all font-['DM_Sans']"
                  style={{ padding: '10px 14px', border: '1.5px solid #e8ecf1' }}
                  placeholder="Enter category name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                  autoFocus
                />
              </div>

              {/* .pm-footer: flex justify-end gap-2.5, mt-5, pt-4, border-top */}
              <div
                className="flex justify-end gap-2.5 mt-5 pt-4"
                style={{ borderTop: '1px solid #e8ecf1' }}
              >
                {/* .pm-btn.ghost */}
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold cursor-pointer border-none transition-all font-['DM_Sans']"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                >
                  Cancel
                </button>
                {/* .pm-btn.primary */}
                <button
                  onClick={saveEdit}
                  disabled={editBusy}
                  className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold text-white cursor-pointer border-none transition-all font-['DM_Sans'] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#0d9488' }}
                  onMouseEnter={(e) => { if (!editBusy) { e.currentTarget.style.background = '#0f766e'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(13,148,136,0.28)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {editBusy && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {editBusy ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminBlogCategories;
