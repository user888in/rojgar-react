import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MailOpen,
  Mail,
  Hourglass,
  ReplyAll,
  TrendingUp,
  Search,
  XCircle,
  Eye,
  Reply,
  CheckCircle2,
  X,
  Clock,
  Send,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

const AdminEnquiries = () => {
  const { authFetch, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  
  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // State
  const [allEnquiries, setAllEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: '--', pending: '--', replied: '--', rate: '--' });

  // Modals
  const [viewModal, setViewModal] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState(null);

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
    const replied = data.filter((e) => e.replied).length;
    const pending = total - replied;
    const rate = total ? Math.round((replied / total) * 100) : 0;
    setStats({ total, pending, replied, rate: `${rate}%` });
  }, []);

  // Fetch Data
  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/queries`);
      if (!res.ok) throw new Error('Failed to load enquiries');
      const data = await res.json();
      const content = Array.isArray(data) ? data : data.content || [];
      setAllEnquiries(content);
      setFilteredEnquiries(content);
      computeStats(content);
    } catch (err) {
      console.error('Enquiries load error:', err);
      setError('Failed to load enquiries. Check your connection and try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, computeStats]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

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
    let result = allEnquiries;

    if (kw) {
      result = result.filter((e) => {
        const fullName = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(kw) ||
          (e.email || '').toLowerCase().includes(kw) ||
          (e.message || '').toLowerCase().includes(kw)
        );
      });
    }

    if (statusFilter) {
      result = result.filter((e) =>
        statusFilter === 'replied' ? e.replied : !e.replied
      );
    }

    setFilteredEnquiries(result);
    setPage(1);
  }, [debouncedSearch, statusFilter, allEnquiries]);

  // Actions
  const handleSendReply = async () => {
    const message = replyText.trim();
    setReplyError(null);

    if (!message) {
      setReplyError('Reply message cannot be empty.');
      return;
    }
    if (message.length < 5) {
      setReplyError('Reply is too short. Please write a meaningful response.');
      return;
    }

    setReplying(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/query/reply`, {
        method: 'POST',
        body: JSON.stringify({ queryId: replyModal.id, replyMessage: message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send reply.');
      }

      addToast('Reply sent successfully!');
      setReplyModal(null);
      
      // Optimistic update
      const updatedAll = allEnquiries.map(e => 
        e.id === replyModal.id 
          ? { ...e, replied: true, replyMessage: message, repliedAt: new Date().toISOString() } 
          : e
      );
      setAllEnquiries(updatedAll);
      computeStats(updatedAll);
    } catch (err) {
      setReplyError(err.message || 'Failed to send reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleStatCardClick = (status) => {
    setSearchInput('');
    setStatusFilter(status === 'ALL' ? '' : status);
    window.scrollTo({ top: document.querySelector('.table-card')?.offsetTop - 80, behavior: 'smooth' });
  };

  // Helpers
  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInitials = (first, last) => {
    return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredEnquiries.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, filteredEnquiries.length);
  const currentData = filteredEnquiries.slice(start, end);

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

    const btns = pages.map((p, idx) => (
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
    ));

    return (
      <div className="flex gap-[4px]">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {btns}
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

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#0f172a] relative min-h-[80vh]">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Contact Enquiries</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">View and respond to messages submitted through the contact form</p>
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

      {/* Sub Admin Notice */}
      {isSubAdmin && (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[99px] p-[6px_14px] mb-[18px] text-[12px] font-semibold text-[#d97706] inline-flex items-center gap-[6px]">
          <Info size={14} className="text-[#d97706] fill-current" />
          Sub Admin Mode
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] px-[32px] py-[28px] mb-[24px] text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative z-10 flex items-center gap-2">
          <MailOpen size={22} className="fill-current" /> Contact Enquiries
        </h4>
        <p className="text-[13.5px] text-white/55 m-0 relative z-10">
          View and respond to messages submitted through the contact form.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] mb-[24px]">
        {/* Total Enquiries */}
        <div onClick={() => handleStatCardClick('ALL')} className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 cursor-pointer block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#f43f5e] to-[#fda4af]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Total Enquiries</div>
              <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.total}</div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">all messages</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#fff1f2] text-[#f43f5e]">
              <Mail size={20} className="fill-current" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#f43f5e] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter size={12} className="transition-transform group-hover:translate-x-[3px]" /> Show all
          </div>
        </div>

        {/* Pending Reply */}
        <div onClick={() => handleStatCardClick('pending')} className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 cursor-pointer block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#f59e0b] to-[#fcd34d]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Pending Reply</div>
              <div className="text-[26px] font-extrabold text-[#f59e0b] leading-none">{stats.pending}</div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">awaiting response</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#fffbeb] text-[#f59e0b]">
              <Hourglass size={20} />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#d97706] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter size={12} className="transition-transform group-hover:translate-x-[3px]" /> Filter pending
          </div>
        </div>

        {/* Replied */}
        <div onClick={() => handleStatCardClick('replied')} className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 cursor-pointer block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#22c55e] to-[#86efac]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Replied</div>
              <div className="text-[26px] font-extrabold text-[#16a34a] leading-none">{stats.replied}</div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">responses sent</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f0fdf4] text-[#22c55e]">
              <ReplyAll size={20} className="fill-current" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#16a34a] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter size={12} className="transition-transform group-hover:translate-x-[3px]" /> Filter replied
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200 block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Response Rate</div>
              <div className="text-[26px] font-extrabold text-[#8b5cf6] leading-none">{stats.rate}</div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">of all enquiries</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f5f3ff] text-[#8b5cf6]">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[16px_20px] mb-[20px] flex items-center gap-[12px] flex-wrap shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[10px] px-[14px] py-[8px] flex-1 min-w-[200px] transition-all focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] focus-within:border-[#0d9488]">
          <Search size={14} className="text-[#64748b] shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, message…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-[#0f172a] font-['DM_Sans',sans-serif] placeholder:text-[#aab]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-[10px] px-[14px] py-[8px] min-w-[140px] bg-[#f8fafc] text-[#0f172a] outline-none cursor-pointer font-['DM_Sans',sans-serif] transition-all focus:border-[#0d9488]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="replied">Replied</option>
        </select>
        <button
          onClick={() => { setSearchInput(''); setStatusFilter(''); }}
          className="inline-flex items-center gap-[7px] px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold cursor-pointer border-[1.5px] font-['DM_Sans',sans-serif] transition-all whitespace-nowrap bg-[#f8fafc] text-[#64748b] border-[#e8ecf1] hover:bg-[#e2e8f0] hover:text-[#0f172a]"
        >
          <XCircle size={14} /> Clear
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        <div className="px-[20px] py-[16px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <MailOpen size={16} className="text-[#0d9488] fill-current" /> All Enquiries
          </span>
          <span className="text-[12.5px] text-[#64748b] bg-[#f8fafc] border border-[#e8ecf1] rounded-full px-[12px] py-[4px]">
            {loading ? 'Loading…' : `${filteredEnquiries.length} result${filteredEnquiries.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {['#', 'Sender', 'Email', 'Message', 'Status', 'Submitted', 'Actions'].map((h, i) => (
                  <th key={i} className="py-[11px] px-[16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] whitespace-nowrap border-b border-[#f1f5f9]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-[60px] text-[#94a3b8]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin text-[#0d9488]" /> Loading enquiries…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-[60px]">
                    <div className="text-center p-[20px] text-[#94a3b8]">
                      <AlertCircle size={48} className="mx-auto mb-[12px] text-[#cbd5e1]" />
                      <h6 className="text-[15px] text-[#64748b] m-0 mb-[6px] font-semibold">Failed to load enquiries</h6>
                      <p className="text-[13px] m-0">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-[60px]">
                    <div className="text-center p-[20px] text-[#94a3b8]">
                      <Mail size={48} className="mx-auto mb-[12px] text-[#cbd5e1]" />
                      <h6 className="text-[15px] text-[#64748b] m-0 mb-[6px] font-semibold">No enquiries found</h6>
                      <p className="text-[13px] m-0">Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((enq, i) => {
                  const name = `${enq.firstName || ''} ${enq.lastName || ''}`.trim() || 'Unknown';
                  const initials = getInitials(enq.firstName, enq.lastName);

                  return (
                    <tr key={enq.id} className="hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-b-0 transition-colors">
                      <td className="py-[12px] px-[16px] text-[#64748b] text-[12px] align-middle">{start + i + 1}</td>
                      <td className="py-[12px] px-[16px] align-middle">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(244,63,94,0.1)] text-[#f43f5e] flex items-center justify-center font-bold text-[13px] shrink-0">
                            {initials}
                          </div>
                          <div className="font-semibold text-[#0f172a] text-[13.5px]">{name}</div>
                        </div>
                      </td>
                      <td className="py-[12px] px-[16px] align-middle">
                        <a href={`mailto:${enq.email}`} className="text-[13px] text-[#0d9488] no-underline hover:underline inline-flex items-center gap-[4px]">
                          <Mail size={12} /> {enq.email || '—'}
                        </a>
                      </td>
                      <td className="py-[12px] px-[16px] align-middle">
                        <div className="max-w-[280px] whitespace-nowrap overflow-hidden text-ellipsis text-[13px] text-[#64748b]" title={enq.message}>
                          {enq.message || '—'}
                        </div>
                      </td>
                      <td className="py-[12px] px-[16px] align-middle">
                        {enq.replied ? (
                          <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                            <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" /> Replied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fffbeb] text-[#d97706]">
                            <span className="w-[6px] h-[6px] rounded-full bg-[#f59e0b] shrink-0" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-[12px] px-[16px] text-[12.5px] text-[#94a3b8] align-middle">
                        {formatDate(enq.submittedAt)}
                      </td>
                      <td className="py-[12px] px-[16px] align-middle">
                        <div className="flex items-center gap-[6px]">
                          <button
                            onClick={() => setViewModal(enq)}
                            title="View Details"
                            className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] cursor-pointer transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                          >
                            <Eye size={14} />
                          </button>
                          {enq.replied ? (
                            <button
                              disabled
                              title="Already replied"
                              className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#cbd5e1] border-[1.5px] border-[#e8ecf1] cursor-not-allowed opacity-60"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyText('');
                                setReplyError(null);
                                setReplyModal(enq);
                              }}
                              title="Reply to enquiry"
                              className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] cursor-pointer transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                            >
                              <Reply size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Wrap */}
        <div className="flex items-center justify-between px-[20px] py-[14px] border-t border-[#f1f5f9] flex-wrap gap-[10px]">
          <span className="text-[13px] text-[#64748b]">
            {filteredEnquiries.length === 0 ? 'No results' : `Showing ${start + 1}–${end} of ${filteredEnquiries.length}`}
          </span>
          <div className="flex gap-[4px]">
            {renderPaginationBtns()}
          </div>
        </div>
      </div>

      {/* View Enquiry Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm" onClick={() => setViewModal(null)}>
          <div 
            className="bg-white w-full max-w-[620px] rounded-[20px] overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)] flex flex-col max-h-[90vh]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0b2239] px-[24px] py-[20px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)]" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(244,63,94,0.2)] text-[#f43f5e] flex items-center justify-center font-bold text-[17px] border-2 border-[rgba(244,63,94,0.3)] shrink-0">
                  {getInitials(viewModal.firstName, viewModal.lastName)}
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">
                    {`${viewModal.firstName || ''} ${viewModal.lastName || ''}`.trim() || 'Unknown'}
                  </p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">{viewModal.email || '—'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(null)}
                className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.15)] hover:text-white relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-[24px] bg-white overflow-y-auto">
              <div className="mb-[20px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[10px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                  Enquiry Details
                </div>
                <div className="grid grid-cols-2 gap-[14px]">
                  <div>
                    <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[.8px] mb-[4px]">Status</div>
                    <div className="text-[13.5px] text-[#0f172a]">
                      {viewModal.replied ? (
                        <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                          <CheckCircle2 size={10} /> Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fffbeb] text-[#d97706]">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[.8px] mb-[4px]">Submitted At</div>
                    <div className="text-[13.5px] text-[#0f172a]">{formatDateTime(viewModal.submittedAt)}</div>
                  </div>
                  {viewModal.repliedAt && (
                    <div>
                      <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[.8px] mb-[4px]">Replied At</div>
                      <div className="text-[13.5px] text-[#0f172a]">{formatDateTime(viewModal.repliedAt)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-[20px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[10px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                  Message
                </div>
                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[12px] p-[16px_18px] text-[14px] text-[#0f172a] leading-[1.65] border-l-[3px] border-l-[#0d9488]">
                  {viewModal.message || '—'}
                </div>
              </div>

              {viewModal.replied && viewModal.replyMessage && (
                <div className="mb-[20px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[10px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Admin Reply
                  </div>
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[12px] p-[16px_18px] text-[14px] text-[#166534] leading-[1.65] border-l-[3px] border-l-[#22c55e] relative pt-[24px]">
                    <span className="absolute top-[-10px] left-[16px] bg-[#22c55e] text-white text-[10px] font-bold px-[10px] py-[2px] rounded-[99px] tracking-[.5px] flex items-center gap-[4px]">
                      <CheckCircle2 size={10} /> Replied
                    </span>
                    <div>{viewModal.replyMessage}</div>
                    <div className="text-[11.5px] text-[#4ade80] mt-[10px] flex items-center gap-[5px]">
                      <Clock size={12} /> {formatDateTime(viewModal.repliedAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-[16px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                onClick={() => setViewModal(null)}
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all inline-flex items-center gap-[7px]"
              >
                Close
              </button>
              <button
                disabled={viewModal.replied}
                onClick={() => {
                  setReplyText('');
                  setReplyError(null);
                  const currentEnq = viewModal;
                  setViewModal(null);
                  // slight delay to match HTML transition
                  setTimeout(() => setReplyModal(currentEnq), 150);
                }}
                className={`px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none inline-flex items-center gap-[7px] transition-all ${
                  viewModal.replied 
                    ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed' 
                    : 'bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)]'
                }`}
              >
                {viewModal.replied ? (
                  <><CheckCircle2 size={14} /> Already Replied</>
                ) : (
                  <><Reply size={14} /> Reply</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm" onClick={() => !replying && setReplyModal(null)}>
          <div 
            className="bg-white w-full max-w-[540px] rounded-[20px] overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0b2239] px-[24px] py-[20px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)]" />
              <div className="relative z-10">
                <p className="text-[16px] font-extrabold text-white m-0 flex items-center gap-[8px]">
                  <Reply size={16} className="fill-current" /> Send Reply
                </p>
                <p className="text-[12.5px] text-white/50 m-0 mt-[3px]">
                  To: {`${replyModal.firstName || ''} ${replyModal.lastName || ''}`.trim() || 'Unknown'} &lt;{replyModal.email}&gt;
                </p>
              </div>
              <button
                disabled={replying}
                onClick={() => setReplyModal(null)}
                className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.15)] hover:text-white relative z-10 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-[24px] bg-white">
              {replyError && (
                <div className="flex items-center gap-[10px] p-[10px_14px] rounded-[10px] text-[13px] mb-[14px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{replyError}</span>
                </div>
              )}
              
              <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[12px_14px] mb-[20px] border-l-[3px] border-l-[#0d9488]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[6px]">Original Message</div>
                <div className="text-[13.5px] text-[#64748b] leading-[1.55]">{replyModal.message || '—'}</div>
                <div className="text-[11.5px] text-[#94a3b8] mt-[6px]">Submitted on {formatDateTime(replyModal.submittedAt)}</div>
              </div>

              <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">To</label>
              <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[10px] p-[9px_14px] mb-[16px] text-[13.5px] color-[#64748b]">
                <Mail size={14} className="text-[#94a3b8]" />
                <span>
                  <strong>{`${replyModal.firstName || ''} ${replyModal.lastName || ''}`.trim() || 'Unknown'}</strong> &lt;{replyModal.email || '—'}&gt;
                </span>
              </div>

              <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                Your Reply <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply here…"
                className="w-full min-h-[140px] resize-y border-[1.5px] border-[#e8ecf1] rounded-[10px] p-[12px_14px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all leading-[1.6] focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
              />
              <div className="text-[11.5px] text-[#94a3b8] text-right mt-[5px]">
                <span>{replyText.length}</span> characters
              </div>
            </div>

            {/* Footer */}
            <div className="p-[14px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                disabled={replying}
                onClick={() => setReplyModal(null)}
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all inline-flex items-center gap-[7px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={replying}
                onClick={handleSendReply}
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all inline-flex items-center gap-[7px] disabled:opacity-50 disabled:transform-none"
              >
                {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} className="fill-current" />}
                {replying ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEnquiries;
