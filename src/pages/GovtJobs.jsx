import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Landmark,
  Search,
  MapPin,
  Tag,
  LayoutGrid,
  Briefcase,
  Trophy,
  FileText,
  Key,
  X,
  Building2,
  Calendar,
  Info,
  Send,
  Lock,
  LogIn,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const PAGE_SIZE = 10;

const CAT_ICONS = {
  Railway: '🚂', Banking: '🏦', Defence: '🎖️', Police: '👮',
  Teaching: '👨‍🏫', SSC: '📋', UPSC: '🏛️', PSU: '🏢',
  General: '📌', Engineering: '⚙️', Medical: '🏥', Agriculture: '🌾',
};

const TYPE_META = {
  JOB: { label: 'Job', bg: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' },
  RESULT: { label: 'Result', bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
  ADMIT_CARD: { label: 'Admit Card', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
  ANSWER_KEY: { label: 'Answer Key', bg: 'bg-[#f3e8ff]', text: 'text-[#7e22ce]' },
};

const GovtJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [stats, setStats] = useState({ total: '--', active: '--' });
  const [sidebarData, setSidebarData] = useState({ states: [], quals: [], loading: true });
  const [categories, setCategories] = useState([]);

  // Filters State
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    state: searchParams.get('state') || '',
    qualification: '',
    category: '',
    type: '',
    activeStatus: '',
    sortOption: 'LATEST',
  });

  // Local inputs for debouncing search
  const [searchInput, setSearchInput] = useState(filters.keyword);
  const [stateInput, setStateInput] = useState(filters.state);
  const [catInput, setCatInput] = useState(filters.category);

  // Modals & Toasts
  const [detailModal, setDetailModal] = useState({ open: false, data: null, loading: false });
  const [loginModal, setLoginModal] = useState({ open: false, jobTitle: '' });
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Pending Apply Logic (Auth-aware)
  useEffect(() => {
    const checkPendingApply = async () => {
      const raw = localStorage.getItem('pendingGovtApply');
      if (!raw || !user) return;
      
      try {
        const pending = JSON.parse(raw);
        localStorage.removeItem('pendingGovtApply');
        if (!pending.jobId) return;

        const res = await fetch(`${API_BASE_URL}/govt-jobs/${pending.jobId}`);
        if (!res.ok) return;
        const job = await res.json();

        if (job.applyLink) {
          window.open(job.applyLink, '_blank', 'noopener,noreferrer');
          addToast('Opening official application page…', 'success');
        }
      } catch (err) {
        localStorage.removeItem('pendingGovtApply');
      }
    };
    checkPendingApply();
  }, [user]);

  // Sync URL Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.state) params.set('state', filters.state);
    setSearchParams(params, { replace: true });
  }, [filters.keyword, filters.state, setSearchParams]);

  // Load Sidebar & Categories
  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const [stRes, qRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/govt-jobs/states?page=0&size=100`),
          fetch(`${API_BASE_URL}/govt-jobs/qualifications?page=0&size=100`),
          fetch(`${API_BASE_URL}/govt-jobs/categories?page=0&size=100`)
        ]);

        const stData = await stRes.json();
        const qData = await qRes.json();
        const catData = await catRes.json();

        setSidebarData({
          states: (stData.content || []).filter(s => s?.trim()),
          quals: (qData.content || []).filter(q => q?.trim()),
          loading: false
        });
        setCategories((catData.content || []).filter(c => c?.trim()));
      } catch (err) {
        console.error('Dynamic data load error:', err);
        setSidebarData(prev => ({ ...prev, loading: false }));
      }
    };
    loadDynamicData();
  }, []);

  // Load Jobs
  const loadJobs = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const base = `${API_BASE_URL}/govt-jobs`;
      let url = '';

      if (filters.keyword) {
        const q = new URLSearchParams({ keyword: filters.keyword, page: targetPage, size: PAGE_SIZE });
        url = `${base}/search?${q}`;
      } else {
        const q = new URLSearchParams({ page: targetPage, size: PAGE_SIZE, sortOption: filters.sortOption });
        if (filters.state) q.append('state', filters.state);
        if (filters.qualification) q.append('qualification', filters.qualification);
        if (filters.category) q.append('category', filters.category);
        if (filters.type) q.append('type', filters.type);
        url = `${base}/filter?${q}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let fetchedJobs = data.content || [];
      
      // Client-side active status filter
      if (filters.activeStatus === 'active') fetchedJobs = fetchedJobs.filter(j => j.active);
      if (filters.activeStatus === 'expired') fetchedJobs = fetchedJobs.filter(j => !j.active);

      setJobs(fetchedJobs);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setPage(data.number || targetPage);
      
      setStats({
        total: data.totalElements || 0,
        active: fetchedJobs.filter(j => j.active).length
      });
    } catch (err) {
      console.error('Load jobs error:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs(0);
  }, [loadJobs]);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        keyword: searchInput,
        state: stateInput,
        category: catInput
      }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, stateInput, catInput]);

  // Actions
  const handleApply = async (job) => {
    if (user) {
      if (job.applyLink) {
        window.open(job.applyLink, '_blank', 'noopener,noreferrer');
      } else {
        addToast('No apply link available for this listing.', 'warning');
      }
    } else {
      localStorage.setItem('pendingGovtApply', JSON.stringify({
        jobId: job.id,
        title: job.title,
        returnUrl: window.location.href,
      }));
      setLoginModal({ open: true, jobTitle: job.title });
    }
  };

  const openDetail = async (jobId) => {
    setDetailModal({ open: true, data: null, loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/govt-jobs/${jobId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetailModal({ open: true, data, loading: false });
    } catch {
      setDetailModal({ open: true, data: null, loading: false, error: true });
    }
  };

  const clearAllFilters = () => {
    setFilters({ keyword: '', state: '', qualification: '', category: '', type: '', activeStatus: '', sortOption: 'LATEST' });
    setSearchInput('');
    setStateInput('');
    setCatInput('');
  };

  // Helpers
  const getDeadlineInfo = (dateStr) => {
    if (!dateStr || dateStr === 'Not Specified') return { status: 'not-spec', label: 'No deadline specified' };
    const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
    if (diff < 0) return { status: 'expired', label: `Expired ${Math.abs(diff)}d ago` };
    if (diff === 0) return { status: 'urgent', label: 'Last date: TODAY' };
    if (diff <= 3) return { status: 'urgent', label: `⚠ Only ${diff} day(s) left — ${dateStr}` };
    if (diff <= 7) return { status: 'soon', label: `Last date: ${dateStr}` };
    return { status: 'active', label: `Last date: ${dateStr}` };
  };

  const getTypeMeta = (type) => TYPE_META[type] || { label: type || 'Listing', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]' };

  // Pagination Logic
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const set = new Set([0, totalPages - 1]);
    for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) set.add(i);
    const sorted = [...set].sort((a, b) => a - b);
    
    const parts = [];
    let prev = null;
    for (const p of sorted) {
      if (prev !== null && p - prev > 1) parts.push('…');
      parts.push(p);
      prev = p;
    }

    return (
      <div className="flex items-center justify-center gap-[4px] my-[2rem] flex-wrap font-['DM_Sans',sans-serif]">
        <button
          onClick={() => loadJobs(page - 1)}
          disabled={page === 0}
          className="min-w-[38px] h-[38px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-white text-[#091d33] flex items-center justify-center hover:bg-[#e6f7f6] hover:text-[#18a99c] hover:border-[#18a99c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[.8rem] text-[#64748b] mx-[8px] whitespace-nowrap">Page {page + 1} of {totalPages}</span>
        {parts.map((p, i) => (
          p === '…' ? (
            <span key={`dots-${i}`} className="text-[.85rem] text-[#64748b] px-[4px] leading-[38px]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => loadJobs(p)}
              className={`min-w-[38px] h-[38px] rounded-[9px] border-[1.5px] text-[.82rem] font-semibold flex items-center justify-center transition-all ${
                p === page
                  ? 'bg-[#18a99c] border-[#18a99c] text-white'
                  : 'bg-white border-[#e2e8f0] text-[#091d33] hover:bg-[#e6f7f6] hover:text-[#18a99c] hover:border-[#18a99c]'
              }`}
            >
              {p + 1}
            </button>
          )
        ))}
        <button
          onClick={() => loadJobs(page + 1)}
          disabled={page >= totalPages - 1}
          className="min-w-[38px] h-[38px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-white text-[#091d33] flex items-center justify-center hover:bg-[#e6f7f6] hover:text-[#18a99c] hover:border-[#18a99c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'sortOption' && v !== '');

  return (
    <div className="font-['DM_Sans',sans-serif] bg-[#f1f5f9] text-[#091d33] min-h-screen pb-[40px]">
      {/* Toasts */}
      <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[9px]">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-[9px] p-[11px_17px] rounded-[12px] text-white text-[13px] font-medium shadow-[0_6px_20px_rgba(0,0,0,.15)] min-w-[230px] max-w-[300px] animate-[slideDown_0.25s_ease] ${t.type === 'success' ? 'bg-[#16a34a]' : t.type === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#091d33]'}`}>
            <Info size={16} /> {t.message}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="bg-[#091d33] pt-[52px] pb-[48px] px-[1rem] sm:px-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,169,156,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(24,169,156,.05)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />
        <div className="absolute top-[-80px] right-[-80px] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,.16)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-[8px] bg-[rgba(24,169,156,.15)] border border-[rgba(24,169,156,.3)] text-[#5ee8dc] text-[.7rem] font-bold tracking-[.8px] uppercase px-[16px] py-[6px] rounded-full mb-[18px]">
            <div className="w-[6px] h-[6px] bg-[#18a99c] rounded-full animate-pulse" />
            <Landmark size={12} /> Sarkari Naukri
          </div>
          
          <h1 className="font-['Playfair_Display',serif] text-[clamp(2rem,4.5vw,3.4rem)] font-black text-white leading-[1.12] mb-[10px] tracking-[-0.5px]">
            Find Your <em className="not-italic text-[#18a99c]">Government Job</em><br />One Place, All Jobs
          </h1>
          <p className="text-white/50 text-[.97rem] mb-[28px] font-light leading-[1.7]">
            Verified Sarkari vacancies — Jobs, Results, Admit Cards & Answer Keys
          </p>

          <div className="flex flex-col sm:flex-row items-center bg-white rounded-[14px] shadow-[0_10px_35px_rgba(0,0,0,.2)] overflow-hidden max-w-[780px]">
            <div className="flex items-center p-[12px_14px] gap-[8px] flex-1 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-[#e2e8f0]">
              <Search size={14} className="text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Post name, department, keyword..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none outline-none w-full text-[13px] font-['DM_Sans',sans-serif] bg-transparent text-[#091d33] placeholder:text-[#aab]"
              />
            </div>
            <div className="flex items-center p-[12px_14px] gap-[8px] flex-1 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-[#e2e8f0]">
              <MapPin size={14} className="text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="State..."
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                className="border-none outline-none w-full text-[13px] font-['DM_Sans',sans-serif] bg-transparent text-[#091d33] placeholder:text-[#aab]"
              />
            </div>
            <div className="flex items-center p-[12px_14px] gap-[8px] flex-1 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-[#e2e8f0]">
              <Tag size={14} className="text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Category..."
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                className="border-none outline-none w-full text-[13px] font-['DM_Sans',sans-serif] bg-transparent text-[#091d33] placeholder:text-[#aab]"
              />
            </div>
            <button
              onClick={() => loadJobs(0)}
              className="bg-[#18a99c] hover:bg-[#0d8a7e] text-white border-none p-[13px_22px] text-[13px] font-bold cursor-pointer flex items-center justify-center gap-[6px] w-full sm:w-auto transition-colors"
            >
              <Search size={14} /> Search
            </button>
          </div>

          <div className="flex gap-[7px] mt-[20px] flex-wrap">
            {[
              { id: '', icon: LayoutGrid, label: 'All' },
              { id: 'JOB', icon: Briefcase, label: 'Jobs' },
              { id: 'RESULT', icon: Trophy, label: 'Results' },
              { id: 'ADMIT_CARD', icon: FileText, label: 'Admit Cards' },
              { id: 'ANSWER_KEY', icon: Key, label: 'Answer Keys' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilters(f => ({ ...f, type: t.id }))}
                className={`inline-flex items-center gap-[6px] border rounded-[9px] px-[18px] py-[8px] text-[12.5px] font-semibold cursor-pointer transition-all font-['DM_Sans',sans-serif] ${
                  filters.type === t.id
                    ? 'bg-[#18a99c] border-[#18a99c] text-white'
                    : 'bg-white/10 border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="bg-[#18a99c] py-[.72rem] px-[2rem]">
        <div className="max-w-[1200px] mx-auto flex gap-[2.5rem] items-center flex-wrap text-white text-[.84rem] font-medium">
          <div className="flex items-center gap-[8px]"><strong className="text-[.97rem] font-bold">{stats.total}</strong> Total Listings</div>
          <div className="flex items-center gap-[8px]"><strong className="text-[.97rem] font-bold">{stats.active}</strong> Active Now</div>
          <div className="flex items-center gap-[8px]"><strong className="text-[.97rem] font-bold">Daily</strong> Updates</div>
          <div className="flex items-center gap-[8px]"><strong className="text-[.97rem] font-bold">Free</strong> to Apply</div>
        </div>
      </div>

      {/* Categories */}
      <div className="pt-[1.3rem] pb-[.3rem] px-[1rem] sm:px-[2rem] max-w-[1200px] mx-auto">
        <div className="flex gap-[.55rem] overflow-x-auto pb-[.4rem] scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilters(f => ({ ...f, category: '' }))}
            className={`whitespace-nowrap border-[1.5px] px-[15px] py-[6px] rounded-[20px] text-[.8rem] font-medium cursor-pointer transition-all font-['DM_Sans',sans-serif] flex-shrink-0 ${
              !filters.category ? 'bg-[#18a99c] border-[#18a99c] text-white' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white'
            }`}
          >
            🗂 All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilters(f => ({ ...f, category: c }))}
              className={`whitespace-nowrap border-[1.5px] px-[15px] py-[6px] rounded-[20px] text-[.8rem] font-medium cursor-pointer transition-all font-['DM_Sans',sans-serif] flex-shrink-0 ${
                filters.category === c ? 'bg-[#18a99c] border-[#18a99c] text-white' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white'
              }`}
            >
              {CAT_ICONS[c] || '📁'} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1200px] mx-auto my-[1.2rem] px-[1rem] sm:px-[2rem] grid grid-cols-1 md:grid-cols-[230px_1fr] gap-[1.4rem] items-start">
        
        {/* Sidebar */}
        <aside className="hidden md:block sticky top-[82px]">


          {/* States */}
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-[1.2rem] mb-[.9rem]">
            <div className="text-[.7rem] font-bold tracking-[1px] uppercase color-[#64748b] mb-[.85rem]">By State</div>
            <div>
              {sidebarData.loading ? (
                <div className="py-[1rem] text-center text-[#64748b]"><Loader2 size={20} className="animate-spin mx-auto text-[#18a99c]" /></div>
              ) : sidebarData.states.length === 0 ? (
                <p className="text-[.8rem] text-[#64748b] py-[4px]">No states found</p>
              ) : (
                sidebarData.states.map(s => (
                  <div
                    key={s}
                    onClick={() => setFilters(f => ({ ...f, state: f.state === s ? '' : s }))}
                    className={`flex items-center justify-between py-[6px] cursor-pointer rounded-[6px] transition-all px-[8px] -mx-[8px] ${
                      filters.state === s ? 'bg-[#e6f7f6]' : 'hover:bg-[#e6f7f6]'
                    }`}
                  >
                    <span className={`text-[.85rem] flex items-center gap-[7px] ${filters.state === s ? 'text-[#0d8a7e] font-bold' : 'text-[#091d33]'}`}>
                      📍 {s}
                    </span>
                    <span className={`text-[.72rem] px-[7px] py-[2px] rounded-[10px] min-w-[28px] text-center ${filters.state === s ? 'bg-[#e6f7f6] text-[#0d8a7e]' : 'bg-[#e2e8f0] text-[#64748b]'}`}>—</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Qualifications */}
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-[1.2rem] mb-[.9rem]">
            <div className="text-[.7rem] font-bold tracking-[1px] uppercase color-[#64748b] mb-[.85rem]">Qualification</div>
            <div>
              {sidebarData.loading ? (
                <div className="py-[1rem] text-center text-[#64748b]"><Loader2 size={20} className="animate-spin mx-auto text-[#18a99c]" /></div>
              ) : sidebarData.quals.length === 0 ? (
                <p className="text-[.8rem] text-[#64748b] py-[4px]">No qualifications found</p>
              ) : (
                sidebarData.quals.map(q => {
                  const icons = { '10th Pass': '🎓', '12th Pass': '🎓', 'Graduate': '🎓', 'Post Graduate': '🏫', 'Diploma': '📜' };
                  return (
                    <div
                      key={q}
                      onClick={() => setFilters(f => ({ ...f, qualification: f.qualification === q ? '' : q }))}
                      className={`flex items-center justify-between py-[6px] cursor-pointer rounded-[6px] transition-all px-[8px] -mx-[8px] ${
                        filters.qualification === q ? 'bg-[#e6f7f6]' : 'hover:bg-[#e6f7f6]'
                      }`}
                    >
                      <span className={`text-[.85rem] flex items-center gap-[7px] ${filters.qualification === q ? 'text-[#0d8a7e] font-bold' : 'text-[#091d33]'}`}>
                        {icons[q] || '🎓'} {q}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Jobs Section */}
        <main className="min-w-0">
          <div className="flex items-center justify-between mb-[.9rem] flex-wrap gap-[8px]">
            <div className="text-[.86rem] text-[#64748b]">Showing <strong className="text-[#091d33]">{jobs.length}</strong> of <strong className="text-[#091d33]">{totalElements}</strong> listings</div>
            <div className="flex gap-[8px] items-center flex-wrap">
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="bg-transparent border-[1.5px] border-[#e2e8f0] text-[#091d33] rounded-[8px] px-[14px] py-[5px] text-[12.5px] font-semibold cursor-pointer flex items-center gap-[5px] font-['DM_Sans',sans-serif] transition-colors hover:bg-[#f1f5f9]">
                  <X size={14} /> Clear filters
                </button>
              )}
              <select
                value={filters.sortOption}
                onChange={(e) => setFilters(f => ({ ...f, sortOption: e.target.value }))}
                className="border-[1.5px] border-[#e2e8f0] bg-white px-[12px] py-[6px] rounded-[8px] text-[.8rem] font-['DM_Sans',sans-serif] text-[#091d33] cursor-pointer outline-none"
              >
                <option value="LATEST">Latest First</option>
                <option value="EXPIRING_SOON">Deadline Soon</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="flex flex-wrap gap-[7px] mb-[14px]">
            {Object.entries(filters).map(([k, v]) => {
              if (k === 'sortOption' || !v) return null;
              let label = v;
              if (k === 'type') label = getTypeMeta(v).label;
              if (k === 'activeStatus') label = v === 'active' ? 'Active only' : 'Expired only';
              return (
                <div key={k} className="inline-flex items-center gap-[5px] bg-white border border-[#18a99c] text-[#18a99c] text-[11.5px] font-medium px-[11px] py-[3px] rounded-full">
                  {k.charAt(0).toUpperCase() + k.slice(1)}: {label}
                  <button onClick={() => setFilters(f => ({ ...f, [k]: '' }))} className="bg-none border-none cursor-pointer text-[#18a99c] flex items-center p-0 ml-[2px]">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Job List */}
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-[3.5rem] gap-[.8rem] text-[#64748b] text-[.88rem]">
                <Loader2 size={34} className="animate-spin text-[#18a99c]" /> Loading listings…
              </div>
            ) : error ? (
              <div className="text-center p-[3.5rem] text-[#64748b]">
                <AlertTriangle size={44} className="mx-auto mb-[.8rem] text-[#e2e8f0]" />
                <h3 className="text-[#091d33] mb-[.4rem] font-semibold text-[1.1rem]">Error</h3>
                <p>{error}</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-[3.5rem_2rem] text-[#64748b]">
                <Search size={44} className="mx-auto mb-[.8rem] text-[#e2e8f0]" />
                <h3 className="text-[#091d33] mb-[.4rem] font-semibold text-[1.1rem]">No listings found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              jobs.map((j, idx) => {
                const isExpired = !j.active;
                const { status: dlStatus, label: dlLabel } = getDeadlineInfo(j.lastDate);
                const typeMeta = getTypeMeta(j.type);
                
                const barClass = isExpired ? 'bg-[#ef4444]' : (dlStatus === 'urgent' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]');
                const badgeCls = isExpired ? 'bg-[#fef2f2] text-[#ef4444] border-[#fecaca]' : (dlStatus === 'urgent' || dlStatus === 'soon' ? 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]' : 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]');
                const badgeLbl = isExpired ? 'Expired' : (dlStatus === 'urgent' ? 'Closing Soon' : 'Active');
                const dlClass = dlStatus === 'urgent' ? 'text-[#ef4444] font-semibold' : dlStatus === 'soon' ? 'text-[#f59e0b] font-semibold' : dlStatus === 'not-spec' ? 'text-[#94a3b8] italic' : 'text-[#64748b]';

                return (
                  <div key={j.id} className={`bg-white border border-[#e2e8f0] rounded-[14px] p-[1.15rem_1.3rem] mb-[.8rem] transition-all relative overflow-hidden animate-[slideDown_0.3s_ease_both] hover:border-[rgba(24,169,156,.4)] hover:shadow-[0_4px_22px_rgba(24,169,156,.1)] hover:-translate-y-[2px] ${isExpired ? 'opacity-[.65]' : ''}`} style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-[14px] ${barClass}`} />
                    <div className={`absolute top-0 left-[4px] text-[9px] font-extrabold tracking-[.6px] uppercase px-[9px] py-[3px] rounded-b-[7px] pointer-events-none ${typeMeta.bg} ${typeMeta.text}`}>
                      {typeMeta.label}
                    </div>

                    <div className="flex items-start justify-between gap-[1rem] mb-[.55rem] pt-[14px]">
                      <div className="text-[.94rem] font-bold text-[#091d33] leading-[1.38] flex-1">{j.title}</div>
                      <span className={`whitespace-nowrap text-[.68rem] font-bold px-[9px] py-[3px] rounded-full tracking-[.3px] inline-flex items-center gap-[4px] shrink-0 border ${badgeCls}`}>
                        <span className="w-[5px] h-[5px] rounded-full bg-current" /> {badgeLbl}
                      </span>
                    </div>

                    <div className="flex items-center gap-[8px] mb-[.65rem]">
                      <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e6f7f6] flex items-center justify-center shrink-0">
                        <Building2 size={17} className="text-[#18a99c]" />
                      </div>
                      <div>
                        <div className="text-[11.5px] font-bold text-[#0d8a7e] leading-[1.3]">{j.department || 'Government of India'}</div>
                        <div className="text-[10.5px] text-[#64748b]">{j.organizationName || ''}</div>
                      </div>
                    </div>

                    <div className="flex gap-[.38rem] flex-wrap mb-[.65rem]">
                      {j.category && <span className="text-[.7rem] font-semibold px-[9px] py-[2px] rounded-full bg-[#fef3c7] text-[#b45309]">{j.category}</span>}
                      {j.state && <span className="text-[.7rem] font-semibold px-[9px] py-[2px] rounded-full bg-[#eff6ff] text-[#3b82f6]">{j.state}</span>}
                      {j.qualification && j.qualification !== 'Not Specified' && <span className="text-[.7rem] font-semibold px-[9px] py-[2px] rounded-full bg-[#f0fdf4] text-[#16a34a]">{j.qualification}</span>}
                    </div>

                    <div className={`text-[.78rem] mb-[.7rem] flex items-center gap-[4px] ${dlClass}`}>
                      <Calendar size={11} className="shrink-0" /> {dlLabel}
                    </div>

                    <div className="flex items-center justify-between gap-[10px]">
                      <p className="text-[.79rem] text-[#64748b] leading-[1.55] line-clamp-2 overflow-hidden flex-1 m-0">{j.description || ''}</p>
                      <div className="flex gap-[7px] shrink-0">
                        <button onClick={() => openDetail(j.id)} className="bg-[#f1f5f9] border-[1.5px] border-[#e2e8f0] text-[#091d33] px-[14px] py-[7px] rounded-[8px] text-[.79rem] font-semibold cursor-pointer font-['DM_Sans',sans-serif] transition-all inline-flex items-center gap-[5px] hover:bg-[#e6f7f6] hover:border-[#18a99c] hover:text-[#18a99c]">
                          <Info size={14} /> Details
                        </button>
                        <button disabled={isExpired} onClick={() => handleApply(j)} className="bg-[#091d33] text-white border-none px-[18px] py-[7px] rounded-[8px] text-[.79rem] font-bold cursor-pointer font-['DM_Sans',sans-serif] transition-all inline-flex items-center gap-[5px] whitespace-nowrap disabled:bg-[#ccc] disabled:cursor-not-allowed hover:bg-[#18a99c] hover:translate-x-[2px] disabled:hover:translate-x-0 disabled:hover:bg-[#ccc]">
                          <Send size={14} /> Apply
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {renderPagination()}
        </main>
      </div>

      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-[1rem]" onClick={() => setDetailModal({ open: false, data: null, loading: false })}>
          <div className="bg-white rounded-[18px] w-full max-w-[560px] max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(9,29,51,.2)] animate-[modalIn_0.25s_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px_24px_0]">
              <div className="font-['Playfair_Display',serif] text-[1.1rem] font-bold text-[#091d33]">{detailModal.loading ? 'Loading…' : detailModal.data?.title || 'Details'}</div>
              <button onClick={() => setDetailModal({ open: false, data: null, loading: false })} className="w-[32px] h-[32px] rounded-[8px] bg-[#f1f5f9] border-none cursor-pointer flex items-center justify-center text-[16px] text-[#64748b] transition-all hover:bg-[#fee2e2] hover:text-[#ef4444]">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-[16px_24px_24px]">
              {detailModal.loading ? (
                <div className="flex flex-col items-center justify-center p-[2rem] gap-[.8rem] text-[#64748b]"><Loader2 size={30} className="animate-spin text-[#18a99c]" /> Loading…</div>
              ) : detailModal.error ? (
                <p className="text-[#ef4444] text-center p-[2rem]">Failed to load details.</p>
              ) : detailModal.data ? (
                <>
                  <div className="flex items-center gap-[8px] mb-[14px] flex-wrap">
                    <span className={`text-[10px] font-extrabold tracking-[.6px] uppercase px-[9px] py-[3px] rounded-[6px] ${getTypeMeta(detailModal.data.type).bg} ${getTypeMeta(detailModal.data.type).text}`}>
                      {getTypeMeta(detailModal.data.type).label}
                    </span>
                    <span className={`inline-flex items-center gap-[4px] text-[10.5px] font-bold px-[11px] py-[3px] rounded-full border ${detailModal.data.active ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#ef4444] border-[#fecaca]'}`}>
                      ● {detailModal.data.active ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <table className="w-full border-collapse text-[13px]">
                    <tbody>
                      <tr className="border-b border-[#e2e8f0]"><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">Department</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.department || '—'}</td></tr>
                      <tr className="border-b border-[#e2e8f0]"><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">Category</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.category || '—'}</td></tr>
                      <tr className="border-b border-[#e2e8f0]"><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">State</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.state || '—'}</td></tr>
                      <tr className="border-b border-[#e2e8f0]"><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">Qualification</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.qualification || '—'}</td></tr>
                      <tr className="border-b border-[#e2e8f0]"><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">Last Date</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.lastDate || 'Not Specified'}</td></tr>
                      <tr><td className="w-[140px] py-[9px] text-[#64748b] whitespace-nowrap align-top">Posted</td><td className="py-[9px] font-semibold text-[#091d33] align-top">{detailModal.data.scrapedAt ? new Date(detailModal.data.scrapedAt).toLocaleDateString() : '—'}</td></tr>
                    </tbody>
                  </table>
                  {detailModal.data.description && (
                    <div className="mt-[18px] pt-[14px] border-t border-[#e2e8f0]">
                      <div className="font-bold text-[#091d33] mb-[7px] text-[13px]">About this listing</div>
                      <p className="text-[13px] text-[#64748b] leading-[1.75] m-0">{detailModal.data.description}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="px-[24px] pb-[22px] flex justify-end gap-[9px]">
              <button onClick={() => setDetailModal({ open: false, data: null, loading: false })} className="bg-[#f1f5f9] border-[1.5px] border-[#e2e8f0] text-[#091d33] rounded-[10px] px-[20px] py-[10px] text-[.84rem] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:bg-[#e2e8f0] transition-colors">
                Close
              </button>
              <button disabled={!detailModal.data?.active} onClick={() => { handleApply(detailModal.data); setDetailModal({ open: false, data: null, loading: false }); }} className="bg-[#091d33] text-white border-none rounded-[10px] px-[22px] py-[10px] text-[.84rem] font-bold cursor-pointer font-['DM_Sans',sans-serif] inline-flex items-center gap-[6px] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#18a99c] transition-colors">
                {detailModal.data?.active ? <><Send size={15} /> Apply Now</> : 'Expired'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {loginModal.open && (
        <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-[1rem]" onClick={() => setLoginModal({ open: false, jobTitle: '' })}>
          <div className="bg-white rounded-[18px] w-full max-w-[400px] shadow-[0_20px_60px_rgba(9,29,51,.2)] animate-[modalIn_0.25s_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px_24px_0]">
              <div className="font-['Playfair_Display',serif] text-[1.1rem] font-bold text-[#091d33]">Login Required</div>
              <button onClick={() => setLoginModal({ open: false, jobTitle: '' })} className="w-[32px] h-[32px] rounded-[8px] bg-[#f1f5f9] border-none cursor-pointer flex items-center justify-center text-[16px] text-[#64748b] transition-all hover:bg-[#fee2e2] hover:text-[#ef4444]">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-[20px_24px_24px] text-center">
              <div className="w-[58px] h-[58px] rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center text-[26px] mx-auto mb-[12px]">
                <Lock size={26} className="fill-current" />
              </div>
              <h6 className="font-bold text-[#091d33] mb-[8px] text-[15px]">Sign in to continue</h6>
              <p className="text-[#64748b] text-[13px] m-0">Login to access official government job links and apply directly.</p>
            </div>

            <div className="px-[24px] pb-[22px] flex justify-end gap-[9px]">
              <button onClick={() => setLoginModal({ open: false, jobTitle: '' })} className="bg-[#f1f5f9] border-[1.5px] border-[#e2e8f0] text-[#091d33] rounded-[10px] px-[20px] py-[10px] text-[.84rem] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:bg-[#e2e8f0] transition-colors">
                Cancel
              </button>
              <button onClick={() => navigate('/login')} className="bg-[#091d33] text-white border-none rounded-[10px] px-[22px] py-[10px] text-[.84rem] font-bold cursor-pointer font-['DM_Sans',sans-serif] inline-flex items-center gap-[6px] hover:bg-[#18a99c] transition-colors">
                <LogIn size={15} /> Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovtJobs
