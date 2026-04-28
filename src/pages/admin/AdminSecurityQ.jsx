import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldOff,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const PAGE_SIZE = 10;
const MAX_CHARS = 250;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtDate = (str) =>
  str
    ? new Date(str).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const todayString = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
    const styles = {
      success: { bg: '#15803d', Icon: CheckCircle },
      danger:  { bg: '#b91c1c', Icon: AlertCircle },
      warning: { bg: '#b45309', Icon: AlertTriangle },
    };
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(({ id, message, type }) => {
          const { bg, Icon } = styles[type] || styles.success;
          return (
            <div
              key={id}
              className="flex items-center gap-2.5 px-[18px] py-3 rounded-xl text-white text-[13.5px] font-['DM_Sans'] min-w-[240px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] border-l-[3px] border-l-white/30"
              style={{ background: bg, animation: 'sqToastIn .3s ease' }}
            >
              <Icon size={15} className="shrink-0" />
              <span>{message}</span>
            </div>
          );
        })}
      </div>
    );
  };
  return { push, Toasts };
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const AdminSecurityQ = () => {
  const { authFetch, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  
  const isAdmin = user?.role === 'ADMIN'; /* sub-admins: view only, no add/toolbar */
  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  
  const { push: toast, Toasts } = useToast();

  /* ── Data ── */
  const [allQuestions,   setAllQuestions]   = useState([]);
  const [filteredList,   setFilteredList]   = useState([]);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [loadingList,    setLoadingList]    = useState(true);

  /* ── Add form ── */
  const [newText,   setNewText]   = useState('');
  const [addBusy,   setAddBusy]   = useState(false);

  /* ── Search / filter ── */
  const [searchVal,   setSearchVal]   = useState('');
  const searchTimer = useRef(null);

  /* ── Refs ── */
  const tableCardRef = useRef(null);

  /* ─────────────────────────────────────────
     LOAD
  ───────────────────────────────────────── */
  const loadQuestions = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/security-questions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.content || []);
      setAllQuestions(list);
      setFilteredList(list);
      setCurrentPage(1);
    } catch {
      toast('Failed to load security questions.', 'danger');
      setAllQuestions([]);
      setFilteredList([]);
    } finally {
      setLoadingList(false);
    }
  }, [authFetch, toast]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  /* ─────────────────────────────────────────
     SEARCH / FILTER (client-side, debounced)
  ───────────────────────────────────────── */
  const handleSearch = (value) => {
    setSearchVal(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = value.trim().toLowerCase();
      setFilteredList(
        !q
          ? [...allQuestions]
          : allQuestions.filter((sq) =>
              (sq.questionText || sq.question || '').toLowerCase().includes(q),
            ),
      );
      setCurrentPage(1);
    }, 300);
  };

  /* ─────────────────────────────────────────
     PAGINATION — client-side
  ───────────────────────────────────────── */
  const total     = filteredList.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageStart  = (currentPage - 1) * PAGE_SIZE;
  const pageSlice  = filteredList.slice(pageStart, pageStart + PAGE_SIZE);

  const goPage = (n) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
    tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* page buttons: all page numbers (same as HTML — no ellipsis in original) */
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

  /* ─────────────────────────────────────────
     ADD QUESTION
  ───────────────────────────────────────── */
  const addQuestion = async () => {
    const text = newText.trim();
    if (!text) { toast('Please enter a question text.', 'warning'); return; }
    if (text.length < 10) { toast('Question must be at least 10 characters.', 'warning'); return; }
    setAddBusy(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/security-questions`, {
        method: 'POST',
        body: JSON.stringify({ question: text, questionText: text }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || 'Failed to add question.');
      }
      toast('Security question added successfully.', 'success');
      setNewText('');
      await loadQuestions();
    } catch (e) {
      toast(e.message || 'Failed to add question.', 'danger');
    } finally {
      setAddBusy(false);
    }
  };

  /* char counter class */
  const charCountClass = (() => {
    const n = newText.length;
    if (n >= MAX_CHARS) return 'over';
    if (n >= MAX_CHARS * 0.9) return 'warn';
    return '';
  })();

  /* ─────────────────────────────────────────
     Search highlight
  ───────────────────────────────────────── */
  const highlight = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${escapeRegex(query.trim())})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.trim().toLowerCase()
        ? <mark key={i} style={{ background: 'rgba(13,148,136,.2)', borderRadius: 3, padding: '0 2px' }}>{part}</mark>
        : part,
    );
  };

  /* ─────────────────────────────────────────
     Escape key on textarea → submit
  ───────────────────────────────────────── */
  const handleTextareaKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuestion(); }
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f2f5f9] font-['DM_Sans']">

      {/* Global keyframes */}
      <style>{`
        @keyframes sqToastIn  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes sqSlideIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sqShimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes sqSpin     { to { transform:rotate(360deg); } }

        /* .sq-card left bar animation */
        .sq-card { position:relative; overflow:hidden; }
        .sq-card::before {
          content:''; position:absolute;
          left:0; top:0; bottom:0; width:3px;
          background:linear-gradient(180deg,#0d9488,#14b8a6);
          border-radius:0 3px 3px 0;
          transform:scaleY(0); transform-origin:top;
          transition:transform .22s ease;
        }
        .sq-card:hover::before { transform:scaleY(1); }
        .sq-card:hover { box-shadow:0 6px 24px rgba(11,34,57,.1); border-color:rgba(13,148,136,.3) !important; transform:translateY(-2px); }
        .sq-card:hover .sq-num { background:#0d9488 !important; color:#fff !important; }

        /* .sq-add-card focus-within */
        .sq-add-card:focus-within { border-color:#0d9488 !important; background:rgba(13,148,136,.04) !important; }

        /* .sq-add-input focus */
        .sq-add-input:focus { border-color:#0d9488 !important; box-shadow:0 0 0 3px rgba(13,148,136,.1) !important; outline:none; }

        /* toolbar search box focus-within */
        .sq-search-wrap:focus-within { border-color:#0d9488 !important; box-shadow:0 0 0 3px rgba(13,148,136,0.1) !important; }

        /* skeleton shimmer */
        .sq-skel {
          background:linear-gradient(90deg,#f0f4f8 25%,#e8edf3 50%,#f0f4f8 75%);
          background-size:200% 100%;
          animation:sqShimmer 1.4s infinite; border-radius:8px;
        }

        /* char counter states */
        .sqchar-warn { color:#f59e0b !important; }
        .sqchar-over { color:#ef4444 !important; font-weight:700 !important; }

        /* page-btn */
        .sq-page-btn {
          width:32px; height:32px; border-radius:8px;
          border:1.5px solid #e8ecf1; background:#f8fafc; color:#64748b;
          font-size:12.5px; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:all .18s; font-family:'DM Sans',sans-serif;
        }
        .sq-page-btn:hover:not(:disabled) { border-color:#0d9488; color:#0d9488; background:rgba(13,148,136,0.15); }
        .sq-page-btn.active { background:#0d9488; border-color:#0d9488; color:#fff; }
        .sq-page-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* btn-outline-clear */
        .sq-btn-clear { background:#f8fafc; color:#64748b; border:1.5px solid #e8ecf1; }
        .sq-btn-clear:hover { background:#e2e8f0; color:#0f172a; }

        /* btn-primary-teal */
        .sq-btn-teal { background:#0d9488; color:#fff; border:none; }
        .sq-btn-teal:hover:not(:disabled) { background:#0f766e; transform:translateY(-1px); box-shadow:0 6px 18px rgba(13,148,136,.28); }
        .sq-btn-teal:disabled { opacity:.6; cursor:not-allowed; transform:none; }

        /* toolbar search box */
        .sq-search-wrap input { border:none; outline:none; background:transparent; font-size:13px; color:#0f172a; font-family:'DM Sans',sans-serif; }
        .sq-search-wrap input::placeholder { color:#aab; }
      `}</style>

      <Toasts />

      {/* ═══════════════════════════════════════
          TOPBAR
          .topbar: white, border-bottom #e8ecf1,
          padding 14px 28px, sticky, z-100,
          box-shadow 0 1px 0 rgba(0,0,0,0.04)
      ═══════════════════════════════════════ */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Security Questions</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">{todayString()}</p>
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

      {/* ═══════════════════════════════════════
          .content  { padding: 24px 28px }
      ═══════════════════════════════════════ */}
      <div>

        {/* ── PAGE HERO ──
            .page-hero: gradient 135→ #0b2239 / #1a3a5c / #0d4a4a,
            radius 14px, padding 28px 32px, mb 24px, white, relative, overflow-hidden
            ::before  top:-60px right:-40px  220×220 teal radial
            ::after   bottom:-80px left:30%  180×180 teal2 radial
            Contains inline hero stats: .hero-stats → .hero-stat → .hero-stat-val + .hero-stat-lbl
        ── */}
        <div
          className="relative overflow-hidden rounded-[14px] text-white mb-6"
          style={{
            background: 'linear-gradient(135deg,#0b2239 0%,#1a3a5c 60%,#0d4a4a 100%)',
            padding: '28px 32px',
          }}
        >
          {/* ::before */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              top: -60, right: -40, width: 220, height: 220,
              background: 'radial-gradient(circle,rgba(13,148,136,0.25),transparent 70%)',
            }}
          />
          {/* ::after */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              bottom: -80, left: '30%', width: 180, height: 180,
              background: 'radial-gradient(circle,rgba(20,184,166,0.1),transparent 70%)',
            }}
          />
          {/* Content — relative z-index 1 */}
          <div className="relative z-[1]">
            {/* .page-hero h4: font-weight 800, 1.3rem, mb 4px */}
            <h4 className="flex items-center gap-2 font-extrabold text-[1.3rem] m-0 mb-1">
              <ShieldCheck size={22} />
              Security Questions
            </h4>
            {/* .page-hero p: color white/55, 13.5px, mb 16px */}
            <p className="text-[13.5px] text-white/55 m-0 mb-4">
              Manage the pool of security questions users answer during account recovery and identity verification.
            </p>
            {/* .hero-stats: flex gap-6 flex-wrap */}
            <div className="flex gap-6 flex-wrap">
              {/* .hero-stat: flex flex-col gap-0.5 */}
              <div className="flex flex-col gap-0.5">
                {/* .hero-stat-val: 22px, 800, white */}
                <div className="text-[22px] font-extrabold text-white">
                  {loadingList ? '—' : allQuestions.length}
                </div>
                {/* .hero-stat-lbl: 11.5px, white/45 */}
                <div className="text-[11.5px] text-white/45">Total Questions</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            ADD NEW QUESTION CARD  (admin only)
            .sq-add-card: teal tint gradient bg,
            border 2px dashed rgba(13,148,136,.25),
            radius 14px, padding 24px
        ══════════════════════════════════════ */}
        {isAdmin && (
          <div
            id="addCard"
            className="sq-add-card rounded-[14px] mb-5 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg,rgba(13,148,136,.04) 0%,rgba(20,184,166,.02) 100%)',
              border: '2px dashed rgba(13,148,136,.25)',
              padding: 24,
            }}
          >
            {/* Title row — .table-card-title style with custom icon box */}
            <div className="flex items-center gap-2 text-[13.5px] font-bold text-[#0f172a] mb-3">
              <div
                className="flex items-center justify-center shrink-0 text-[#0d9488]"
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(13,148,136,.12)',
                  fontSize: 14,
                }}
              >
                <Plus size={14} />
              </div>
              Add New Security Question
            </div>

            {/* .sq-add-input: full width, 12px 16px padding, 1.5px border #e8ecf1,
                 radius 10px, 14px, DM Sans, teal on focus, mb 12px */}
            <textarea
              rows={2}
              maxLength={MAX_CHARS}
              className="sq-add-input w-full text-[14px] text-[#0f172a] bg-white rounded-[10px] transition-all font-['DM_Sans'] resize-none"
              style={{ padding: '12px 16px', border: '1.5px solid #e8ecf1', marginBottom: 12 }}
              placeholder="e.g. What was the name of your first pet?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={handleTextareaKey}
            />

            {/* .sq-char-count: 11px, sub color, text-right, mt 4px */}
            <div
              className={`text-right text-[11px] text-[#64748b] mt-1 ${
                charCountClass === 'warn' ? 'sqchar-warn' : charCountClass === 'over' ? 'sqchar-over' : ''
              }`}
            >
              {newText.length} / {MAX_CHARS}
            </div>

            {/* Bottom row: info tip + action buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2.5 mt-3">
              <p className="text-[12px] text-[#64748b] m-0 flex items-center gap-1.5">
                <Info size={13} className="text-[#0d9488] shrink-0" />
                Questions should be personal, memorable, and not easily guessable.
              </p>
              <div className="flex gap-2">
                {/* .toolbar-btn.btn-outline-clear */}
                <button
                  onClick={() => setNewText('')}
                  className="sq-btn-clear inline-flex items-center gap-[7px] rounded-[10px] text-[13px] font-semibold cursor-pointer font-['DM_Sans'] transition-all"
                  style={{ padding: '9px 18px' }}
                >
                  <X size={13} /> Clear
                </button>
                {/* .toolbar-btn.btn-primary-teal */}
                <button
                  onClick={addQuestion}
                  disabled={addBusy || newText.length > MAX_CHARS}
                  className="sq-btn-teal inline-flex items-center gap-[7px] rounded-[10px] text-[13px] font-semibold cursor-pointer font-['DM_Sans'] transition-all"
                  style={{ padding: '9px 18px' }}
                >
                  {addBusy
                    ? <Loader2 size={13} style={{ animation: 'sqSpin 1s linear infinite' }} />
                    : <Plus size={13} />}
                  {addBusy ? 'Adding…' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TOOLBAR  (admin only — hidden for sub-admin)
            .toolbar: white bg, radius 14px, border #e8ecf1,
            padding 16px 20px, mb 20px, flex items-center gap-3, shadow
        ══════════════════════════════════════ */}
        {isAdmin && (
          <div
            className="bg-white rounded-[14px] border border-[#e8ecf1] flex items-center gap-3 flex-wrap mb-5"
            style={{ padding: '16px 20px', boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
          >
            {/* .search-box (toolbar variant):
                radius 10px, padding 8px 14px, flex 1, min-width 200px,
                focus-within → shadow */}
            <div
              className="sq-search-wrap flex items-center gap-2 flex-1 min-w-[200px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] transition-all"
              style={{ borderRadius: 10, padding: '8px 14px' }}
            >
              <Search size={14} className="text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Search questions…"
                value={searchVal}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
                className="flex-1 min-w-0"
              />
            </div>

            {/* Right side: results count + refresh button */}
            <div className="ml-auto flex items-center gap-2">
              {/* .results-count: 12.5px, sub color, bg #f8fafc, border #e8ecf1, radius 99px, padding 4px 12px */}
              <span
                className="text-[12.5px] text-[#64748b] bg-[#f8fafc] border border-[#e8ecf1] rounded-full"
                style={{ padding: '4px 12px' }}
              >
                {total} question{total !== 1 ? 's' : ''}
              </span>

              {/* .toolbar-btn.btn-outline-clear: 9px 18px, radius 10px, 13px, 600 */}
              <button
                onClick={loadQuestions}
                className="sq-btn-clear inline-flex items-center gap-[7px] rounded-[10px] text-[13px] font-semibold cursor-pointer font-['DM_Sans'] transition-all"
                style={{ padding: '9px 18px' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TABLE CARD
            .table-card: white, radius 14px, border #e8ecf1,
            overflow-hidden, shadow
        ══════════════════════════════════════ */}
        <div
          ref={tableCardRef}
          className="bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(11,34,57,0.08)' }}
        >
          {/* .table-card-header: padding 16px 20px, border-bottom #f1f5f9,
               flex justify-between items-center flex-wrap gap-2.5 */}
          <div
            className="flex justify-between items-center flex-wrap gap-2.5"
            style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}
          >
            {/* .table-card-title */}
            <span className="flex items-center gap-[7px] text-[13.5px] font-bold text-[#0f172a]">
              <ShieldCheck size={15} className="text-[#0d9488]" />
              Question Pool
            </span>
            {/* .results-count badge */}
            <span
              className="text-[12.5px] text-[#64748b] bg-[#f8fafc] border border-[#e8ecf1] rounded-full"
              style={{ padding: '4px 12px' }}
            >
              {loadingList ? '—' : `${total} result${total !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* ── SKELETON (shown while loading) ── */}
          {loadingList && (
            <div className="flex flex-col gap-3" style={{ padding: 20 }}>
              {[1, 0.7, 0.4].map((opacity, idx) => (
                <div
                  key={idx}
                  className="sq-card flex items-start gap-[14px] rounded-[14px] border-[1.5px] border-[#e8ecf1] transition-all"
                  style={{ padding: '18px 20px', opacity, animation: 'none' }}
                >
                  <div className="sq-skel shrink-0" style={{ width: 32, height: 32, borderRadius: 9 }} />
                  <div className="flex-1">
                    <div className="sq-skel mb-2" style={{ height: 16, width: `${[75, 60, 82][idx]}%` }} />
                    <div className="sq-skel" style={{ height: 12, width: `${[40, 30, 25][idx]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!loadingList && total === 0 && (
            <div className="text-center py-14 px-6 text-[#94a3b8]">
              {/* .sq-empty-icon: 68px circle, teal bg 8%, teal color, flex center, 1.8rem */}
              <div
                className="flex items-center justify-center mx-auto mb-4 rounded-full"
                style={{
                  width: 68, height: 68,
                  background: 'rgba(13,148,136,.08)',
                  color: '#0d9488',
                  fontSize: '1.8rem',
                }}
              >
                <ShieldOff size={29} />
              </div>
              <h6 className="font-bold text-[#64748b] mb-1.5">No questions found</h6>
              <p className="text-[13.5px]">
                {searchVal ? 'Try a different search term.' : 'Add a new question above.'}
              </p>
            </div>
          )}

          {/* ── QUESTION CARDS ── */}
          {!loadingList && total > 0 && (
            <div className="flex flex-col gap-2.5" style={{ padding: '16px 20px', display: 'flex' }}>
              {pageSlice.map((sq, i) => {
                const id       = sq.questionId ?? sq.securityQuestionId ?? sq.id ?? i;
                const text     = sq.questionText || sq.question || '(No text)';
                const globalIdx = pageStart + i;
                const animDelay = `${(i % PAGE_SIZE) * 0.035}s`;

                return (
                  <div
                    key={id}
                    /* .sq-card */
                    className="sq-card flex items-start gap-[14px] bg-white border-[1.5px] border-[#e8ecf1] rounded-[14px] transition-all duration-200"
                    style={{ padding: '18px 20px', animation: `sqSlideIn .3s ease ${animDelay} both` }}
                  >
                    {/* .sq-num: 32px, radius 9px, teal bg rgba(13,148,136,.1), teal color,
                         flex center, 13px, 800 weight, shrink-0 */}
                    <div
                      className="sq-num flex items-center justify-center shrink-0 text-[#0d9488] font-extrabold text-[13px] transition-all duration-200"
                      style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(13,148,136,.1)',
                        marginTop: 2,
                      }}
                    >
                      {globalIdx + 1}
                    </div>

                    {/* .sq-body */}
                    <div className="flex-1 min-w-0">
                      {/* .sq-text: 14px, 600, text color, line-height 1.5, mb 6px, word-break break-word */}
                      <div
                        className="text-[14px] font-semibold text-[#0f172a] break-words"
                        style={{ lineHeight: 1.5, marginBottom: 6 }}
                      >
                        {highlight(text, searchVal)}
                      </div>

                      {/* .sq-meta: flex items-center gap-2.5 flex-wrap */}
                      {sq.createdAt && (
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* .sq-meta-tag: inline-flex gap-1, 11px, 500, sub color,
                               bg #f8fafc, border #e8ecf1, radius 99px, padding 2px 10px */}
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748b] bg-[#f8fafc] border border-[#e8ecf1] rounded-full"
                            style={{ padding: '2px 10px' }}
                          >
                            <Calendar size={10} />
                            {fmtDate(sq.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PAGINATION ──
              .pagination-wrap: padding 14px 20px, border-top #f1f5f9,
              flex justify-between items-center flex-wrap gap-2.5
              .pagination-info: 13px, sub color
              .pagination-btns: flex gap-1
              .page-btn: 32px, radius 8px, border 1.5px #e8ecf1, bg #f8fafc,
                          sub color, 12.5px, 600, flex center
          ── */}
          {!loadingList && totalPages > 1 && (
            <div
              className="flex justify-between items-center flex-wrap gap-2.5"
              style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}
            >
              {/* .pagination-info */}
              <div className="text-[13px] text-[#64748b]">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, total)} of {total}
              </div>

              {/* .pagination-btns */}
              <div className="flex gap-1">
                {/* Prev */}
                <button
                  className="sq-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => goPage(currentPage - 1)}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </button>

                {pageNums.map((p) => (
                  <button
                    key={p}
                    className={`sq-page-btn${p === currentPage ? ' active' : ''}`}
                    onClick={() => goPage(p)}
                  >
                    {p}
                  </button>
                ))}

                {/* Next */}
                <button
                  className="sq-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => goPage(currentPage + 1)}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        {/* /table-card */}

        {/* ══════════════════════════════════════
            SUB-ADMIN READ-ONLY NOTICE
            Shown beneath the table for sub-admins.
            In the original HTML the "restricted view" block (sq-restricted)
            is hidden by JS — sub-admins just see the list with no controls.
            We keep the same behavior but add a small info strip so it's
            clear they're in view-only mode.
        ══════════════════════════════════════ */}
        {!isAdmin && (
          <div
            className="flex items-center gap-2 rounded-[14px] text-[13px] text-[#92400e] mt-4"
            style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px' }}
          >
            <Info size={15} className="shrink-0" />
            <span>
              You have <strong>view-only</strong> access to security questions. Contact an Admin to add or manage questions.
            </span>
          </div>
        )}
      </div>
      {/* /content */}
    </div>
  );
};

export default AdminSecurityQ;
