import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  MessageSquareText, MessageSquare, Star, Users, Building2, 
  List, Eye, Ban, RotateCcw, CheckCircle, AlertTriangle, 
  Tag, Calendar, Building, Mail, Search, ChevronLeft, ChevronRight, X, ShieldAlert, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

const PAGE_SIZE = 10;

const AdminFeedback = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};

  // -- Page State --
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- Filters & Pagination --
  const [filters, setFilters] = useState({
    status: '', rating: '', search: '', role: '', page: 0, size: PAGE_SIZE, direction: 'desc'
  });
  const [searchInput, setSearchInput] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [busyRows, setBusyRows] = useState(new Set());

  // -- Modals State --
  const [detailModal, setDetailModal] = useState({ open: false, data: null, loading: false, error: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '', isSuspended: false });
  
  // -- Toasts --
  const [toasts, setToasts] = useState([]);

  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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

  const isSuspended = (f) => {
    if (!f) return false;
    return (f.feedbackStatus || f.status || 'ACTIVE').toUpperCase() === 'SUSPEND';
  };

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput.trim(), page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Feedback
  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.rating) params.set('rating', filters.rating);
      if (filters.search) params.set('search', filters.search);
      if (filters.role) params.set('role', filters.role);
      params.set('page', filters.page);
      params.set('size', filters.size);
      params.set('direction', filters.direction);

      const res = await authFetch(`${API_BASE_URL}/admin/feedbacks?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setFeedbackList(data.content || []);
      setTotalElements(data.totalElements ?? (data.content || []).length);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error(err);
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  }, [filters, authFetch]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Stats computation based on current page array (matching original HTML logic)
  const stats = {
    total: totalElements,
    avg: feedbackList.length ? (feedbackList.reduce((s, f) => s + (f.rating || 0), 0) / feedbackList.length).toFixed(1) : '--',
    candidates: feedbackList.filter(f => f.role === 'JOB_SEEKER').length,
    employers: feedbackList.filter(f => f.role === 'RECRUITER').length
  };

  // --- ACTIONS ---

  const handleStatFilter = (role) => {
    setSearchInput('');
    setFilters({ status: '', rating: '', search: '', role: role === 'ALL' ? '' : role, page: 0, size: PAGE_SIZE, direction: 'desc' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetail = async (id) => {
    setDetailModal({ open: true, data: null, loading: true, error: null });
    try {
      const res = await authFetch(`${API_BASE_URL}/public/feedback/${id}`);
      if (!res.ok) throw new Error(`Failed to load details (${res.status})`);
      const data = await res.json();
      
      // Update local array quietly to sync latest status
      setFeedbackList(prev => prev.map(f => f.feedbackId === id ? { ...f, feedbackStatus: data.feedbackStatus || data.status, status: data.feedbackStatus || data.status } : f));
      
      setDetailModal({ open: true, data, loading: false, error: null });
    } catch (err) {
      setDetailModal({ open: true, data: null, loading: false, error: err.message });
    }
  };

  const handleToggleSuspend = async () => {
    const { id, isSuspended: currentlySuspended } = confirmModal;
    setConfirmModal({ open: false, id: null, name: '', isSuspended: false });
    setBusyRows(prev => new Set(prev).add(id));

    try {
      const endpoint = currentlySuspended 
        ? `${API_BASE_URL}/admin/feedback/${id}/active` 
        : `${API_BASE_URL}/admin/feedback/${id}/suspend`;

      const res = await authFetch(endpoint, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const newStatus = currentlySuspended ? 'ACTIVE' : 'SUSPEND';
      
      // Update local list
      setFeedbackList(prev => prev.map(f => f.feedbackId === id ? { ...f, feedbackStatus: newStatus, status: newStatus } : f));
      
      // Update open modal if applicable
      if (detailModal.open && detailModal.data?.feedbackId === id) {
        setDetailModal(prev => ({ ...prev, data: { ...prev.data, feedbackStatus: newStatus, status: newStatus } }));
      }

      showToast(currentlySuspended ? 'Feedback restored — now publicly visible.' : 'Feedback suspended — hidden from public.', currentlySuspended ? 'success' : 'warning');
    } catch (err) {
      showToast(`Action failed: ${err.message}`, 'danger');
    } finally {
      setBusyRows(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const openConfirmModal = (e, id, name, isSuspendedState) => {
    e.stopPropagation();
    setConfirmModal({ open: true, id, name, isSuspended: isSuspendedState });
  };

  // --- RENDER HELPERS ---
  
  const renderPaginationArray = () => {
    const cur = filters.page;
    const range = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= cur - 2 && i <= cur + 2)) {
        range.push(i);
      }
    }
    const out = [];
    let l;
    range.forEach(i => {
      if (l !== undefined) {
        if (i - l === 2) out.push(l + 1);
        else if (i - l !== 1) out.push('…');
      }
      out.push(i);
      l = i;
    });
    return out;
  };

  const StarRating = ({ rating, size = 13 }) => (
    <div className="flex gap-[2px] text-[#f59e0b] tracking-[1px]" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? "currentColor" : "transparent"} strokeWidth={i <= rating ? 0 : 1.5} className={i > rating ? "text-[#e2e8f0]" : ""} />
      ))}
    </div>
  );

  return (
    <div className="relative">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Feedback</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">{today}</p>
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

      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] p-[28px_32px] mb-6 text-white relative overflow-hidden">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)]"></div>
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)]"></div>
        <h4 className="flex items-center font-extrabold text-[1.3rem] m-[0_0_4px] relative z-10"><MessageSquareText size={22} className="mr-2" /> Feedback Management</h4>
        <p className="text-[rgba(255,255,255,0.55)] text-[13.5px] m-[0_0_16px] relative z-10">Review and moderate platform feedback submitted by candidates and employers.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <div 
          className="cursor-pointer group" 
          onClick={() => handleStatFilter('ALL')}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e8ecf1',
            boxShadow: 'none',
            transition: 'all 0.22s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(0)';
          }}
        >
          <div 
            className="stat-bar"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #0d9488, #14b8a6)',
              transition: 'transform 0.35s',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}
          />
          <div className="stat-top flex justify-between items-start">
            <div>
              <div className="stat-label text-[12px] text-[#64748b] mb-1">Total Feedback</div>
              <div className="stat-value text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.total}</div>
              <div className="stat-sub text-[12px] text-[#64748b] mt-[6px]">all time</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] bg-[rgba(13,148,136,0.1)] text-[#0d9488]">
              <MessageSquare size={20} fill="currentColor" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#0d9488] flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            Show all
          </div>
        </div>
        <div 
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e8ecf1',
            boxShadow: 'none',
            transition: 'all 0.22s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(0)';
          }}
        >
          <div 
            className="stat-bar"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
              transition: 'transform 0.35s',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}
          />
          <div className="stat-top flex justify-between items-start">
            <div>
              <div className="stat-label text-[12px] text-[#64748b] mb-1">Avg. Rating</div>
              <div className="stat-value text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.avg}</div>
              <div className="stat-sub text-[12px] text-[#64748b] mt-[6px]">out of 5 stars</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] bg-[#fffbeb] text-[#f59e0b]">
              <Star size={20} fill="currentColor" />
            </div>
          </div>
        </div>
        <div 
          className="cursor-pointer group" 
          onClick={() => handleStatFilter('JOB_SEEKER')}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e8ecf1',
            boxShadow: 'none',
            transition: 'all 0.22s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(0)';
          }}
        >
          <div 
            className="stat-bar"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #22c55e, #86efac)',
              transition: 'transform 0.35s',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}
          />
          <div className="stat-top flex justify-between items-start">
            <div>
              <div className="stat-label text-[12px] text-[#64748b] mb-1">Candidates</div>
              <div className="stat-value text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.candidates}</div>
              <div className="stat-sub text-[12px] text-[#64748b] mt-[6px]">feedback submissions</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] bg-[#f0fdf4] text-[#22c55e]">
              <Users size={20} fill="currentColor" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#16a34a] flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            Filter candidates
          </div>
        </div>
        <div 
          className="cursor-pointer group" 
          onClick={() => handleStatFilter('RECRUITER')}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e8ecf1',
            boxShadow: 'none',
            transition: 'all 0.22s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            const bar = e.currentTarget.querySelector('.stat-bar');
            if (bar) bar.style.transform = 'scaleX(0)';
          }}
        >
          <div 
            className="stat-bar"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #93c5fd)',
              transition: 'transform 0.35s',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}
          />
          <div className="stat-top flex justify-between items-start">
            <div>
              <div className="stat-label text-[12px] text-[#64748b] mb-1">Employers</div>
              <div className="stat-value text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.employers}</div>
              <div className="stat-sub text-[12px] text-[#64748b] mt-[6px]">feedback submissions</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] bg-[#eff6ff] text-[#3b82f6]">
              <Building2 size={20} fill="currentColor" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#2563eb] flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            Filter employers
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden">
        <div className="p-[18px_22px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[14px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <List size={16} className="text-[#0d9488]" /> All Feedback
          </span>
          <div className="flex items-center gap-[10px] flex-wrap">
            <div className="relative">
              <input 
                type="text" 
                className="p-[8px_14px] pl-[34px] border-[1.5px] border-[#e8ecf1] rounded-full text-[13px] text-[#0f172a] outline-none transition-colors bg-[#fafbfc] focus:border-[#0d9488] min-w-[200px]"
                placeholder="Search name, subject or message…" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Search size={14} className="absolute left-[12px] top-[10px] text-[#94a3b8]" />
            </div>
            <select 
              className="p-[8px_14px] border-[1.5px] border-[#e8ecf1] rounded-full text-[13px] text-[#0f172a] outline-none transition-colors bg-[#fafbfc] focus:border-[#0d9488]"
              value={filters.role} 
              onChange={(e) => setFilters(f => ({ ...f, role: e.target.value, page: 0 }))}
            >
              <option value="">All Roles</option>
              <option value="JOB_SEEKER">JOB_SEEKER</option>
              <option value="RECRUITER">RECRUITER</option>
            </select>
            <select 
              className="p-[8px_14px] border-[1.5px] border-[#e8ecf1] rounded-full text-[13px] text-[#0f172a] outline-none transition-colors bg-[#fafbfc] focus:border-[#0d9488]"
              value={filters.rating} 
              onChange={(e) => setFilters(f => ({ ...f, rating: e.target.value, page: 0 }))}
            >
              <option value="">All Ratings</option>
              <option value="5">★★★★★ 5</option>
              <option value="4">★★★★☆ 4+</option>
              <option value="3">★★★☆☆ 3+</option>
            </select>
            <select 
              className="p-[8px_14px] border-[1.5px] border-[#e8ecf1] rounded-full text-[13px] text-[#0f172a] outline-none transition-colors bg-[#fafbfc] focus:border-[#0d9488]"
              value={filters.status} 
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 0 }))}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPEND">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">#</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">User</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Subject</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Role</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Rating</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Status</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Date</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[0.8px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="align-middle">
              {loading ? (
                <tr><td colSpan="8">
                  <div className="text-center p-[60px_20px] text-[#94a3b8]">
                    <div className="inline-block animate-spin w-5 h-5 border-[3px] border-current border-t-transparent text-[#0d9488] rounded-full mr-2 align-middle"></div>
                    Loading feedback…
                  </div>
                </td></tr>
              ) : feedbackList.length === 0 ? (
                <tr><td colSpan="8">
                  <div className="text-center p-[60px_20px] text-[#94a3b8]">
                    <MessageSquareText size={48} className="mx-auto mb-3 text-[#cbd5e1]" />
                    <h6 className="text-[15px] text-[#64748b] m-[0_0_6px]">No feedback found.</h6>
                    <p className="text-[13px] m-0">Try adjusting your filters or search query.</p>
                  </div>
                </td></tr>
              ) : (
                feedbackList.map((f, i) => {
                  const suspended = isSuspended(f);
                  const isBusy = busyRows.has(f.feedbackId);
                  const userInitials = (f.fullName || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <tr key={f.feedbackId} className={`border-b border-[#f1f5f9] hover:bg-[#fafbfc] cursor-pointer transition-colors ${suspended ? 'opacity-65 bg-[#fafafa]' : ''}`} onClick={() => handleViewDetail(f.feedbackId)}>
                      <td className="p-[13px_16px] text-[#64748b]">{filters.page * PAGE_SIZE + i + 1}</td>
                      <td className="p-[13px_16px]">
                        <div className="flex items-center gap-[10px]">
                          {f.profileImage ? (
                            <div className="w-[34px] h-[34px] rounded-[10px] overflow-hidden flex-shrink-0 border border-[#e2e8f0]">
                              <img src={f.profileImage} alt={f.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                              <div className="hidden w-full h-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white items-center justify-center text-[12px] font-bold">{userInitials}</div>
                            </div>
                          ) : (
                            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                              {userInitials}
                            </div>
                          )}
                          <div>
                            <strong className="block text-[#0f172a]">{f.fullName || 'N/A'}</strong>
                            {f.companyName && <span className="text-[11.5px] text-[#64748b]">{f.companyName}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-[13px_16px] max-w-[180px] truncate">{f.subject || '—'}</td>
                      <td className="p-[13px_16px]">
                        <span className={`inline-flex items-center gap-[5px] p-[3px_10px] rounded-full text-[11px] font-semibold ${f.role === 'JOB_SEEKER' ? 'bg-[#eff6ff] text-[#1d4ed8]' : f.role === 'RECRUITER' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[rgba(13,148,136,0.1)] text-[#0d9488]'}`}>
                          {f.role || 'N/A'}
                        </span>
                      </td>
                      <td className="p-[13px_16px]"><StarRating rating={f.rating || 0} /></td>
                      <td className="p-[13px_16px]">
                        {suspended ? (
                          <span className="inline-flex items-center gap-1 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] p-[3px_10px] rounded-full text-[11px] font-semibold">
                            <Ban size={10} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] p-[3px_10px] rounded-full text-[11px] font-semibold">
                            <CheckCircle size={10} /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-[13px_16px] text-[#94a3b8] text-[12.5px]">{formatDate(f.createdAt)}</td>
                      <td className="p-[13px_16px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-[6px] flex-wrap">
                          <button disabled={isBusy} onClick={() => handleViewDetail(f.feedbackId)} className="bg-transparent border-[1.5px] border-[#e8ecf1] rounded-[8px] p-[5px_11px] text-[12px] font-semibold text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] hover:border-[#0d9488] transition-all flex items-center gap-1">
                            <Eye size={13} /> View
                          </button>
                          {suspended ? (
                            <button disabled={isBusy} onClick={(e) => openConfirmModal(e, f.feedbackId, f.fullName, true)} className="bg-[#f0fdf4] border-[1.5px] border-[#bbf7d0] rounded-[8px] p-[5px_11px] text-[12px] font-semibold text-[#16a34a] hover:bg-[#16a34a] hover:text-white hover:border-[#16a34a] transition-all flex items-center gap-1">
                              <RotateCcw size={13} /> Restore
                            </button>
                          ) : (
                            <button disabled={isBusy} onClick={(e) => openConfirmModal(e, f.feedbackId, f.fullName, false)} className="bg-[#fffbeb] border-[1.5px] border-[#fde68a] rounded-[8px] p-[5px_11px] text-[12px] font-semibold text-[#d97706] hover:bg-[#d97706] hover:text-white hover:border-[#d97706] transition-all flex items-center gap-1">
                              <Ban size={13} /> Suspend
                            </button>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-[14px_20px] border-t border-[#f1f5f9] flex-wrap gap-[10px]">
            <span className="text-[13px] text-[#64748b]">
              Showing {(filters.page * PAGE_SIZE) + 1}–{Math.min((filters.page + 1) * PAGE_SIZE, totalElements)} of {totalElements}
            </span>
            <div className="flex gap-[6px]">
              <button 
                disabled={filters.page === 0} 
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {renderPaginationArray().map((p, idx) => (
                <button 
                  key={idx}
                  disabled={p === '…'}
                  onClick={() => p !== '…' && setFilters(f => ({ ...f, page: p }))}
                  className={`w-[32px] h-[32px] rounded-[8px] border-[1.5px] flex items-center justify-center transition-all text-[12.5px] font-semibold ${p === filters.page ? 'bg-[#0d9488] border-[#0d9488] text-white' : p === '…' ? 'border-transparent bg-transparent text-[#94a3b8] cursor-default' : 'border-[#e8ecf1] bg-white text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488]'}`}
                >
                  {p !== '…' ? p + 1 : '…'}
                </button>
              ))}
              <button 
                disabled={filters.page >= totalPages - 1} 
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-[9999] bg-[rgba(9,29,51,0.55)] backdrop-blur-[4px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetailModal({ open: false, data: null, loading: false, error: null }); }}>
          <div className="bg-white rounded-[20px] max-w-[540px] w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)] animate-[modalIn_.3s_cubic-bezier(.34,1.56,.64,1)]">
            <div className="bg-[#0b2239] p-[20px_24px] flex items-center justify-between relative overflow-hidden flex-shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none"></div>
              <h5 className="text-[16px] font-extrabold text-white m-0 relative flex items-center gap-[9px]">
                <MessageSquareText size={18} /> Feedback Detail
              </h5>
              <button onClick={() => setDetailModal({ open: false, data: null, loading: false, error: null })} className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)] w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all hover:bg-[rgba(255,255,255,0.18)] hover:text-white relative z-10">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-[26px] bg-white overflow-y-auto">
              {detailModal.loading ? (
                <div className="text-center p-10 text-[#94a3b8]">
                  <div className="inline-block animate-spin w-5 h-5 border-[3px] border-current border-t-transparent text-[#0d9488] rounded-full align-middle"></div>
                </div>
              ) : detailModal.error ? (
                <div className="text-center p-10 text-[#dc2626]">
                  <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Failed to load details.<br/><span className="text-[12px] opacity-80">{detailModal.error}</span></p>
                </div>
              ) : detailModal.data && (() => {
                const f = detailModal.data;
                const suspended = isSuspended(f);
                const init = (f.fullName || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                
                return (
                  <>
                    <div className="flex items-center gap-[14px] p-[16px] bg-[#f8fafc] rounded-[12px] mb-[20px] border border-[#e8ecf1]">
                      {f.profileImage ? (
                        <div className="w-[56px] h-[56px] rounded-[14px] overflow-hidden flex-shrink-0 border border-[#e2e8f0]">
                          <img src={f.profileImage} alt={f.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                          <div className="hidden w-full h-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white items-center justify-center text-[18px] font-bold">{init}</div>
                        </div>
                      ) : (
                        <div className="w-[56px] h-[56px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] font-bold flex-shrink-0">
                          {init}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[15px] text-[#0f172a]">{f.fullName || 'N/A'}</div>
                        <div className="text-[12px] text-[#64748b] mt-[2px] flex items-center gap-[8px] flex-wrap">
                          <span className={`inline-flex items-center gap-[5px] p-[3px_10px] rounded-full text-[11px] font-semibold ${f.role === 'JOB_SEEKER' ? 'bg-[#eff6ff] text-[#1d4ed8]' : f.role === 'RECRUITER' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[rgba(13,148,136,0.1)] text-[#0d9488]'}`}>
                            {f.role || 'N/A'}
                          </span>
                          {suspended ? (
                            <span className="inline-flex items-center gap-1 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] p-[3px_10px] rounded-full text-[11px] font-semibold"><Ban size={10} /> Suspended</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] p-[3px_10px] rounded-full text-[11px] font-semibold"><CheckCircle size={10} /> Active</span>
                          )}
                          {f.companyName && <span className="flex items-center gap-1"><Building size={11} />{f.companyName}</span>}
                          {f.email && <span className="flex items-center gap-1"><Mail size={11} />{f.email}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[14px] p-[12px_0] border-b border-[#f1f5f9]">
                      <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(13,148,136,0.1)] text-[#0d9488] flex items-center justify-center text-[16px] flex-shrink-0"><Tag size={16} /></div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#94a3b8] mb-[3px]">Subject</div>
                        <div className="text-[14px] text-[#0f172a]">{f.subject || '—'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[14px] p-[12px_0] border-b border-[#f1f5f9]">
                      <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(13,148,136,0.1)] text-[#0d9488] flex items-center justify-center text-[16px] flex-shrink-0"><MessageSquareText size={16} /></div>
                      <div className="w-full">
                        <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#94a3b8] mb-[3px]">Message</div>
                        <div className="text-[14px] text-[#0f172a] whitespace-pre-wrap leading-[1.6]">{f.message || '—'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[14px] p-[12px_0] border-b border-[#f1f5f9]">
                      <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(13,148,136,0.1)] text-[#0d9488] flex items-center justify-center text-[16px] flex-shrink-0"><Star size={16} /></div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#94a3b8] mb-[3px]">Rating</div>
                        <div className="text-[14px] text-[#0f172a] flex items-center gap-2">
                          <StarRating rating={f.rating || 0} size={18} /> <span className="font-bold">{f.rating || 0}/5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[14px] p-[12px_0] border-b border-[#f1f5f9]">
                      <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(13,148,136,0.1)] text-[#0d9488] flex items-center justify-center text-[16px] flex-shrink-0"><Calendar size={16} /></div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#94a3b8] mb-[3px]">Submitted At</div>
                        <div className="text-[14px] text-[#0f172a]">{formatDate(f.createdAt)}</div>
                      </div>
                    </div>
                    
                    {suspended ? (
                      <div className="mt-[20px] p-[14px_16px] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[12px] flex items-center justify-between gap-[12px]">
                        <div>
                          <p className="m-0 text-[13px] text-[#15803d] font-semibold flex items-center gap-1"><RotateCcw size={14} /> Restore this feedback</p>
                          <small className="block text-[11.5px] text-[#16a34a] opacity-90 mt-[2px]">Feedback will become visible to the public again.</small>
                        </div>
                        <button 
                          onClick={() => setConfirmModal({ open: true, id: f.feedbackId, name: f.fullName, isSuspended: true })}
                          className="bg-[#16a34a] text-white border-none rounded-[8px] p-[9px_18px] text-[13px] font-bold cursor-pointer flex items-center gap-[6px] whitespace-nowrap transition-all hover:-translate-y-[1px] hover:bg-[#15803d] flex-shrink-0"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      </div>
                    ) : (
                      <div className="mt-[20px] p-[14px_16px] bg-[#fff7ed] border border-[#fed7aa] rounded-[12px] flex items-center justify-between gap-[12px]">
                        <div>
                          <p className="m-0 text-[13px] text-[#c2410c] font-semibold flex items-center gap-1"><Ban size={14} /> Suspend this feedback</p>
                          <small className="block text-[11.5px] text-[#ea580c] opacity-90 mt-[2px]">Feedback will be hidden from public view.</small>
                        </div>
                        <button 
                          onClick={() => setConfirmModal({ open: true, id: f.feedbackId, name: f.fullName, isSuspended: false })}
                          className="bg-[#f59e0b] text-white border-none rounded-[8px] p-[9px_18px] text-[13px] font-bold cursor-pointer flex items-center gap-[6px] whitespace-nowrap transition-all hover:-translate-y-[1px] hover:bg-[#d97706] flex-shrink-0"
                        >
                          <Ban size={14} /> Suspend
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[10000] bg-[rgba(9,29,51,0.55)] backdrop-blur-[4px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal({ open: false, id: null, name: '', isSuspended: false }); }}>
          <div className="bg-white rounded-[20px] p-[44px_40px_36px] max-w-[420px] w-full text-center shadow-[0_32px_80px_rgba(9,29,51,0.22)] animate-[modalIn_.3s_cubic-bezier(.34,1.56,.64,1)]">
            <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center text-[1.7rem] mx-auto mb-[22px] ${confirmModal.isSuspended ? 'bg-[#e6f7f6] text-[#0d9488]' : 'bg-[#fffbeb] text-[#f59e0b]'}`}>
              {confirmModal.isSuspended ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h5 className="text-[1.2rem] font-bold text-[#0b2239] mb-[10px]">
              {confirmModal.isSuspended ? 'Restore Feedback?' : 'Suspend Feedback?'}
            </h5>
            <p className="text-[.9rem] text-[#64748b] leading-[1.7] mb-[28px]">
              {confirmModal.isSuspended ? `Restore feedback from "${confirmModal.name}"? It will become publicly visible.` : `Suspend feedback from "${confirmModal.name}"? It will be hidden from public view.`}
            </p>
            <div className="flex gap-[10px] justify-center">
              <button 
                onClick={() => setConfirmModal({ open: false, id: null, name: '', isSuspended: false })} 
                className="bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] border-none rounded-[50px] p-[11px_26px] text-[.88rem] font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleToggleSuspend} 
                className={`${confirmModal.isSuspended ? 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]' : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'} border-none rounded-[50px] p-[11px_26px] text-[.88rem] font-bold transition-all flex items-center gap-[7px]`}
              >
                {confirmModal.isSuspended ? <RotateCcw size={15} /> : <Ban size={15} />}
                {confirmModal.isSuspended ? 'Yes, Restore' : 'Yes, Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toasts Container */}
      <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[8px]">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-[10px] p-[12px_18px] rounded-[12px] text-white text-[13.5px] font-['DM_Sans'] shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[240px] animate-[toastIn_.3s_ease] border-l-[3px] border-[rgba(255,255,255,0.3)] ${t.type === 'danger' ? 'bg-[#b91c1c]' : t.type === 'warning' ? 'bg-[#b45309]' : 'bg-[#15803d]'}`}>
            <CheckCircle size={16} /> {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
};
export default AdminFeedback;
