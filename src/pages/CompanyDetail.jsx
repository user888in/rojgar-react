import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, BadgeCheck, Plus, Globe, Building2, Briefcase,
  MessageSquare, Pencil, Info, List, ChevronDown, ChevronUp,
  MapPin, Users, Calendar, Layers, IndianRupee, Award,
  Home, ArrowRightCircle, ArrowRight, XCircle, ThumbsUp,
  ThumbsDown, Send, CheckCircle2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const sizeMap = {
  SIZE_1_50: '1–50', SIZE_51_200: '51–200', SIZE_201_500: '201–500',
  SIZE_501_1000: '501–1,000', SIZE_1001_5000: '1,001–5,000',
  SIZE_5001_10000: '5,001–10,000', SIZE_10000_PLUS: '10,000+'
};

const typeMap = {
  PRIVATE: 'Private', PUBLIC: 'Public Listed', MNC: 'MNC',
  STARTUP: 'Startup', NGO: 'NGO / Non-profit', GOVERNMENT: 'Government'
};

const jobTypeMap = {
  FULL_TIME: 'Full Time', PART_TIME: 'Part Time',
  INTERNSHIP: 'Internship', CONTRACT: 'Contract', FREELANCE: 'Freelance'
};

const empTypeOptions = [
  { label: 'FULL TIME', value: 'FULL_TIME' },
  { label: 'PART TIME', value: 'PART_TIME' },
  { label: 'INTERNSHIP', value: 'INTERNSHIP' },
  { label: 'FORMER EMPLOYEE', value: 'FORMER_EMPLOYEE' }
];

const initials = (name) => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'RS';
const colorFromId = (id) => ['#091d33', '#0d6b5e', '#7c3aed', '#b45309', '#0369a1', '#9f1239', '#065f46', '#1e3a5f'][(Number(id) || 0) % 8];
const fmtNum = (n) => {
  if (!n && n !== 0) return '—';
  n = Number(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString('en-IN');
};

const fmtSalary = (job) => {
  const mn = job.salaryMin, mx = job.salaryMax;
  if (!mn && !mx) {
    if (job.salary) {
      const s = Number(job.salary);
      return s < 100000 ? '₹' + s.toLocaleString('en-IN') + '/mo' : (s / 100000).toFixed(1) + ' LPA';
    }
    return null;
  }
  if (mn && mx) return mn < 100000 ? `₹${mn.toLocaleString('en-IN')}–₹${mx.toLocaleString('en-IN')}/mo` : `₹${(mn / 100000).toFixed(1)}–${(mx / 100000).toFixed(1)} LPA`;
  const v = mn || mx;
  return v < 100000 ? '₹' + v.toLocaleString('en-IN') + '/mo' : (v / 100000).toFixed(1) + ' LPA';
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

const StarRatingDisplay = ({ rating, size = 18 }) => {
  const r = Math.round(Number(rating) || 0);
  return (
    <div className="flex gap-[2px] text-[#f59e0b] tracking-[1px]" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= r ? "currentColor" : "transparent"} strokeWidth={i <= r ? 0 : 1.5} className={i > r ? "text-[#d1d5db]" : ""} />
      ))}
    </div>
  );
};

const StarInput = ({ value, onChange }) => (
  <div className="flex gap-[7px] flex-wrap text-[28px] leading-none cursor-pointer text-[#d1d5db]">
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} onClick={() => onChange(i)} className={`transition-all hover:scale-115 ${i <= value ? 'text-[#f59e0b] scale-110' : 'hover:text-[#f59e0b]'}`}>★</span>
    ))}
  </div>
);

const MiniStarInput = ({ value, onChange }) => (
  <div className="flex gap-[3px] flex-wrap text-[16px] cursor-pointer text-[#d1d5db]">
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} onClick={() => onChange(i)} className={`transition-colors ${i <= value ? 'text-[#f59e0b]' : 'hover:text-[#f59e0b]'}`}>★</span>
    ))}
  </div>
);

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Data States
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followState, setFollowState] = useState({ following: false, followerCount: 0, loading: false });
  const [ratingSummary, setRatingSummary] = useState(null);

  const [jobs, setJobs] = useState({ data: [], page: 0, totalPages: 0, total: 0, loading: false });
  const [reviews, setReviews] = useState({ data: [], page: 0, totalPages: 0, total: 0, loading: false });

  // Form States
  const initialReviewState = {
    overallRating: 0, reviewTitle: '', designation: '', employmentType: '', workLocation: '',
    pros: '', cons: '', workLife: 0, salaryRating: 0, skillDev: 0, jobSecurity: 0, cultureRating: 0
  };
  const [reviewForm, setReviewForm] = useState(initialReviewState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [editModal, setEditModal] = useState({ open: false, id: null });
  const [editForm, setEditForm] = useState(initialReviewState);
  const [isEditing, setIsEditing] = useState(false);

  const showToast = useCallback((msg, type = 'info') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3800);
  }, []);

  const loadCompanyData = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/companies/${id}`);
      if (!r.ok) throw new Error();
      setCompany(await r.json());
    } catch {
      showToast('Failed to load company details.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const loadFollowStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/public/company-follow/followers/${id}`, { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        setFollowState({ following: d.following ?? false, followerCount: d.followerCount ?? 0, loading: false });
      }
    } catch { }
  }, [id]);

  const loadRatingData = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/public/company-reviews/${id}/rating-summary`);
      if (r.ok) setRatingSummary(await r.json());
    } catch { }
  }, [id]);

  const loadJobs = useCallback(async (page = 0) => {
    if (!company?.companyName) return;
    setJobs(prev => ({ ...prev, loading: true }));
    try {
      const r = await fetch(`${API_BASE_URL}/jobs/company/${encodeURIComponent(company.companyName)}?page=${page}&size=9`);
      if (r.ok) {
        const d = await r.json();
        setJobs({ data: d.content || [], page: d.number ?? page, totalPages: d.totalPages ?? 0, total: d.totalElements ?? 0, loading: false });
      }
    } catch {
      setJobs(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [company?.companyName]);

  const loadReviews = useCallback(async (page = 0) => {
    setReviews(prev => ({ ...prev, loading: true }));
    try {
      const r = await fetch(`${API_BASE_URL}/public/company-reviews/${id}?page=${page}&size=5`);
      if (r.ok) {
        const d = await r.json();
        setReviews({ data: d.content || [], page: d.page ?? page, totalPages: d.totalPages ?? 0, total: d.totalElements ?? 0, loading: false });
      }
    } catch {
      setReviews(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCompanyData();
      loadFollowStatus();
      loadRatingData();
      loadReviews(0);
    }
  }, [id, loadCompanyData, loadFollowStatus, loadRatingData, loadReviews]);

  useEffect(() => {
    if (company?.companyName) loadJobs(0);
  }, [company?.companyName, loadJobs]);

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      showToast('Please login to follow companies.', 'info');
      return;
    }
    setFollowState(prev => ({ ...prev, loading: true }));
    try {
      const r = followState.following
        ? await authFetch(`${API_BASE_URL}/public/company-unfollow/${id}`, { method: 'DELETE' })
        : await authFetch(`${API_BASE_URL}/public/company-follow`, {
          method: 'POST',
          body: JSON.stringify({ companyId: Number(id) })
        });
      if (r.ok) {
        const d = await r.json();
        setFollowState({ following: d.following ?? !followState.following, followerCount: d.followerCount ?? followState.followerCount, loading: false });
        showToast(followState.following ? 'Unfollowed successfully.' : '✓ Now following this company!', followState.following ? 'info' : 'success');
      } else {
        throw new Error();
      }
    } catch {
      showToast('Could not update follow status.', 'danger');
      setFollowState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.overallRating) { showToast('Please select an overall rating.', 'danger'); return; }
    if (!reviewForm.reviewTitle.trim()) { showToast('Please add a review title.', 'danger'); return; }
    if (!isAuthenticated) {
      showToast('Please login to submit a review.', 'info');
      setTimeout(() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`), 1500);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyId: Number(id),
        ...reviewForm,
        pros: reviewForm.pros.trim() || null,
        cons: reviewForm.cons.trim() || null,
        designation: reviewForm.designation.trim() || null,
        workLocation: reviewForm.workLocation.trim() || null,
        employmentType: reviewForm.employmentType || null
      };

      const r = await authFetch(`${API_BASE_URL}/public/company-review`, { method: 'POST', body: JSON.stringify(payload) });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message || 'Submission failed');
      }
      setReviewSuccess(true);
    } catch (e) {
      const msg = e.message || 'Failed to submit review.';
      const isDup = msg.toLowerCase().includes('already reviewed');
      showToast(isDup ? 'You have already reviewed this company.' : msg, 'danger');
      if (isDup) setTimeout(() => setActiveTab('reviews'), 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (r) => {
    setEditModal({ open: true, id: r.reviewId });
    setEditForm({
      overallRating: r.overallRating || 0,
      reviewTitle: r.reviewTitle || '',
      designation: r.designation || '',
      employmentType: r.employmentType || '',
      workLocation: r.workLocation || '',
      pros: r.pros || '',
      cons: r.cons || '',
      workLife: r.workLife || 0,
      salaryRating: r.salaryRating || 0,
      skillDev: r.skillDev || 0,
      jobSecurity: r.jobSecurity || 0,
      cultureRating: r.cultureRating || 0
    });
    document.body.style.overflow = 'hidden';
  };

  const closeEditModal = () => {
    setEditModal({ open: false, id: null });
    document.body.style.overflow = '';
  };

  const handleEditSubmit = async () => {
    if (!editForm.overallRating) { showToast('Please select an overall rating.', 'danger'); return; }
    if (!editForm.reviewTitle.trim()) { showToast('Please add a review title.', 'danger'); return; }

    setIsEditing(true);
    try {
      const payload = {
        companyId: Number(id),
        ...editForm,
        pros: editForm.pros.trim() || null,
        cons: editForm.cons.trim() || null,
        designation: editForm.designation.trim() || null,
        workLocation: editForm.workLocation.trim() || null,
        employmentType: editForm.employmentType || null
      };

      const r = await authFetch(`${API_BASE_URL}/companies/reviews/${editModal.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Update failed');

      showToast('Review updated successfully!', 'success');
      closeEditModal();
      loadReviews(reviews.page);
    } catch (e) {
      showToast(e.message || 'Could not update review.', 'danger');
    } finally {
      setIsEditing(false);
    }
  };

  const renderPagination = (pageData, loadFn) => {
    if (pageData.totalPages <= 1) return null;
    const cur = pageData.page;
    const total = pageData.totalPages;

    const range = [];
    const s = new Set([0, total - 1]);
    for (let i = Math.max(0, cur - 2); i <= Math.min(total - 1, cur + 2); i++) s.add(i);
    const pages = [...s].sort((a, b) => a - b);

    return (
      <div className="flex justify-center gap-[5px] mt-[18px] flex-wrap">
        <button disabled={cur === 0} onClick={() => loadFn(cur - 1)} className="min-w-[36px] h-[36px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-white text-[#64748b] text-[.82rem] font-semibold flex items-center justify-center transition-all hover:bg-[#f1f5f9] hover:border-[#091d33] hover:text-[#091d33] disabled:opacity-35 disabled:cursor-not-allowed">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) => {
          if (i > 0 && p - pages[i - 1] > 1) {
            return <button key={`ellipsis-${p}`} disabled className="min-w-[36px] h-[36px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-white text-[#64748b] text-[.82rem] font-semibold flex items-center justify-center disabled:opacity-35">…</button>;
          }
          return (
            <button key={p} onClick={() => loadFn(p)} className={`min-w-[36px] h-[36px] rounded-[9px] border-[1.5px] font-semibold flex items-center justify-center transition-all text-[.82rem] ${p === cur ? 'bg-[#091d33] text-white border-[#091d33] font-bold' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#091d33] hover:text-[#091d33]'}`}>
              {p + 1}
            </button>
          );
        })}
        <button disabled={cur >= total - 1} onClick={() => loadFn(cur + 1)} className="min-w-[36px] h-[36px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-white text-[#64748b] text-[.82rem] font-semibold flex items-center justify-center transition-all hover:bg-[#f1f5f9] hover:border-[#091d33] hover:text-[#091d33] disabled:opacity-35 disabled:cursor-not-allowed">
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const getCompanySize = (s) => sizeMap[s] || s || '—';
  const getCompanyType = (t) => typeMap[t] || t || '—';

  return (
    <div className="bg-[#f1f5f9] min-h-screen text-[#0f172a] font-['DM_Sans',sans-serif] pb-20">

      {/* Banner */}
      <div className="relative w-full h-[200px] md:h-[320px] overflow-hidden bg-[#091d33]">
        {company?.companyBanner ? (
          <>
            <img src={company.companyBanner} alt={company.companyName} className="absolute inset-0 w-full h-full object-cover z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(9,29,51,0.18)] to-[rgba(9,29,51,0.55)] z-[2] pointer-events-none"></div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-[1] overflow-hidden bg-[#091d33]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(24,169,156,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(24,169,156,0.08)_1px,transparent_1px)] bg-[size:44px_44px]"></div>
            <div className="absolute -top-[80px] -right-[80px] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.22)_0%,transparent_70%)] pointer-events-none"></div>
            <div className="absolute -bottom-[60px] -left-[60px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[clamp(1.4rem,3.5vw,2.8rem)] font-semibold text-[rgba(255,255,255,0.55)] relative z-[1] text-center px-5 break-words">
              {company?.companyName || 'Barrownz Group'} <span className="text-[#18A99C]">·</span> Make Tomorrow Together
            </div>
          </div>
        )}
        {company?.verificationStatus === 'VERIFIED' && (
          <div className="absolute bottom-4 right-5 flex items-center gap-[5px] text-[11.5px] text-[rgba(255,255,255,0.7)] font-medium z-[5] bg-[rgba(9,29,51,0.55)] backdrop-blur-md px-[12px] py-[5px] rounded-full border border-[rgba(255,255,255,0.15)]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#22c55e]"></span> Managed by employer
          </div>
        )}
      </div>

      {/* Header Card */}
      <div className="bg-white border-b border-[#e2e8f0] shadow-[0_2px_12px_rgba(9,29,51,0.07)] relative">
        <div className="max-w-[1180px] mx-auto px-5">
          {loading ? (
            <div className="py-[14px] pb-[22px]">
              <div className="h-[22px] w-[55%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px] mb-[10px]"></div>
              <div className="h-[14px] w-[40%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px]"></div>
            </div>
          ) : (
            <div className="flex items-start gap-[18px] pb-5 relative flex-wrap">
              <div className="-mt-[40px] md:-mt-[60px] flex-shrink-0 relative z-10">
                <div className="w-[80px] h-[80px] md:w-[110px] md:h-[110px] bg-white border-2 border-[#e2e8f0] rounded-[16px] flex items-center justify-center overflow-hidden shadow-[0_8px_32px_rgba(9,29,51,0.12)] font-['Plus_Jakarta_Sans',sans-serif] text-[20px] md:text-[24px] font-extrabold text-[#091d33]">
                  {company?.companyLogo ? (
                    <img src={company.companyLogo} alt={company?.companyName} className="w-full h-full object-contain p-[10px]" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = initials(company?.companyName); }} />
                  ) : initials(company?.companyName)}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-4">
                <div className="flex items-center gap-[8px] flex-wrap mb-[6px]">
                  <span className="text-[17px] md:text-[20px] font-extrabold text-[#091d33] leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif] break-words">{company?.companyName}</span>
                  <span className="inline-flex items-center gap-[3px] text-[13px] font-semibold text-[#64748b] whitespace-nowrap">
                    <Star className="text-[#f59e0b] w-[13px] h-[13px] fill-current" />
                    <span>{company?.avgRating ? Number(company.avgRating).toFixed(1) : '—'}</span>
                  </span>
                  {company?.totalReviews > 0 && <span className="text-[12px] text-[#64748b] whitespace-nowrap">({fmtNum(company.totalReviews)} reviews)</span>}
                  {company?.verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-[4px] text-[11px] font-bold text-[#16a34a] bg-[#dcfce7] px-[9px] py-[3px] rounded-full whitespace-nowrap">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-[#64748b] mb-[10px] leading-[1.6] break-words">{company?.tagline}</div>
                <div className="flex gap-[6px] flex-wrap">
                  {company?.industry && <span className="inline-flex items-center gap-[5px] text-[0.72rem] font-semibold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-[12px] py-[4px] rounded-full whitespace-nowrap"><Layers size={11} /> {company.industry}</span>}
                  {company?.companyType && <span className="inline-flex items-center gap-[5px] text-[0.72rem] font-semibold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-[12px] py-[4px] rounded-full whitespace-nowrap"><Building2 size={11} /> {getCompanyType(company.companyType)}</span>}
                  {company?.headquarters && <span className="inline-flex items-center gap-[5px] text-[0.72rem] font-semibold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-[12px] py-[4px] rounded-full whitespace-nowrap"><MapPin size={11} /> {company.headquarters}</span>}
                  {company?.companySize && <span className="inline-flex items-center gap-[5px] text-[0.72rem] font-semibold text-[#18a99c] bg-[#e6f7f6] border border-[rgba(24,169,156,0.3)] px-[12px] py-[4px] rounded-full whitespace-nowrap"><Users size={11} /> {getCompanySize(company.companySize)} employees</span>}
                  {company?.foundedYear && <span className="inline-flex items-center gap-[5px] text-[0.72rem] font-semibold text-[#18a99c] bg-[#e6f7f6] border border-[rgba(24,169,156,0.3)] px-[12px] py-[4px] rounded-full whitespace-nowrap"><Calendar size={11} /> Since {company.foundedYear}</span>}
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-start gap-[8px] pt-0 md:pt-4 flex-shrink-0 w-full md:w-auto flex-wrap mt-2 md:mt-0">
                <div className="text-[12.5px] text-[#64748b] font-medium whitespace-nowrap">
                  <strong className="text-[#091d33] text-[15px] font-extrabold">{fmtNum(followState.followerCount)}</strong> followers
                </div>
                <button
                  onClick={toggleFollow}
                  disabled={followState.loading}
                  className={`inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[10px] text-[0.88rem] font-bold border-none cursor-pointer transition-all whitespace-nowrap shadow-[0_4px_14px_rgba(9,29,51,0.25)] hover:-translate-y-[1px] ${followState.following ? 'bg-[#e6f7f6] text-[#18a99c] border-[1.5px] border-[#18a99c] shadow-[0_4px_14px_rgba(24,169,156,0.2)] hover:bg-[#18a99c] hover:text-white' : 'bg-[#091d33] text-white hover:bg-[#0d2a4a]'}`}
                >
                  {followState.following ? <><CheckCircle2 size={15} /> Following</> : <><Plus size={15} /> Follow</>}
                </button>
                {company?.websiteUrl && (
                  <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[5px] text-[0.78rem] font-semibold text-[#18a99c] px-[14px] py-[6px] border-[1.5px] border-[rgba(24,169,156,0.35)] rounded-[10px] bg-transparent hover:bg-[#e6f7f6] transition-all max-w-[200px] truncate whitespace-nowrap">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="-mx-5 px-5 relative z-10 border-t border-[#e2e8f0] flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'jobs', label: 'Jobs', icon: Briefcase, count: jobs.total },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: reviews.total },
              { id: 'write-review', label: 'Write Review', icon: Pencil }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-[7px] px-[18px] py-[14px] text-[0.875rem] font-medium border-b-[2.5px] transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-[#091d33] font-bold border-[#18a99c]' : 'text-[#64748b] border-transparent hover:text-[#091d33]'}`}
              >
                <tab.icon size={15} /> {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[0.68rem] font-bold px-[8px] py-[2px] rounded-full ${activeTab === tab.id ? 'bg-[#e6f7f6] text-[#18a99c]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[1180px] mx-auto px-5 pt-[14px] flex items-center gap-[6px] text-[0.75rem] text-[#64748b] flex-wrap">
        <Link to="/" className="hover:text-[#18a99c] transition-colors">Home</Link>
        <ChevronRight size={10} />
        <Link to="/companies" className="hover:text-[#18a99c] transition-colors">Companies</Link>
        <ChevronRight size={10} />
        <span className="text-[#091d33] font-medium">{company?.companyName || 'Loading...'}</span>
      </div>

      {/* Body Layout */}
      <div className="max-w-[1180px] mx-auto px-5 py-[22px] grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* Main Column */}
        <div className="min-w-0">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden break-words">
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                  <Info size={16} /> About the company
                </div>
                {loading ? (
                  <div>
                    <div className="h-[14px] w-full bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px] mb-[8px]"></div>
                    <div className="h-[14px] w-[80%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px] mb-[8px]"></div>
                    <div className="h-[14px] w-[60%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px]"></div>
                  </div>
                ) : (
                  <>
                    <p className={`text-[0.9rem] text-[#64748b] leading-[1.9] whitespace-pre-line break-words ${!readMoreOpen ? 'line-clamp-4' : ''}`}>
                      {company?.description || 'No company description available.'}
                    </p>
                    {company?.description?.length > 300 && (
                      <button onClick={() => setReadMoreOpen(!readMoreOpen)} className="inline-flex items-center gap-[5px] text-[0.78rem] font-bold text-[#18a99c] bg-none border-none cursor-pointer mt-[8px] p-0 hover:underline">
                        {readMoreOpen ? <><ChevronUp size={14} /> Read less</> : <><ChevronDown size={14} /> Read more</>}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden">
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                  <List size={16} /> Company details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => <div key={i} className="h-[52px] w-[95%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[9px] mb-[10px]"></div>)
                  ) : (
                    [
                      { icon: Building2, label: 'Company Type', val: getCompanyType(company?.companyType) },
                      { icon: Calendar, label: 'Founded', val: company?.foundedYear || '—' },
                      { icon: Users, label: 'Company Size', val: getCompanySize(company?.companySize) },
                      { icon: Layers, label: 'Industry', val: company?.industry || '—' },
                      { icon: MapPin, label: 'Headquarters', val: company?.headquarters || '—' },
                      { icon: BadgeCheck, label: 'Verification', val: company?.verificationStatus || '—' },
                      { icon: Star, label: 'Avg Rating', val: company?.avgRating ? `${Number(company.avgRating).toFixed(1)} / 5.0` : '—' },
                      { icon: Briefcase, label: 'Open Positions', val: company?.totalJobOpenings ?? '—' },
                    ].map((item, idx) => (
                      <div key={idx} className={`flex items-start gap-[12px] py-[12px] ${idx >= 6 ? 'border-b-0' : 'border-b border-[#f0f4f8]'} md:border-b md:[&:nth-last-child(-n+2)]:border-b-0 min-w-0`}>
                        <div className="w-[34px] h-[34px] rounded-[9px] bg-[#e6f7f6] text-[#18a99c] flex items-center justify-center flex-shrink-0"><item.icon size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.67rem] font-bold uppercase tracking-[0.5px] text-[#64748b] break-words">{item.label}</div>
                          <div className="text-[0.875rem] font-semibold text-[#091d33] mt-[2px] break-words">{item.val}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden">
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                  <Star size={16} /> Ratings &amp; reviews
                </div>
                {!ratingSummary ? (
                  <p className="text-[#64748b] text-[0.875rem]">No rating data yet.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-[24px] mb-[18px] pb-[18px] border-b border-[#e2e8f0] flex-wrap">
                      <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[52px] md:text-[52px] text-[38px] font-extrabold text-[#091d33] leading-none">{ratingSummary.averageRating ? Number(ratingSummary.averageRating).toFixed(1) : '—'}</div>
                      <div>
                        <div className="mb-[4px]"><StarRatingDisplay rating={ratingSummary.averageRating} size={18} /></div>
                        <div className="text-[12.5px] text-[#64748b]">Based on {fmtNum(ratingSummary.totalReviews)} review{ratingSummary.totalReviews !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {[
                      { lbl: '5★', val: ratingSummary.fiveStar ?? 0 },
                      { lbl: '4★', val: ratingSummary.fourStar ?? 0 },
                      { lbl: '3★', val: ratingSummary.threeStar ?? 0 },
                      { lbl: '2★', val: ratingSummary.twoStar ?? 0 },
                      { lbl: '1★', val: ratingSummary.oneStar ?? 0 },
                    ].map(b => {
                      const maxBar = Math.max(ratingSummary.fiveStar || 0, ratingSummary.fourStar || 0, ratingSummary.threeStar || 0, ratingSummary.twoStar || 0, ratingSummary.oneStar || 0, 1);
                      return (
                        <div key={b.lbl} className="flex items-center gap-[10px] mb-[8px]">
                          <div className="text-[12px] text-[#64748b] w-[26px] text-right flex-shrink-0">{b.lbl}</div>
                          <div className="flex-1 h-[7px] rounded-[4px] bg-[#f1f5f9] overflow-hidden min-w-0">
                            <div className="h-full rounded-[4px] bg-[#18a99c] transition-all duration-700" style={{ width: `${ratingSummary.totalReviews ? Math.round(b.val / maxBar * 100) : 0}%` }}></div>
                          </div>
                          <div className="text-[12px] text-[#64748b] w-[28px] flex-shrink-0">{b.val}</div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden">
              <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                <Briefcase size={16} /> Open positions
              </div>

              {jobs.loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="py-[14px] border-b border-[#f0f4f8]">
                    <div className="h-[22px] w-[55%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px] mb-[8px]"></div>
                    <div className="h-[14px] w-[40%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px]"></div>
                  </div>
                ))
              ) : jobs.data.length === 0 ? (
                <div className="text-center py-[56px] px-[20px]">
                  <div className="w-[64px] h-[64px] rounded-full bg-[#e6f7f6] flex items-center justify-center text-[#18a99c] mx-auto mb-[14px]"><Briefcase size={32} /></div>
                  <h5 className="text-[1rem] font-bold text-[#091d33] mb-[5px]">No Open Positions</h5>
                  <p className="text-[0.875rem] text-[#64748b]">No current openings at this company.</p>
                </div>
              ) : (
                <div>
                  {jobs.data.map(job => {
                    const isClosed = job.status === 'CLOSED' || job.status === 'DRAFT';
                    const typeLabel = jobTypeMap[job.jobType] || (job.jobType || '').replace(/_/g, ' ');
                    const sal = fmtSalary(job);
                    const exp = job.experienceMin != null ? `${job.experienceMin}${job.experienceMax != null ? '–' + job.experienceMax : '+'} yr` : null;

                    return (
                      <div key={job.jobId} className="flex flex-col md:flex-row items-start justify-between gap-[14px] py-[16px] border-b border-[#f0f4f8] last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.92rem] font-bold text-[#091d33] mb-[7px] font-['Plus_Jakarta_Sans',sans-serif] break-words">{job.title}</div>
                          <div className="flex gap-[6px] flex-wrap">
                            {job.location && <span className="text-[0.72rem] text-[#64748b] bg-[#f1f5f9] px-[9px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap"><MapPin size={11} className="text-[#18a99c]" /> {job.location}</span>}
                            {typeLabel && <span className="text-[0.72rem] text-[#64748b] bg-[#f1f5f9] px-[9px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap"><Briefcase size={11} className="text-[#18a99c]" /> {typeLabel}</span>}
                            {sal && <span className="text-[0.72rem] font-bold text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] px-[10px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap"><IndianRupee size={11} /> {sal}</span>}
                            {exp && <span className="text-[0.72rem] text-[#64748b] bg-[#f1f5f9] px-[9px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap"><Award size={11} className="text-[#18a99c]" /> {exp} exp</span>}
                            {job.isRemote && <span className="text-[0.72rem] text-[#64748b] bg-[#f1f5f9] px-[9px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap"><Home size={11} className="text-[#18a99c]" /> Remote</span>}
                            <span className={`text-[0.72rem] px-[9px] py-[3px] rounded-[7px] inline-flex items-center gap-[4px] whitespace-nowrap ${isClosed ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#15803d]'}`}>{job.status}</span>
                          </div>
                        </div>
                        <Link to={`/jobs/${job.jobId}`} className={`inline-flex self-stretch md:self-start items-center justify-center gap-[5px] px-[16px] py-[8px] rounded-[8px] text-[0.8rem] font-bold border-none transition-all whitespace-nowrap flex-shrink-0 ${isClosed ? 'bg-[#f1f5f9] text-[#64748b] pointer-events-none' : 'bg-[#091d33] text-white hover:bg-[#18a99c] hover:-translate-y-[1px]'}`}>
                          {isClosed ? <><XCircle size={14} /> Closed</> : <><ArrowRightCircle size={14} /> View</>}
                        </Link>
                      </div>
                    );
                  })}
                  {renderPagination(jobs, loadJobs)}
                  <Link to={`/companies/${id}/jobs`} className="flex items-center justify-center gap-[7px] w-full mt-[16px] p-[11px] rounded-[10px] border-[1.5px] border-[#18a99c] bg-transparent text-[#18a99c] text-[0.85rem] font-bold transition-all hover:bg-[#e6f7f6]">
                    <Briefcase size={15} /> View all jobs at {company?.companyName} <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden">
              <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                <MessageSquare size={16} /> Employee reviews
              </div>

              {reviews.loading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="py-[14px] border-b border-[#f0f4f8]">
                    <div className="h-[22px] w-[55%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px] mb-[8px]"></div>
                    <div className="h-[14px] w-[40%] bg-gradient-to-r from-[#f0f4f8] via-[#e4eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-[7px]"></div>
                  </div>
                ))
              ) : reviews.data.length === 0 ? (
                <div className="text-center py-[56px] px-[20px]">
                  <div className="w-[64px] h-[64px] rounded-full bg-[#e6f7f6] flex items-center justify-center text-[#18a99c] mx-auto mb-[14px]"><MessageSquare size={32} /></div>
                  <h5 className="text-[1rem] font-bold text-[#091d33] mb-[5px]">No Reviews Yet</h5>
                  <p className="text-[0.875rem] text-[#64748b]">Be the first to share your experience!</p>
                </div>
              ) : (
                <div>
                  {reviews.data.map(r => {
                    const empLabel = empTypeOptions.find(o => o.value === r.employmentType)?.label || r.employmentType?.replace(/_/g, ' ').toLowerCase() || '';
                    const date = formatDate(r.createdAt);
                    const isOwner = isAuthenticated && user?.userId === r.userId;

                    return (
                      <div key={r.reviewId} className="border-[1.5px] border-[#e2e8f0] rounded-[16px] p-[18px] mb-[14px] transition-all hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] hover:border-[#18a99c] hover:-translate-y-[2px] overflow-hidden">
                        <div className="flex items-start gap-[12px] mb-[12px] flex-wrap">
                          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[0.9rem] font-extrabold text-white flex-shrink-0" style={{ background: colorFromId(r.userId) }}>
                            {(r.designation || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.85rem] font-bold text-[#091d33] break-words">{r.designation || 'Anonymous Employee'}</div>
                            <div className="text-[0.75rem] text-[#64748b] mt-[2px] break-words capitalize">{empLabel} {r.workLocation ? `· ${r.workLocation}` : ''}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <StarRatingDisplay rating={r.overallRating} size={14} />
                            <div className="text-[0.7rem] text-[#64748b] mt-[2px]">{date}</div>
                            {isOwner && (
                              <button onClick={() => openEditModal(r)} className="inline-flex items-center gap-[5px] text-[0.72rem] font-bold text-[#18a99c] bg-[#e6f7f6] border-[1.5px] border-[rgba(24,169,156,0.3)] px-[12px] py-[5px] rounded-[7px] cursor-pointer mt-[6px] hover:bg-[rgba(24,169,156,0.2)] transition-colors">
                                <Pencil size={11} /> Edit
                              </button>
                            )}
                          </div>
                        </div>
                        {r.reviewTitle && <div className="text-[0.9rem] font-bold text-[#091d33] mb-[10px] font-['Plus_Jakarta_Sans',sans-serif] break-words">{r.reviewTitle}</div>}
                        {(r.pros || r.cons) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mt-[12px]">
                            {r.pros && (
                              <div className="bg-[#f8fafc] rounded-[9px] p-[12px_14px] overflow-hidden">
                                <div className="text-[0.67rem] font-bold uppercase tracking-[0.5px] mb-[6px] text-[#16a34a] flex items-center gap-1"><ThumbsUp size={11} /> Pros</div>
                                <p className="text-[0.8rem] text-[#64748b] leading-[1.7] m-0 break-words">{r.pros}</p>
                              </div>
                            )}
                            {r.cons && (
                              <div className="bg-[#f8fafc] rounded-[9px] p-[12px_14px] overflow-hidden">
                                <div className="text-[0.67rem] font-bold uppercase tracking-[0.5px] mb-[6px] text-[#dc2626] flex items-center gap-1"><ThumbsDown size={11} /> Cons</div>
                                <p className="text-[0.8rem] text-[#64748b] leading-[1.7] m-0 break-words">{r.cons}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex gap-[6px] flex-wrap mt-[12px] pt-[12px] border-t border-[#f0f4f8]">
                          {r.workLife > 0 && <span className="text-[0.68rem] bg-[#e6f7f6] text-[#18a99c] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap">Work-Life: {r.workLife}★</span>}
                          {r.salaryRating > 0 && <span className="text-[0.68rem] bg-[#e6f7f6] text-[#18a99c] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap">Salary: {r.salaryRating}★</span>}
                          {r.skillDev > 0 && <span className="text-[0.68rem] bg-[#e6f7f6] text-[#18a99c] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap">Skill Dev: {r.skillDev}★</span>}
                          {r.jobSecurity > 0 && <span className="text-[0.68rem] bg-[#e6f7f6] text-[#18a99c] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap">Job Security: {r.jobSecurity}★</span>}
                          {r.cultureRating > 0 && <span className="text-[0.68rem] bg-[#e6f7f6] text-[#18a99c] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap">Culture: {r.cultureRating}★</span>}
                          {empLabel && <span className="text-[0.68rem] bg-[#f1f5f9] text-[#64748b] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap capitalize">{empLabel}</span>}
                          {r.isVerified && <span className="text-[0.68rem] bg-[#dcfce7] text-[#15803d] px-[10px] py-[3px] rounded-[6px] font-bold whitespace-nowrap flex items-center gap-1"><BadgeCheck size={10} /> Verified</span>}
                        </div>
                      </div>
                    );
                  })}
                  {renderPagination(reviews, loadReviews)}
                </div>
              )}
            </div>
          )}

          {/* WRITE REVIEW TAB */}
          {activeTab === 'write-review' && (
            <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] transition-shadow overflow-hidden">
              <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
                <Pencil size={16} /> Share your experience
              </div>

              {!reviewSuccess ? (
                <div className="flex flex-col gap-[16px]">
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Overall rating <span className="text-[#ef4444] ml-[2px]">*</span></label>
                    <StarInput value={reviewForm.overallRating} onChange={(v) => setReviewForm({ ...reviewForm, overallRating: v })} />
                  </div>
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Review title <span className="text-[#ef4444] ml-[2px]">*</span></label>
                    <input type="text" value={reviewForm.reviewTitle} onChange={(e) => setReviewForm({ ...reviewForm, reviewTitle: e.target.value })} placeholder="Summarize your experience in one line…" maxLength="300" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                    <div>
                      <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Your designation</label>
                      <input type="text" value={reviewForm.designation} onChange={(e) => setReviewForm({ ...reviewForm, designation: e.target.value })} placeholder="e.g. Software Engineer" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
                    </div>
                    <div>
                      <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Employment type</label>
                      <select value={reviewForm.employmentType} onChange={(e) => setReviewForm({ ...reviewForm, employmentType: e.target.value })} className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] cursor-pointer">
                        <option value="">Select employment type…</option>
                        {empTypeOptions.map(o => <option key={o.value} value={o.value} className="capitalize">{o.label.toLowerCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Work location</label>
                    <input type="text" value={reviewForm.workLocation} onChange={(e) => setReviewForm({ ...reviewForm, workLocation: e.target.value })} placeholder="e.g. Bengaluru, Remote…" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
                  </div>
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]"><span className="text-[#16a34a]">▲</span> Pros</label>
                    <textarea value={reviewForm.pros} onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })} placeholder="What did you like most about working here?" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] min-h-[90px] resize-y"></textarea>
                  </div>
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]"><span className="text-[#dc2626]">▼</span> Cons</label>
                    <textarea value={reviewForm.cons} onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })} placeholder="What could be improved?" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] min-h-[90px] resize-y"></textarea>
                  </div>
                  <div>
                    <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Rate specific aspects</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
                      {[
                        { key: 'workLife', label: 'Work-Life Balance' },
                        { key: 'salaryRating', label: 'Salary & Benefits' },
                        { key: 'skillDev', label: 'Skill Development' },
                        { key: 'jobSecurity', label: 'Job Security' },
                        { key: 'cultureRating', label: 'Company Culture' }
                      ].map(aspect => (
                        <div key={aspect.key} className="bg-[#f8fafc] rounded-[10px] p-[12px] border-[1.5px] border-[#e5e7eb]">
                          <div className="text-[0.72rem] text-[#64748b] mb-[7px] font-semibold">{aspect.label}</div>
                          <MiniStarInput value={reviewForm[aspect.key]} onChange={(v) => setReviewForm({ ...reviewForm, [aspect.key]: v })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button disabled={isSubmitting} onClick={handleReviewSubmit} className="p-[13px] rounded-[12px] bg-[#18a99c] text-white border-none text-[0.9rem] font-bold cursor-pointer transition-all flex items-center justify-center gap-[8px] font-['DM_Sans',sans-serif] shadow-[0_4px_14px_rgba(24,169,156,0.35)] w-full hover:bg-[#14968a] hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSubmitting ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Send size={15} />}
                    {isSubmitting ? 'Submitting...' : 'Submit review'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-[10px] p-[40px_16px]">
                  <div className="w-[64px] h-[64px] rounded-full bg-[#dcfce7] flex items-center justify-center text-[28px] text-[#16a34a]"><CheckCircle2 size={32} /></div>
                  <div className="text-[1.1rem] font-extrabold font-['Plus_Jakarta_Sans',sans-serif] text-[#091d33]">Review submitted!</div>
                  <div className="text-[0.85rem] text-[#64748b]">Thank you. Your review will appear after admin approval.</div>
                  <button onClick={() => { setReviewSuccess(false); setReviewForm(initialReviewState); setActiveTab('reviews'); }} className="mt-[8px] inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[10px] text-[0.88rem] font-bold bg-[#091d33] text-white border-none cursor-pointer transition-all hover:bg-[#0d2a4a]">
                    <MessageSquare size={15} /> See all reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ASIDE COLUMN */}
        <div className="sticky top-[62px] min-w-0">
          <div className="bg-white rounded-[16px] p-[22px] mb-[16px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] overflow-hidden break-words">
            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
              <Info size={16} /> Company info
            </div>
            <ul className="list-none p-0 m-0">
              {[
                { icon: Globe, label: 'Website', val: company?.websiteUrl ? <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#18a99c] hover:underline break-all">{company.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a> : '—' },
                { icon: MapPin, label: 'Headquarters', val: company?.headquarters || '—' },
                { icon: Building2, label: 'Industry', val: company?.industry || '—' },
                { icon: Users, label: 'Company Size', val: getCompanySize(company?.companySize) },
                { icon: Calendar, label: 'Founded', val: company?.foundedYear || '—' },
                { icon: Briefcase, label: 'Company Type', val: getCompanyType(company?.companyType) }
              ].map((item, idx) => (
                <li key={idx} className={`flex items-start gap-[10px] py-[11px] text-[0.875rem] min-w-0 ${idx < 5 ? 'border-b border-[#f0f4f8]' : ''}`}>
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-[#e6f7f6] text-[#18a99c] flex items-center justify-center flex-shrink-0"><item.icon size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.67rem] text-[#64748b] font-bold uppercase tracking-[0.4px]">{item.label}</div>
                    <div className="text-[0.875rem] font-semibold text-[#091d33] mt-[2px] break-all">{item.val}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-[12px] pt-[12px] border-t border-[#e2e8f0] text-[0.78rem] text-[#64748b]">
              <strong className="text-[#091d33] text-[0.95rem] font-bold">{followState.followerCount.toLocaleString('en-IN')}</strong> people follow this company
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-[22px] shadow-[0_2px_12px_rgba(9,29,51,0.07)] border-[1.5px] border-[#e2e8f0] overflow-hidden break-words">
            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.78rem] font-bold tracking-[1.5px] uppercase text-[#18a99c] mb-[18px] pb-[12px] border-b border-[#e2e8f0] flex items-center gap-[8px]">
              <Star size={16} /> Quick rating
            </div>
            <div className="text-center py-[6px] pb-[16px]">
              <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[48px] font-extrabold text-[#091d33] leading-none">{ratingSummary?.averageRating ? Number(ratingSummary.averageRating).toFixed(1) : '—'}</div>
              <div className="flex justify-center my-[5px]"><StarRatingDisplay rating={ratingSummary?.averageRating} size={18} /></div>
              <div className="text-[0.75rem] text-[#64748b]">{ratingSummary?.totalReviews ? `${fmtNum(ratingSummary.totalReviews)} reviews` : '— reviews'}</div>
            </div>
            <button onClick={() => setActiveTab('write-review')} className="flex items-center justify-center gap-[7px] w-full p-[12px] rounded-[12px] bg-[#091d33] text-white border-none text-[0.875rem] font-bold cursor-pointer transition-all shadow-[0_4px_14px_rgba(9,29,51,0.2)] hover:bg-[#18a99c] hover:shadow-[0_6px_18px_rgba(24,169,156,0.3)]">
              <Pencil size={15} /> Rate this company
            </button>
          </div>
        </div>

      </div>

      {/* Edit Review Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-[rgba(9,29,51,0.45)] z-[4000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeEditModal}>
          <div className="bg-white rounded-[12px] w-full max-w-[620px] max-h-[90vh] overflow-y-auto p-[24px] shadow-[0_20px_60px_rgba(9,29,51,0.25)] relative" onClick={e => e.stopPropagation()}>
            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[1rem] font-extrabold text-[#091d33] mb-[20px] pb-[14px] border-b border-[#e5e7eb] flex items-center justify-between">
              <span className="flex items-center gap-[8px]"><Pencil size={16} className="text-[#18a99c]" /> Edit your review</span>
              <button onClick={closeEditModal} className="bg-none border-none text-[1.2rem] text-[#64748b] cursor-pointer p-[2px_6px] rounded-[6px] transition-colors hover:bg-[#f1f5f9] hover:text-[#091d33]"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-[16px]">
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Overall rating <span className="text-[#ef4444] ml-[2px]">*</span></label>
                <StarInput value={editForm.overallRating} onChange={(v) => setEditForm({ ...editForm, overallRating: v })} />
              </div>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Review title <span className="text-[#ef4444] ml-[2px]">*</span></label>
                <input type="text" value={editForm.reviewTitle} onChange={(e) => setEditForm({ ...editForm, reviewTitle: e.target.value })} placeholder="Summarize your experience…" maxLength="300" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                <div>
                  <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Your designation</label>
                  <input type="text" value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} placeholder="e.g. Software Engineer" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
                </div>
                <div>
                  <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Employment type</label>
                  <select value={editForm.employmentType} onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })} className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] cursor-pointer">
                    <option value="">Select employment type…</option>
                    {empTypeOptions.map(o => <option key={o.value} value={o.value} className="capitalize">{o.label.toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Work location</label>
                <input type="text" value={editForm.workLocation} onChange={(e) => setEditForm({ ...editForm, workLocation: e.target.value })} placeholder="e.g. Bengaluru, Remote…" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif]" />
              </div>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]"><span className="text-[#16a34a]">▲</span> Pros</label>
                <textarea value={editForm.pros} onChange={(e) => setEditForm({ ...editForm, pros: e.target.value })} placeholder="What did you like most?" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] min-h-[90px] resize-y"></textarea>
              </div>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]"><span className="text-[#dc2626]">▼</span> Cons</label>
                <textarea value={editForm.cons} onChange={(e) => setEditForm({ ...editForm, cons: e.target.value })} placeholder="What could be improved?" className="w-full p-[11px_14px] border-[1.5px] border-[#d1d5db] rounded-[10px] text-[0.875rem] text-[#091d33] bg-white outline-none transition-all focus:border-[#18a99c] focus:shadow-[0_0_0_3px_rgba(24,169,156,0.12)] font-['DM_Sans',sans-serif] min-h-[90px] resize-y"></textarea>
              </div>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.5px] text-[#091d33] block mb-[6px]">Rate specific aspects</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                  {[
                    { key: 'workLife', label: 'Work-Life Balance' },
                    { key: 'salaryRating', label: 'Salary & Benefits' },
                    { key: 'skillDev', label: 'Skill Development' },
                    { key: 'jobSecurity', label: 'Job Security' },
                    { key: 'cultureRating', label: 'Company Culture' }
                  ].map(aspect => (
                    <div key={aspect.key} className="bg-[#f8fafc] rounded-[10px] p-[12px] border-[1.5px] border-[#e5e7eb]">
                      <div className="text-[0.72rem] text-[#64748b] mb-[7px] font-semibold">{aspect.label}</div>
                      <MiniStarInput value={editForm[aspect.key]} onChange={(v) => setEditForm({ ...editForm, [aspect.key]: v })} />
                    </div>
                  ))}
                </div>
              </div>
              <button disabled={isEditing} onClick={handleEditSubmit} className="p-[13px] rounded-[12px] bg-[#18a99c] text-white border-none text-[0.9rem] font-bold cursor-pointer transition-all flex items-center justify-center gap-[8px] font-['DM_Sans',sans-serif] shadow-[0_4px_14px_rgba(24,169,156,0.35)] w-full hover:bg-[#14968a] hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed">
                {isEditing ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <CheckCircle2 size={15} />}
                {isEditing ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-[22px] right-[22px] z-[9999] flex flex-col gap-[8px] max-w-[calc(100vw-44px)]">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-[9px] p-[12px_17px] rounded-[12px] text-[0.82rem] font-semibold shadow-[0_8px_32px_rgba(9,29,51,0.12)] animate-[toastIn_0.22s_ease] max-w-[320px] font-['DM_Sans',sans-serif] break-words ${t.type === 'success' ? 'bg-[#dcfce7] text-[#15803d] border-[1.5px] border-[#bbf7d0]' : t.type === 'danger' ? 'bg-[#fee2e2] text-[#dc2626] border-[1.5px] border-[#fecaca]' : 'bg-[#e6f7f6] text-[#18a99c] border-[1.5px] border-[rgba(24,169,156,0.3)]'}`}>
            {t.type === 'success' ? <CheckCircle2 size={16} /> : t.type === 'danger' ? <XCircle size={16} /> : <Info size={16} />} {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
};

export default CompanyDetail;
