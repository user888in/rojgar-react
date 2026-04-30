import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, FileText, User, MessageCircleHeart, Building2,
  Search, MapPin, Tag, X, ChevronLeft, ChevronRight,
  CheckCircle, Calendar, Upload, Download, Zap, Briefcase,
  GraduationCap, Pencil, Trash2, Lock, Send, Star, Menu, LogOut,
  Camera, CheckCircle2, Loader2, AlertTriangle, Share2, DollarSign, Plus, AlertCircle,
} from 'lucide-react';
import { useAuth } from "../context/AuthContext"
import { API_BASE_URL } from "../config/api"

/* ─── Design tokens ─── */
const C = {
  navy:      '#0a1628',
  navy2:     '#0f2040',
  teal:      '#0d9488',
  tealLight: '#14b8a6',
  tealPale:  '#f0fdfa',
  slate:     '#64748b',
  border:    '#e2e8f0',
  bg:        '#f4f6fa',
  text:      '#0f172a',
};

/* ─── Helpers ─── */
const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtSalary = (s) => {
  if (!s) return null;
  return s >= 100000 ? '₹' + (s / 100000).toFixed(s % 100000 === 0 ? 0 : 1) + 'L' : '₹' + s.toLocaleString('en-IN');
};
const stripHtml = (html) => {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
};

/* ─── Toast hook ─── */
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const bgMap = { success: '#15803d', danger: '#b91c1c', warning: '#b45309', info: '#0d9488' };
  const Toasts = () => (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2">
      {toasts.map(({ id, msg, type }) => (
        <div key={id} style={{ background: bgMap[type] || bgMap.success, animation: 'udToastIn .3s ease', borderLeft: '3px solid rgba(255,255,255,.25)', minWidth: 220, maxWidth: 340 }}
          className="flex items-center gap-2.5 text-white px-4 py-3 rounded-xl text-[13.5px] font-[600] shadow-[0_8px_24px_rgba(0,0,0,.15)] font-['DM_Sans',sans-serif]">
          <span className="flex-1 leading-[1.45]">{msg}</span>
          <button onClick={() => setToasts(p => p.filter(t => t.id !== id))} className="text-white/60 text-[15px] shrink-0 bg-none border-none cursor-pointer">✕</button>
        </div>
      ))}
    </div>
  );
  return { push, Toasts };
};

/* ─── Status pill ─── */
const StatusPill = ({ status }) => {
  const styles = {
    APPLIED:     'bg-[#eff6ff] text-[#1d4ed8]',
    SHORTLISTED: 'bg-[#fffbeb] text-[#d97706]',
    HIRED:       'bg-[#f0fdf4] text-[#16a34a]',
    REJECTED:    'bg-[#fef2f2] text-[#dc2626]',
  };
  return <span className={`px-[11px] py-[3px] rounded-full text-[11.5px] font-bold inline-block ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status || '—'}</span>;
};

/* ─── Modal wrapper ─── */
const Modal = ({ open, onClose, children, maxW = 480 }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(9,29,51,.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 18, width: `calc(100% - 32px)`, maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(9,29,51,.2)', animation: 'udModalIn .28s cubic-bezier(.34,1.56,.64,1)' }}>
        {children}
      </div>
    </div>
  );
};

const ModalHead = ({ title, onClose }) => (
  <div style={{ background: C.navy, padding: '18px 22px' }} className="flex items-center justify-between">
    <h5 className="text-[15px] font-extrabold text-white m-0">{title}</h5>
    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)' }} className="flex items-center justify-center cursor-pointer text-[15px]">
      <X size={15} />
    </button>
  </div>
);

const ModalInput = ({ label, ...props }) => (
  <div className="mb-2.5">
    {label && <label className="block text-[11px] font-bold tracking-[.8px] uppercase text-[#94a3b8] mb-[5px]">{label}</label>}
    <input className="w-full px-[13px] py-[10px] border-[1.5px] border-[#e2e8f0] rounded-[10px] text-[13.5px] text-[#0f172a] bg-white outline-none font-['DM_Sans',sans-serif] focus:border-[#0d9488] transition-colors" {...props} />
  </div>
);

const ModalSelect = ({ label, children, ...props }) => (
  <div className="mb-2.5">
    {label && <label className="block text-[11px] font-bold tracking-[.8px] uppercase text-[#94a3b8] mb-[5px]">{label}</label>}
    <select className="w-full px-[13px] py-[10px] border-[1.5px] border-[#e2e8f0] rounded-[10px] text-[13.5px] text-[#0f172a] bg-white outline-none font-['DM_Sans',sans-serif] focus:border-[#0d9488] transition-colors" {...props}>{children}</select>
  </div>
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function UserDashboard() {
  const { user, logout, getAuthHeaders, authFetch } = useAuth();
  const navigate = useNavigate();
  const { push: toast, Toasts } = useToast();

  const displayName = user?.fullName || user?.username || 'User';
  const initials    = getInitials(displayName);
  const userId      = user?.userId;

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);

  /* ── Profile data ── */
  const [profile, setProfile] = useState(null);
  const [statApplied, setStatApplied] = useState(0);
  const [statShortlisted, setStatShortlisted] = useState(0);
  const [appliedBadge, setAppliedBadge] = useState(0);

  /* ── Jobs ── */
  const [jobs, setJobs] = useState([]);
  const [jobCount, setJobCount] = useState(0);
  const [jobPage, setJobPage] = useState(0);
  const [jobTotalPages, setJobTotalPages] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const debounceTimer = useRef(null);
  const jobsRef = useRef(null);
  const topDdRef = useRef(null);

  /* ── Resume ── */
  const [resumeUrl, setResumeUrl] = useState('');
  const resumeInput = useRef(null);

  /* ── Applications panel ── */
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appCounts, setAppCounts] = useState({ APPLIED: 0, SHORTLISTED: 0, HIRED: 0, REJECTED: 0 });

  /* ── Profile sub-tab ── */
  const [profileStab, setProfileStab] = useState('address');
  const [pcPct, setPcPct] = useState(0);
  const [address, setAddress] = useState('');
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const profileResumeRef = useRef(null);
  const profileImgRef = useRef(null);

  /* ── Feedback ── */
  const [fbState, setFbState] = useState('loading'); // loading|form|success|locked
  const [fbIsEdit, setFbIsEdit] = useState(false);
  const [fbExistingId, setFbExistingId] = useState(null);
  const [fbRating, setFbRating] = useState(0);
  const [fbSubject, setFbSubject] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbEditDaysLeft, setFbEditDaysLeft] = useState(0);
  const [fbLocked, setFbLocked] = useState(null);
  const [fbAlert, setFbAlert] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [fbHeaderText, setFbHeaderText] = useState('Feedback Form');

  /* ── Modals ── */
  const [addrModal, setAddrModal] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [pinStatus, setPinStatus] = useState('');
  const [pinInfo, setPinInfo] = useState('');

  const [skillModal, setSkillModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillId, setSkillId] = useState('');

  const [expModal, setExpModal] = useState(false);
  const [expData, setExpData] = useState({ id: '', jobTitle: '', companyName: '', employmentType: 'FULL TIME', startDate: '', endDate: '', isCurrentJob: false });

  const [eduModal, setEduModal] = useState(false);
  const [eduData, setEduData] = useState({ id: '', boardName: '', degree: '', specialization: '', institute: '', startDate: '', endDate: '', percentage: '' });

  const [applyModal, setApplyModal] = useState(false);
  const [applyJob, setApplyJob] = useState({ id: null, title: '', company: '' });
  const [applyBusy, setApplyBusy] = useState(false);

  const [cfModal, setCfModal] = useState({ open: false, type: 'success', title: '', msg: '' });

  /* ─── CLICK OUTSIDE DROPDOWN ─── */
  useEffect(() => {
    const handler = (e) => {
      if (topDdRef.current && !topDdRef.current.contains(e.target)) setDdOpen(false);
    };
    if (ddOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ddOpen]);

  /* ─── LOAD PROFILE ─── */
  const loadProfile = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/profile/me`);
      if (!res.ok) return;
      const p = await res.json();
      setProfile(p);
      setResumeUrl(p.resumeUrl || '');

      /* profile completeness */
      let score = 0;
      if (p.address) score += 20;
      if (p.resumeUrl) score += 20;
      if (p.skills?.length) score += 20;
      if (p.experience?.length) score += 20;
      if (p.education?.length) score += 20;
      setPcPct(score);

      /* flatten for profile subtabs */
      setSkills(p.skills || []);
      setExperience(p.experience || []);
      setEducation(p.education || []);
      
      // If p.address is a string, use it. If it's an object/array, we'll get details in loadProfileSubData
      if (typeof p.address === 'string') setAddress(p.address);
      else if (p.address && typeof p.address === 'object') {
        const a = Array.isArray(p.address) ? p.address[0] : p.address;
        if (a) setAddress([a.addressLine1, a.addressLine2, a.city, a.state, a.pincode].filter(Boolean).join(', '));
      }
    } catch { /* silent */ }
  }, [authFetch]);

  /* ─── LOAD APPLIED JOBS ─── */
  const loadApplied = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/applications/my`);
      if (!res.ok) return;
      const apps = await res.json();
      setAppliedJobIds(new Set(apps.map(a => a.jobId)));
      setStatApplied(apps.filter(a => a.applicationStatus === 'APPLIED').length);
      setStatShortlisted(apps.filter(a => a.applicationStatus === 'SHORTLISTED').length);
      setAppliedBadge(apps.length);

      const counts = { APPLIED: 0, SHORTLISTED: 0, HIRED: 0, REJECTED: 0 };
      apps.forEach(a => { if (counts[a.applicationStatus] !== undefined) counts[a.applicationStatus]++; });
      setAppCounts(counts);
      setApplications(apps);
    } catch { /* silent */ }
  }, [authFetch]);

  /* ─── LOAD JOBS ─── */
  const loadJobs = useCallback(async (page = 0, title = searchTitle, location = searchLocation, category = searchCategory) => {
    const params = new URLSearchParams({ page, size: 5 });
    if (title)    params.append('title', title);
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    try {
      const res = await authFetch(`${API_BASE_URL}/jobs/openjobs?${params}`);
      const data = await res.json();
      setJobs(data.content || []);
      setJobCount(data.totalElements || 0);
      setJobPage(data.number || 0);
      setJobTotalPages(data.totalPages || 0);
    } catch { /* silent */ }
  }, [authFetch, searchTitle, searchLocation, searchCategory]);

  /* ─── INIT ─── */
  useEffect(() => {
    loadProfile();
    loadApplied();
    loadJobs(0, '', '', '');
  }, []);  // eslint-disable-line

  /* ─── DEBOUNCED SEARCH ─── */
  const debounceSearch = () => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => loadJobs(0), 400);
  };

  const clearSearch = () => {
    setSearchTitle(''); setSearchLocation(''); setSearchCategory('');
    loadJobs(0, '', '', '');
  };

  /* ─── TAB SWITCH ─── */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    setDdOpen(false);
    if (tab === 'applied') { setAppsLoading(true); loadApplied().finally(() => setAppsLoading(false)); }
    if (tab === 'feedback') prefillFeedback();
    if (tab === 'profile') loadProfileSubData();
  };

  const loadProfileSubData = async () => {
    try {
      const [expRes, eduRes, addrRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/profile/experience`),
        authFetch(`${API_BASE_URL}/profile/education`),
        authFetch(`${API_BASE_URL}/profile/address`),
      ]);
      if (expRes.ok) setExperience(await expRes.json());
      if (eduRes.ok) setEducation(await eduRes.json());
      if (addrRes.ok) {
        const addrs = await addrRes.json();
        const a = Array.isArray(addrs) ? addrs[0] : addrs;
        if (a) {
          setAddrLine1(a.addressLine1 || '');
          setAddrLine2(a.addressLine2 || '');
          setAddrCity(a.city || '');
          setAddrState(a.state || '');
          setAddrCountry(a.country || 'India');
          setAddrPincode(a.pincode || '');
          setAddress([a.addressLine1, a.addressLine2, a.city, a.state, a.pincode].filter(Boolean).join(', '));
        }
      }
    } catch { /* silent */ }
  };

  /* ─── RESUME UPLOAD ─── */
  const handleResumeUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast('Only PDF files are allowed.', 'danger'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('File size must be under 10MB.', 'danger'); return; }
    toast('Uploading resume…', 'info');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await authFetch(`${API_BASE_URL}/profile/upload/resume`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResumeUrl(data.resumeUrl);
      toast('Resume uploaded successfully!', 'success');
      await loadProfile();
    } catch { toast('Upload failed. Please try again.', 'danger'); }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast('Only JPEG, PNG, or WebP allowed.', 'danger'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('File must be under 5MB.', 'danger'); return; }
    toast('Updating profile picture…', 'info');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await authFetch(`${API_BASE_URL}/profile/upload/image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(p => ({ ...p, profileImg: data.profileImg }));
      updateUser({ profileImg: data.profileImg });
      toast('Profile picture updated!', 'success');
      await loadProfile();
    } catch { toast('Upload failed.', 'danger'); }
  };

  const downloadResume = async () => {
    if (!userId) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/profile/download/resume/${userId}`);
      if (!res.ok) { toast('Resume not found', 'danger'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url; a.download = `resume_${userId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { toast('Failed to download.', 'danger'); }
  };

  /* ─── APPLY JOB ─── */
  const openApplyModal = (id, title, company) => {
    setApplyJob({ id, title, company });
    setApplyModal(true);
  };

  const confirmApply = async () => {
    if (!applyJob.id) return;
    setApplyBusy(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/applications/apply/${applyJob.id}`, { method: 'POST' });
      if (res.ok) {
        setAppliedJobIds(prev => new Set([...prev, applyJob.id]));
        setApplyModal(false);
        navigate(`/jobs/${applyJob.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setApplyModal(false);
        toast(data.message || 'Failed to apply. Please try again.', 'danger');
      }
    } catch { setApplyModal(false); toast('Something went wrong.', 'danger'); }
    finally { setApplyBusy(false); }
  };

  /* ─── PINCODE LOOKUP ─── */
  const lookupPincode = async (pin) => {
    setAddrPincode(pin);
    if (pin.length !== 6) { setPinStatus(''); setPinInfo(''); setAddrCity(''); setAddrState(''); return; }
    setPinStatus('Looking up…');
    try {
      const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success') {
        const po    = data[0].PostOffice[0];
        const info  = `${po.Name}, ${po.District}, ${po.State}`;
        setAddrCity(po.District); setAddrState(po.State); setAddrCountry('India');
        setPinInfo(info); setPinStatus('✓ Found');
      } else { setPinStatus('Not found'); setPinInfo(''); }
    } catch { setPinStatus('Lookup failed'); }
  };

  const saveAddress = async () => {
    const parts = [addrLine1, addrLine2, addrCity, addrState, addrCountry].filter(Boolean);
    const fullAddr = parts.join(', ');
    const payload = { addressLine1: addrLine1, addressLine2: addrLine2, city: addrCity, state: addrState, country: addrCountry, pincode: addrPincode, isPrimary: true };
    try {
      await authFetch(`${API_BASE_URL}/profile/address`, { method: 'POST', body: JSON.stringify(payload) });
      setAddress(fullAddr); setAddrModal(false); toast('Address saved!', 'success'); await loadProfile();
    } catch { toast('Failed to save address.', 'danger'); }
  };

  /* ─── SKILLS ─── */
  const saveSkill = async () => {
    try {
      const url = skillId ? `${API_BASE_URL}/profile/skills/${skillId}` : `${API_BASE_URL}/profile/skills`;
      await authFetch(url, { method: skillId ? 'PUT' : 'POST', body: JSON.stringify({ skill_name: skillName }) });
      setSkillModal(false); setSkillName(''); setSkillId('');
      await loadProfile(); toast('Skill saved!', 'success');
    } catch { toast('Failed to save skill.', 'danger'); }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    await authFetch(`${API_BASE_URL}/profile/skills/${id}`, { method: 'DELETE' });
    await loadProfile();
  };

  /* ─── EXPERIENCE ─── */
  const saveExp = async () => {
    const { id, jobTitle, companyName, employmentType, startDate, endDate, isCurrentJob } = expData;
    const payload = { job_title: jobTitle, company_name: companyName, employment_type: employmentType, start_date: startDate, end_date: endDate, isCurrentJob };
    const url = id ? `${API_BASE_URL}/profile/experience/${id}` : `${API_BASE_URL}/profile/experience`;
    try {
      await authFetch(url, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setExpModal(false); await loadProfile(); await loadProfileSubData(); toast('Experience saved!', 'success');
    } catch { toast('Failed to save.', 'danger'); }
  };

  const deleteExp = async (id) => {
    if (!window.confirm('Delete this experience?')) return;
    await authFetch(`${API_BASE_URL}/profile/experience/${id}`, { method: 'DELETE' });
    await loadProfile(); await loadProfileSubData();
  };

  /* ─── EDUCATION ─── */
  const saveEdu = async () => {
    const { id, boardName, degree, specialization, institute, startDate, endDate, percentage } = eduData;
    const payload = { board_name: boardName, degree, specialization, institute_name: institute, start_year: startDate, end_year: endDate, percentage };
    const url = id ? `${API_BASE_URL}/profile/education/${id}` : `${API_BASE_URL}/profile/education`;
    try {
      await authFetch(url, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setEduModal(false); await loadProfile(); await loadProfileSubData(); toast('Education saved!', 'success');
    } catch { toast('Failed to save.', 'danger'); }
  };

  const deleteEdu = async (id) => {
    if (!window.confirm('Delete this education?')) return;
    await authFetch(`${API_BASE_URL}/profile/education/${id}`, { method: 'DELETE' });
    await loadProfile(); await loadProfileSubData();
  };

  /* ─── FEEDBACK ─── */
  const prefillFeedback = async () => {
    setFbState('loading');
    try {
      const res = await authFetch(`${API_BASE_URL}/feedback/myfeedback`);
      if (res.status === 404 || res.status === 204) { showFreshFbForm(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fb = Array.isArray(data) ? data[0] : data;
      if (!fb?.feedbackId) { showFreshFbForm(); return; }
      setFbExistingId(fb.feedbackId);
      const days = Math.floor((Date.now() - new Date(fb.createdAt).getTime()) / 86400000);
      const left = 30 - days;
      if (left <= 0) {
        setFbLocked({ ...fb, days });
        setFbState('locked');
      } else {
        setFbIsEdit(true); setFbRating(fb.rating || 0);
        setFbSubject(fb.subject || ''); setFbMessage(fb.message || '');
        setFbEditDaysLeft(left); setFbHeaderText('Edit Your Feedback');
        setFbState('form');
      }
    } catch { showFreshFbForm(); }
  };

  const showFreshFbForm = () => {
    setFbIsEdit(false); setFbExistingId(null); setFbRating(0);
    setFbSubject(''); setFbMessage(''); setFbHeaderText('Feedback Form');
    setFbState('form');
  };

  const submitFeedback = async () => {
    if (!fbSubject) { setFbAlert('Please enter a subject.'); return; }
    if (!fbMessage) { setFbAlert('Please write a message.'); return; }
    if (!fbRating)  { setFbAlert('Please select a star rating.'); return; }
    setFbAlert(''); setFbBusy(true);
    const payload = { subject: fbSubject, message: fbMessage, rating: fbRating };
    try {
      const url = fbIsEdit && fbExistingId
        ? `${API_BASE_URL}/feedback/update/${fbExistingId}`
        : `${API_BASE_URL}/feedback/submit`;
      const res = await authFetch(url, { method: fbIsEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
      const saved = await res.json().catch(() => ({}));
      if (!fbIsEdit && saved.feedbackId) setFbExistingId(saved.feedbackId);
      setFbIsEdit(true); setFbState('success');
      setCfModal({ open: true, type: 'success', title: 'Feedback Received!', msg: 'Thank you! Your feedback helps us make RojgarShine better.' });
    } catch (err) {
      setCfModal({ open: true, type: 'error', title: 'Submission Failed', msg: err.message || 'Something went wrong.' });
    } finally { setFbBusy(false); }
  };

  /* ─── JOB SHARE ─── */
  const handleShare = (e, jobId, title, company) => {
    e.stopPropagation();
    const url = `${window.location.origin}/jobs/${jobId}`;
    const text = `${title} at ${company} — RojgarShine`;
    if (navigator.share) { navigator.share({ title: text, url }).catch(() => {}); }
    else { navigator.clipboard.writeText(url).then(() => toast('Link copied!', 'success')); }
  };

  /* ─── LOGOUT ─── */
  const handleLogout = async () => {
    try { await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' }); } catch {}
    logout();
    navigate('/login');
  };

  /* ─── Pagination numbers ─── */
  const paginationNums = (() => {
    const nums = [];
    for (let i = 0; i < jobTotalPages; i++) {
      if (i === 0 || i === jobTotalPages - 1 || (i >= jobPage - 2 && i <= jobPage + 2)) nums.push(i);
    }
    return nums;
  })();

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  const resumeName = resumeUrl ? resumeUrl.split('/').pop().replace(/^[a-f0-9-]{36}_/, '') : '';

  return (
    <div className="min-h-screen font-['DM_Sans',sans-serif]" style={{ background: C.bg, color: C.text }}>
      {sessionStorage.getItem('impersonation') && (() => {
        let imp = {}; try { imp = JSON.parse(sessionStorage.getItem('impersonation')); } catch {}
        if (!imp.active) return null;
        return (
          <div className="sticky top-0 z-[10000] flex items-center justify-center gap-4 px-4 py-2 bg-[#F49C0B] text-white text-[12.5px] font-bold shadow-lg">
            <div className="flex items-center gap-2">
              <Lock size={14} />
              <span>Viewing as <strong className="underline">{imp.targetUsername}</strong> — admin: <strong>{imp.adminUsername}</strong></span>
            </div>
            <button onClick={logout} className="px-3 py-1 bg-white text-[#F49C0B] rounded text-xs font-bold hover:bg-[#fffbeb] transition-colors border-none cursor-pointer">
              Exit
            </button>
          </div>
        );
      })()}

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes udToastIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
        @keyframes udModalIn  { from{opacity:0;transform:scale(.88) translateY(20px)} to{opacity:1;transform:none} }
        @keyframes udFadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes udFbSpin   { to{transform:rotate(360deg)} }
        @keyframes udPopIn    { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }

        .ud-job-card::after {
          content:''; position:absolute; inset:0; border-radius:16px;
          box-shadow:0 0 0 2px #0d9488; opacity:0; transition:opacity .2s; pointer-events:none;
        }
        .ud-job-card:hover { border-color:transparent; box-shadow:0 6px 28px rgba(13,148,136,.13); transform:translateY(-2px); }
        .ud-job-card:hover::after { opacity:1; }

        /* Profile stab active */
        .ud-stab-active { background:${C.teal} !important; color:#fff !important; border-color:${C.teal} !important; }

        /* Sidebar item active */
        .ud-sb-active { background:rgba(13,148,136,.18) !important; color:${C.tealLight} !important; }

        /* ps-banner scroll wave */
        .ud-ps-banner::after {
          content:''; position:absolute; bottom:-1px; left:0; right:0; height:18px;
          background:#fff; border-radius:50% 50% 0 0/18px 18px 0 0;
        }

        /* Tab btn */
        .ud-tab-active { color:${C.teal} !important; border-bottom-color:${C.teal} !important; font-weight:700 !important; }

        .ud-star-lit  { color:#f59e0b !important; }
        .ud-star:hover { transform:scale(1.18); color:#f59e0b; }

        .ud-qa-teal  { background:#f0fdfa; border-color:#99f6e4; color:#0d9488; }
        .ud-qa-teal:hover  { background:#ccfbf1; }
        .ud-qa-slate { background:#f8fafc; border-color:#e2e8f0; color:#0f172a; }
        .ud-qa-slate:hover { background:#f1f5f9; }
        .ud-qa-green { background:#f0fdf4; border-color:#bbf7d0; color:#16a34a; }
        .ud-qa-green:hover { background:#dcfce7; }
      `}</style>

      <Toasts />

      {/* ══════════════════════════════
          DESKTOP TOPBAR
          navy, height 58px, sticky z-300
      ══════════════════════════════ */}
      <nav className="hidden md:flex items-center justify-between sticky top-0 z-[300] px-7"
        style={{ background: C.navy, height: 58, boxShadow: '0 1px 0 rgba(255,255,255,.05)' }}>
        <Link to="/" className="text-[18px] font-extrabold text-white no-underline tracking-[-0.4px]">
          Rojgar<span style={{ color: C.tealLight }}>Shine</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,.65)' }}>{displayName}</span>
          <div className="relative" ref={topDdRef}>
            <div onClick={() => setDdOpen(p => !p)} style={{ width: 34, height: 34, borderRadius: '50%', background: C.teal, border: '2px solid rgba(255,255,255,.15)', overflow: 'hidden' }}
              className="flex items-center justify-center text-white text-[12px] font-bold cursor-pointer hover:border-[#14b8a6]">
              {profile?.profileImg ? <img src={profile.profileImg} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            {ddOpen && (
              <div onClick={() => setDdOpen(false)} style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(10,22,40,.13)', border: `1px solid ${C.border}`, width: 200, overflow: 'hidden', animation: 'udModalIn .15s ease', zIndex: 999 }}>
                {[['home',<Home size={15}/>,'My Home'],['applied',<FileText size={15}/>,'Applied Jobs'],['profile',<User size={15}/>,'Profile'],['feedback',<MessageCircleHeart size={15}/>,'Feedback']].map(([tab,icon,label]) => (
                  <button key={tab} onClick={() => switchTab(tab)} className="flex items-center gap-2.5 w-full text-left px-4 py-[11px] text-[13px] border-none bg-none cursor-pointer hover:bg-[#f0fdfa] hover:text-[#0d9488] transition-colors font-['DM_Sans',sans-serif]" style={{ color: C.text }}>
                    {icon} {label}
                  </button>
                ))}
                <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-[11px] text-[13px] border-none bg-none cursor-pointer hover:bg-[#fef2f2] font-['DM_Sans',sans-serif] transition-colors" style={{ color: '#dc2626' }}>
                  <LogOut size={15} style={{ color: '#dc2626' }} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════
          MOBILE TOPBAR
          navy, height 52px, sticky z-300
      ══════════════════════════════ */}
      <div className="flex md:hidden items-center justify-between sticky top-0 z-[300] px-3.5"
        style={{ background: C.navy, height: 52 }}>
        <button onClick={() => setSidebarOpen(true)} className="text-white text-[22px] bg-none border-none cursor-pointer p-1">
          <Menu size={22} />
        </button>
        <Link to="/" className="text-[16px] font-extrabold text-white no-underline">Rojgar<span style={{ color: C.tealLight }}>Shine</span></Link>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.teal, fontSize: 11, overflow: 'hidden' }} className="flex items-center justify-center text-white font-bold">
          {profile?.profileImg ? <img src={profile.profileImg} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
      </div>

      {/* ══════════════════════════════
          MOBILE SIDEBAR + OVERLAY
      ══════════════════════════════ */}
      {sidebarOpen && <div className="fixed inset-0 z-[400] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed top-0 h-full z-[500] transition-[left] duration-300 overflow-y-auto md:hidden`}
        style={{ left: sidebarOpen ? 0 : -280, width: 280, background: C.navy, padding: 24 }}>
        <div className="text-[20px] font-extrabold text-white mb-7">Rojgar<span style={{ color: C.tealLight }}>Shine</span></div>
        {[['home',<Home size={18}/>,'Home'],['applied',<FileText size={18}/>,'Applied Jobs'],['profile',<User size={18}/>,'Profile'],['feedback',<MessageCircleHeart size={18}/>,'Feedback']].map(([tab,icon,label]) => (
          <button key={tab} onClick={() => switchTab(tab)}
            className={`flex items-center gap-3 w-full text-left px-[14px] py-[11px] rounded-[10px] mb-1 text-[14px] border-none cursor-pointer transition-all font-['DM_Sans',sans-serif] ${activeTab === tab ? 'ud-sb-active' : ''}`}
            style={{ background: activeTab === tab ? 'rgba(13,148,136,.18)' : 'none', color: activeTab === tab ? C.tealLight : 'rgba(255,255,255,.65)' }}>
            {icon} {label}
          </button>
        ))}
        <Link to="/govt-jobs" className="flex items-center gap-3 w-full text-left px-[14px] py-[11px] rounded-[10px] mb-1 text-[14px] no-underline" style={{ color: 'rgba(255,255,255,.65)' }}>
          <Building2 size={18} /> Govt Jobs
        </Link>
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '10px 0' }} />
        <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-[14px] py-[11px] rounded-[10px] text-[14px] border-none cursor-pointer" style={{ background: 'none', color: '#f87171', fontFamily: 'inherit' }}>
          <LogOut size={16} style={{ color: '#f87171' }} /> Logout
        </button>
      </div>

      {/* ══════════════════════════════
          TAB BAR
          white, border-bottom, sticky, overflow-x-auto
          top: 58px desktop, 52px mobile
      ══════════════════════════════ */}
      <div className="flex sticky z-[200] bg-white border-b overflow-x-auto scrollbar-none"
        style={{ borderColor: C.border, top: 58, padding: '0 28px', gap: 2, scrollbarWidth: 'none' }}>
        <style>{`.ud-tab-bar::-webkit-scrollbar{display:none}`}</style>
        {[
          ['home',<Home size={15}/>,'Home', null],
          ['applied',<FileText size={15}/>,'Applied Jobs', appliedBadge > 0 ? appliedBadge : null],
          ['profile',<User size={15}/>,'Profile', null],
          ['feedback',<MessageCircleHeart size={15}/>,'Feedback', null],
        ].map(([tab, icon, label, badge]) => (
          <button key={tab} onClick={() => switchTab(tab)}
            className={`flex items-center gap-[7px] px-[18px] text-[13.5px] font-medium border-none bg-none cursor-pointer whitespace-nowrap border-b-[2.5px] transition-all font-['DM_Sans',sans-serif] ud-tab-${activeTab === tab ? 'active' : 'inactive'}`}
            style={{ color: activeTab === tab ? C.teal : C.slate, borderBottomColor: activeTab === tab ? C.teal : 'transparent', fontWeight: activeTab === tab ? 700 : 500, padding: '14px 18px', marginBottom: -1 }}>
            {icon} <span>{label}</span>
            {badge && <span className="text-white text-[11px] font-bold rounded-full px-[7px] py-[1px]" style={{ background: C.teal }}>{badge}</span>}
          </button>
        ))}
        <Link to="/govt-jobs" className="flex items-center gap-[7px] px-[18px] text-[13.5px] font-medium no-underline whitespace-nowrap border-b-[2.5px] border-b-transparent" style={{ color: C.slate, padding: '14px 18px' }}>
          <Building2 size={15} /> <span>Govt Jobs</span>
        </Link>
      </div>

      {/* ══════════════════════════════════════
          PANEL: HOME
      ══════════════════════════════════════ */}
      {activeTab === 'home' && (
        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr 272px', gap: 20, padding: '22px 28px', maxWidth: 1380, margin: '0 auto' }} className="ud-home-grid">
          <style>{`
            @media(max-width:1080px){.ud-home-grid{grid-template-columns:240px 1fr!important}}
            @media(max-width:1080px){.ud-right-panel{display:none!important}}
            @media(max-width:768px){.ud-home-grid{grid-template-columns:1fr!important;padding:14px!important}}
            @media(max-width:768px){.ud-ps-card{display:none!important}}
          `}</style>

          {/* ── LEFT: Profile Sidebar ── */}
          <div className="ud-ps-card" style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', position: 'sticky', top: 112, height: 'fit-content' }}>
            {/* .ps-banner */}
            <div className="ud-ps-banner relative text-center" style={{ background: 'linear-gradient(145deg,#0a1628 0%,#1a2f50 100%)', padding: '24px 18px 18px' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', border: '3px solid rgba(255,255,255,.25)', background: C.teal, overflow: 'hidden', margin: '0 auto 10px', fontSize: 22, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile?.profileImg ? <img src={profile.profileImg} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="text-[14.5px] font-bold text-white mb-[2px]">{displayName}</div>
              <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.5)' }}>Job Seeker</div>
            </div>
            {/* .ps-body */}
            <div className="p-[18px]">
              {/* stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['Applied', statApplied],['Shortlisted', statShortlisted]].map(([label, count]) => (
                  <div key={label} className="text-center rounded-[10px] p-2.5" style={{ background: C.tealPale }}>
                    <div className="text-[20px] font-extrabold" style={{ color: C.teal }}>{count}</div>
                    <div className="text-[10.5px]" style={{ color: C.slate }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* info rows */}
              {[ 
                [<GraduationCap size={15} className="text-[#185fa5]"/>, 'Education', profile?.education?.[0] ? `${profile.education[0].degree || ''} — ${profile.education[0].institute_name || ''}` : 'Add Education'],
                [<Briefcase size={15} className="text-[#f59e0b]"/>, 'Experience', profile?.experience?.[0] ? `${profile.experience[0].job_title || ''} at ${profile.experience[0].company_name || ''}` : 'Add Experience'],
              ].map(([icon, label, val]) => (
                <div key={label} className="flex items-start gap-[9px] py-2 border-b border-[#f1f5f9] text-[12.5px]" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="mt-[2px]">{icon}</span>
                  <div><strong className="block text-[11px] mb-[1px]" style={{ color: C.text }}>{label}</strong><span style={{ color: C.slate }}>{val}</span></div>
                </div>
              ))}
              {/* skills */}
              {profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-[5px] mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  {profile.skills.slice(0, 6).map((s, i) => (
                    <span key={i} style={{ background: C.tealPale, color: C.teal, border: '1px solid #99f6e4', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.skillName || (typeof s === 'string' ? s : '')}</span>
                  ))}
                  {profile.skills.length > 6 && <span style={{ background: '#f1f5f9', color: C.slate, border: `1px solid ${C.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>+{profile.skills.length - 6} more</span>}
                </div>
              )}
              {/* edit btn */}
              <button onClick={() => switchTab('profile')} className="w-full flex items-center justify-center gap-1.5 text-[13px] font-bold text-white border-none rounded-[10px] cursor-pointer transition-colors mt-[14px] py-[9px] hover:bg-[#0d9488] font-['DM_Sans',sans-serif]" style={{ background: C.navy }}>
                <Pencil size={13} /> Edit Profile
              </button>
            </div>
          </div>

          {/* ── CENTER: Jobs ── */}
          <div ref={jobsRef} className="min-w-0">
            {/* Govt Jobs Banner */}
            <Link to="/govt-jobs" className="no-underline flex items-center justify-between rounded-[14px] mb-3 border transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_30px_rgba(10,22,40,.25)] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0f3460 60%,#1a2f50 100%)', padding: '15px 18px', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ position: 'absolute', right: 58, top: '50%', transform: 'translateY(-50%)', opacity: .07, pointerEvents: 'none', color: '#fff' }}>
                <Building2 size={44} />
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(13,148,136,.2)', border: '1px solid rgba(13,148,136,.35)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#5eead4' }} className="flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="text-[13.5px] font-extrabold text-white mb-[1px]">Government Jobs</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,.4)' }}>UPSC · SSC · Railway · State PSC openings</div>
                </div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.7)', flexShrink: 0 }}>
                <ChevronRight size={13} />
              </div>
            </Link>

            {/* Search bar */}
            <div className="flex items-center flex-wrap gap-0 mb-2.5 rounded-[14px] border-[1.5px]" style={{ background: '#fff', borderColor: C.border, padding: '10px 14px', boxShadow: '0 2px 12px rgba(10,22,40,.05)' }}>
              {[
                [searchTitle, setSearchTitle, 'Job title, skills…', <Search size={13} />],
                [searchLocation, setSearchLocation, 'Location…', <MapPin size={13} />],
                [searchCategory, setSearchCategory, 'Category…', <Tag size={13} />],
              ].map(([val, setter, ph, icon], idx) => (
                <div key={idx} className="flex items-center flex-1 min-w-[100px] gap-[7px] px-2.5" style={{ borderRight: idx < 2 ? '1px solid #f0f4f8' : 'none', paddingLeft: idx === 0 ? 4 : undefined }}>
                  <span style={{ color: '#c0cad8', flexShrink: 0 }}>{icon}</span>
                  <input value={val} onChange={e => { setter(e.target.value); debounceSearch(); }} placeholder={ph} className="border-none outline-none text-[13px] w-full bg-transparent py-1 font-['DM_Sans',sans-serif]" style={{ color: C.text }} />
                </div>
              ))}
              <button onClick={clearSearch} className="flex items-center gap-[5px] text-[12px] font-semibold cursor-pointer rounded-[9px] px-[11px] py-[6px] transition-all hover:bg-[#fee2e2] hover:text-[#dc2626] hover:border-[#fecaca] ml-1.5 font-['DM_Sans',sans-serif]" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: C.slate, flexShrink: 0 }}>
                <X size={11} /> Clear
              </button>
            </div>

            {/* Active filter chips */}
            {(searchTitle || searchLocation || searchCategory) && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {[[searchTitle, 'searchTitle', 'Title'],[searchLocation, 'searchLocation', 'Location'],[searchCategory, 'searchCategory', 'Category']].filter(([v]) => v).map(([v, field, label]) => (
                  <div key={field} className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full pl-3 pr-1.5 py-1" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    {label}: {v}
                    <button onClick={() => { if (field === 'searchTitle') setSearchTitle(''); if (field === 'searchLocation') setSearchLocation(''); if (field === 'searchCategory') setSearchCategory(''); loadJobs(0); }}
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] cursor-pointer border-none transition-colors" style={{ background: '#bfdbfe', color: '#1d4ed8' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Jobs header */}
            <div className="flex items-center justify-between mb-[14px]">
              <span className="text-[15px] font-bold" style={{ color: C.text }}>Recommended Jobs</span>
              <span className="text-[12px] font-bold rounded-full px-2.5 py-[3px]" style={{ background: C.tealPale, color: C.teal }}>{jobCount} jobs</span>
            </div>

            {/* Job cards */}
            {jobs.length === 0 ? (
              <div className="text-center py-14 px-5" style={{ color: C.slate }}>
                <Briefcase size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 12px' }} />
                <h6 className="font-bold mb-1" style={{ color: C.text }}>No jobs found</h6>
                <small style={{ color: '#b0b7c3' }}>Try different keywords or clear filters</small>
              </div>
            ) : jobs.map((job, i) => {
              const applied = appliedJobIds.has(job.jobId);
              const logo    = (job.companyName || job.title || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
              const salary  = fmtSalary(job.salary);
              return (
                <div key={job.jobId} className="ud-job-card relative" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 10, transition: 'all .22s', animation: `udFadeUp .3s ease ${i * 0.04}s both` }}>
                  {/* Status badge */}
                  <span className="absolute top-[18px] right-[18px] px-[9px] py-[3px] rounded-full text-[10.5px] font-bold" style={{ background: job.status === 'OPEN' ? '#dcfce7' : '#fee2e2', color: job.status === 'OPEN' ? '#15803d' : '#dc2626' }}>{job.status || 'OPEN'}</span>

                  {/* Share btn */}
                  <button onClick={e => handleShare(e, job.jobId, job.title, job.companyName)} className="absolute top-[17px] right-[72px] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f0fdfa] hover:text-[#0d9488] hover:border-[#99f6e4]" style={{ width: 26, height: 26, borderRadius: 7, background: '#f1f5f9', border: `1px solid ${C.border}`, color: '#94a3b8', fontSize: 12 }}>
                    <Share2 size={12} />
                  </button>

                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-[11px] pr-[70px]">
                    <div className="flex items-center justify-center shrink-0 text-[15px] font-extrabold rounded-[10px]" style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#e0f2f1,#b2dfdb)', border: '1px solid #ccefec', color: C.teal, fontFamily: "'DM Mono', monospace", overflow: 'hidden' }}>
                      {job.companyLogo ? <img src={job.companyLogo} alt="" className="w-full h-full object-cover rounded-[10px]" onError={e => { e.target.parentElement.textContent = logo; }} /> : logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-bold truncate" style={{ color: C.text, marginBottom: 4 }}>{job.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[12px]" style={{ color: C.slate }}>
                        <span className="flex items-center gap-[3px]"><Building2 size={11} style={{ color: '#b0b7c3' }} />{job.companyName || 'Company'}</span>
                        <span style={{ color: '#d1d5db' }}>•</span>
                        <span className="flex items-center gap-[3px]"><MapPin size={11} style={{ color: '#b0b7c3' }} />{job.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pills */}
                  <div className="flex gap-[5px] flex-wrap mb-[9px]">
                    {job.categoryName && <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}><Tag size={10} />{job.categoryName}</span>}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border ${salary ? '' : 'opacity-70'}`} style={salary ? { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' } : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' }}>
                      <DollarSign size={10} />{salary ? `${salary} / yr` : 'Not disclosed'}
                    </span>
                  </div>

                  {/* Description */}
                  {job.description && <p className="text-[12px] mb-3 overflow-hidden" style={{ color: '#94a3b8', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{stripHtml(job.description).substring(0, 115)}…</p>}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-[11px]" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: '#b0b7c3' }}><Calendar size={11} />{fmtDate(job.createdAt)}</span>
                    <div className="flex items-center gap-1.5">
                      {applied && <span className="inline-flex items-center gap-[5px] text-[11.5px] font-bold px-3 py-[5px] rounded-[8px]" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}><CheckCircle size={12} />Applied</span>}
                      <Link to={`/jobs/${job.jobId}`} className="inline-flex items-center gap-[5px] px-[13px] py-[6px] rounded-[8px] text-[11.5px] font-semibold text-white no-underline transition-colors hover:bg-[#0d9488] font-['DM_Sans',sans-serif]" style={{ background: C.navy }}>
                        View &amp; Apply <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {jobTotalPages > 1 && (
              <div className="flex justify-center gap-[5px] mt-[18px] flex-wrap">
                <button disabled={jobPage === 0} onClick={() => { loadJobs(jobPage - 1); jobsRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="min-w-[34px] h-[34px] rounded-[8px] text-[13px] border cursor-pointer transition-all hover:bg-[#f0fdfa] hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#fff', borderColor: C.border, color: C.text }}><ChevronLeft size={13} /></button>
                {paginationNums.map((p, idx) => {
                  const prev = paginationNums[idx - 1];
                  return (
                    <span key={p} className="flex gap-[5px]">
                      {prev !== undefined && p - prev > 1 && <button disabled className="min-w-[34px] h-[34px] rounded-[8px] text-[13px] border opacity-40" style={{ background: '#fff', borderColor: C.border }}>…</button>}
                      <button onClick={() => { loadJobs(p); jobsRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className={`min-w-[34px] h-[34px] rounded-[8px] text-[13px] border cursor-pointer transition-all font-['DM_Sans',sans-serif]`} style={{ background: p === jobPage ? C.teal : '#fff', color: p === jobPage ? '#fff' : C.text, borderColor: p === jobPage ? C.teal : C.border }}>{p + 1}</button>
                    </span>
                  );
                })}
                <button disabled={jobPage >= jobTotalPages - 1} onClick={() => { loadJobs(jobPage + 1); jobsRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="min-w-[34px] h-[34px] rounded-[8px] text-[13px] border cursor-pointer transition-all hover:bg-[#f0fdfa] hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#fff', borderColor: C.border, color: C.text }}><ChevronRight size={13} /></button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="ud-right-panel" style={{ position: 'sticky', top: 112, height: 'fit-content' }}>
            {/* Resume card */}
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div className="flex items-center gap-[7px] text-[13.5px] font-bold mb-[13px]" style={{ color: C.text }}>
                <FileText size={15} style={{ color: C.teal }} /> My Resume
              </div>
              {resumeName && (
                <div className="flex items-center justify-between rounded-[10px] px-3 py-[9px] mb-2.5" style={{ background: '#f8fafc', border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-[7px] text-[12px] font-semibold overflow-hidden" style={{ color: C.text }}>
                    <FileText size={16} style={{ color: C.teal, flexShrink: 0 }} />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{resumeName}</span>
                  </div>
                  <button onClick={downloadResume} className="flex items-center justify-center text-white rounded-[7px] px-[9px] py-[5px] text-[13px] border-none cursor-pointer transition-colors hover:bg-[#0f766e]" style={{ background: C.teal }}>
                    <Download size={13} />
                  </button>
                </div>
              )}
              <input type="file" ref={resumeInput} hidden accept=".pdf,.doc,.docx" onChange={e => handleResumeUpload(e.target.files[0])} />
              <div onClick={() => resumeInput.current?.click()} className="rounded-[12px] p-4 text-center cursor-pointer transition-all hover:border-[#0d9488] hover:bg-[#e0fff8]" style={{ background: C.tealPale, border: '1.5px dashed #99f6e4' }}>
                <Upload size={26} style={{ color: C.teal, display: 'block', margin: '0 auto' }} />
                <p className="text-[12.5px] font-semibold my-[7px] mb-[3px]" style={{ color: C.slate }}>{resumeName ? 'Update Resume' : 'Upload Resume'}</p>
                <small className="text-[11px]" style={{ color: '#94a3b8' }}>PDF, DOC, DOCX · Max 10MB</small>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div className="flex items-center gap-[7px] text-[13.5px] font-bold mb-[13px]" style={{ color: C.text }}>
                <Zap size={15} style={{ color: C.teal }} /> Quick Actions
              </div>
              {[
                ['applied', <FileText size={14}/>, 'View Applied Jobs', 'ud-qa-teal'],
                ['profile', <User size={14}/>, 'Update Profile', 'ud-qa-slate'],
                ['feedback', <MessageCircleHeart size={14}/>, 'Give Feedback', 'ud-qa-green'],
              ].map(([tab, icon, label, cls]) => (
                <button key={tab} onClick={() => switchTab(tab)} className={`w-full flex items-center gap-2 px-[13px] py-[9px] rounded-[10px] text-[12.5px] font-semibold cursor-pointer border text-left transition-all mb-[7px] font-['DM_Sans',sans-serif] ${cls}`}>
                  {icon} {label}
                </button>
              ))}
              <Link to="/govt-jobs" className="w-full flex items-center gap-2 px-[13px] py-[9px] rounded-[10px] text-[12.5px] font-semibold border text-left no-underline transition-all ud-qa-slate font-['DM_Sans',sans-serif]" style={{ display: 'flex', marginBottom: 0 }}>
                <Building2 size={14} /> Govt Jobs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PANEL: APPLIED JOBS
      ══════════════════════════════════════ */}
      {activeTab === 'applied' && (
        <div style={{ padding: '22px 28px', maxWidth: 1100, margin: '0 auto' }} className="ud-apps-layout">
          <style>{`@media(max-width:768px){.ud-apps-layout{padding:14px!important}} @media(max-width:768px){.ud-stats-row{grid-template-columns:repeat(2,1fr)!important}}`}</style>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[18px] text-white mb-5" style={{ background: 'linear-gradient(135deg,#0a1628 0%,#1a2f50 60%,#0f3460 100%)', padding: '28px 32px' }}>
            <div className="absolute pointer-events-none rounded-full" style={{ right: -40, top: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(13,148,136,.3) 0%,transparent 70%)' }} />
            <h4 className="text-[20px] font-extrabold mb-[5px]">My Applications</h4>
            <p className="text-[13.5px]" style={{ color: 'rgba(255,255,255,.55)' }}>Track all your job applications in one place</p>
          </div>

          {/* Stat cards */}
          <div className="ud-stats-row grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              ['Applied', appCounts.APPLIED, <Send size={18}/>, '#3b82f6','#eff6ff'],
              ['Shortlisted', appCounts.SHORTLISTED, <Star size={18}/>, '#f59e0b','#fffbeb'],
              ['Hired', appCounts.HIRED, <CheckCircle size={18}/>, '#22c55e','#f0fdf4'],
              ['Rejected', appCounts.REJECTED, <X size={18}/>, '#ef4444','#fef2f2'],
            ].map(([label, count, icon, color, bg]) => (
              <div key={label} className="relative overflow-hidden text-center rounded-[14px] border transition-all hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,.08)]" style={{ background: '#fff', borderColor: C.border, padding: 18 }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
                <div className="flex items-center justify-center w-10 h-10 rounded-[10px] mx-auto mb-2" style={{ background: bg, color }}>{icon}</div>
                <div className="text-[26px] font-extrabold leading-none mb-[3px]" style={{ color: C.text }}>{count}</div>
                <div className="text-[12px]" style={{ color: C.slate }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-[22px] py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="text-[14.5px] font-bold">All Applications</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    {['Job Title','Company','Status','Applied On','Resume'].map(h => (
                      <th key={h} className="px-5 py-[11px] text-[11.5px] font-bold uppercase tracking-[.5px] text-left" style={{ color: C.slate, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appsLoading ? (
                    <tr><td colSpan={5} className="text-center py-10"><div style={{ width: 28, height: 28, border: `3px solid #e2e8f0`, borderTopColor: C.teal, borderRadius: '50%', animation: 'udFbSpin .7s linear infinite', margin: '0 auto' }} /></td></tr>
                  ) : applications.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-11" style={{ color: C.slate }}>
                      <Briefcase size={32} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 10px' }} />
                      No applications yet
                    </td></tr>
                  ) : applications.map((app, i) => (
                    <tr key={i} className="hover:bg-[#fafafa]" style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="px-5 py-[13px] font-bold">{app.jobTitle || '—'}</td>
                      <td className="px-5 py-[13px]" style={{ color: C.slate }}>{app.companyName || '—'}</td>
                      <td className="px-5 py-[13px]"><StatusPill status={app.applicationStatus} /></td>
                      <td className="px-5 py-[13px] text-[12.5px]" style={{ color: C.slate }}>{app.appliedAt ? fmtDate(app.appliedAt) : '—'}</td>
                      <td className="px-5 py-[13px]">{app.resumeUrl ? <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] no-underline" style={{ color: C.teal }}><FileText size={13} />View</a> : <span style={{ color: '#b0b7c3' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PANEL: PROFILE
      ══════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div style={{ padding: '22px 28px', maxWidth: 900, margin: '0 auto' }} className="ud-profile-layout">
          <style>{`@media(max-width:768px){.ud-profile-layout{padding:14px!important}} @media(max-width:768px){.ud-profile-hero{flex-direction:column!important;text-align:center!important;padding:22px 18px!important}} @media(max-width:768px){.ud-profile-avatar{margin:0 auto!important}}`}</style>

          {/* Profile hero */}
          <div className="ud-profile-hero relative overflow-hidden rounded-[18px] flex items-center gap-[22px] mb-[22px]" style={{ background: 'linear-gradient(145deg,#0a1628 0%,#0f2a4a 60%,#0d4040 100%)', padding: '28px 32px' }}>
            <div className="absolute pointer-events-none rounded-full" style={{ right: -60, top: -60, width: 220, height: 220, background: 'radial-gradient(circle,rgba(13,148,136,.2) 0%,transparent 70%)' }} />
            <input type="file" ref={profileImgRef} hidden accept="image/jpeg,image/png,image/webp" onChange={e => handleProfileImageUpload(e.target.files[0])} />
            <div onClick={() => profileImgRef.current?.click()} className="ud-profile-avatar relative rounded-full cursor-pointer flex items-center justify-center shrink-0 text-[26px] font-extrabold text-white overflow-hidden" style={{ width: 86, height: 86, border: '3px solid rgba(255,255,255,.2)', background: C.teal }}>
              {profile?.profileImg ? <img src={profile.profileImg} alt="" className="w-full h-full object-cover" /> : initials}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 16 }}><Camera size={16} /></div>
            </div>
            <div className="flex-1 relative">
              <div className="text-[20px] font-extrabold text-white mb-[3px]">{displayName}</div>
              <div className="text-[13px] mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>{user?.email || ''}</div>
              <span className="inline-block text-[11px] font-bold px-[11px] py-[3px] rounded-full" style={{ background: 'rgba(13,148,136,.25)', border: '1px solid rgba(13,148,136,.4)', color: '#5eead4' }}>Job Seeker</span>
            </div>
          </div>

          {/* Profile completeness bar */}
          <div className="flex items-center gap-[14px] rounded-[14px] border mb-[18px] px-5 py-4" style={{ background: '#fff', borderColor: C.border }}>
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: C.text }}>Profile completeness</span>
            <div className="flex-1">
              <div className="h-[6px] rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pcPct}%`, background: C.teal }} />
              </div>
            </div>
            <span className="text-[13px] font-extrabold whitespace-nowrap" style={{ color: C.teal, fontFamily: "'DM Mono', monospace" }}>{pcPct}%</span>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1.5 flex-wrap mb-[18px]">
            {[
              ['address', <MapPin size={15}/>, 'Address'],
              ['resume', <FileText size={15}/>, 'Resume'],
              ['skills', <Zap size={15}/>, 'Skills'],
              ['experience', <Briefcase size={15}/>, 'Experience'],
              ['education', <GraduationCap size={15}/>, 'Education'],
            ].map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setProfileStab(tab)}
                className={`flex items-center gap-[6px] px-4 py-2 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] ${profileStab === tab ? 'ud-stab-active' : ''}`}
                style={profileStab === tab ? { background: C.teal, color: '#fff', borderColor: C.teal } : { background: '#fff', color: C.slate, borderColor: C.border }}>
                {icon} <span className={profileStab !== tab ? 'hidden md:inline' : 'inline'}>{label}</span>
              </button>
            ))}
          </div>

          {/* Sub-tab panels */}
          {[
            {
              key: 'address', icon: <MapPin size={14}/>, title: 'Address', color: 'teal',
              action: <button onClick={() => { setAddrLine1(''); setAddrLine2(''); setAddrPincode(''); setAddrCity(''); setAddrState(''); setAddrCountry('India'); setPinStatus(''); setPinInfo(''); setAddrModal(true); }} className="ud-btn-add-sm inline-flex items-center gap-[5px] text-[12px] font-bold px-[13px] py-1 rounded-full border-[1.5px] border-[#0a1628] text-[#0a1628] bg-white cursor-pointer hover:bg-[#0a1628] hover:text-white transition-all font-['DM_Sans',sans-serif]"><Pencil size={12} /> Edit</button>,
              body: <div className="text-[13px] leading-[1.7]" style={{ color: C.slate }}>{address || 'Not added'}</div>
            },
            {
              key: 'resume', icon: <FileText size={14}/>, title: 'Resume', color: 'blue',
              action: <><input type="file" ref={profileResumeRef} hidden accept=".pdf,.doc,.docx" onChange={e => handleResumeUpload(e.target.files[0], true)} /><button onClick={() => profileResumeRef.current?.click()} className="ud-btn-add-sm inline-flex items-center gap-[5px] text-[12px] font-bold px-[13px] py-1 rounded-full border-[1.5px] border-[#0a1628] text-[#0a1628] bg-white cursor-pointer hover:bg-[#0a1628] hover:text-white transition-all font-['DM_Sans',sans-serif]"><Upload size={12} /> Upload new</button></>,
              body: (
                <div className="rounded-[10px] px-[14px] py-[11px] flex justify-between items-center" style={{ background: '#f5faff', border: '.5px solid #dce9fb' }}>
                  <span className="flex items-center gap-[7px] text-[13px] font-semibold" style={{ color: '#333' }}>
                    <FileText size={16} style={{ color: '#378add' }} />
                    {resumeName || 'No resume uploaded'}
                  </span>
                  {resumeUrl && (
                    <div className="flex gap-1.5">
                      <button onClick={downloadResume} className="text-[12px] px-[13px] py-1 rounded-full font-semibold border-none cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#cde3f7]" style={{ background: '#e6f1fb', color: '#185fa5' }}>View</button>
                      <button onClick={downloadResume} className="text-[12px] px-[13px] py-1 rounded-full text-white font-semibold border-none cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#0d9488]" style={{ background: C.navy }}>Download</button>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'skills', icon: <Zap size={14}/>, title: 'Skills', color: 'teal',
              action: <button onClick={() => { setSkillName(''); setSkillId(''); setSkillModal(true); }} className="ud-btn-add-sm inline-flex items-center gap-[5px] text-[12px] font-bold px-[13px] py-1 rounded-full border-[1.5px] border-[#0a1628] text-[#0a1628] bg-white cursor-pointer hover:bg-[#0a1628] hover:text-white transition-all font-['DM_Sans',sans-serif]"><Plus size={12} /> Add skill</button>,
              body: (
                <div className="flex flex-wrap">
                  {skills.length === 0 ? <span className="text-[13px] italic" style={{ color: '#b0b7c3' }}>No skills added yet</span> : skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-[5px] m-[3px] px-3 py-[5px] rounded-full text-[12px] font-semibold" style={{ background: '#e1f5ee', color: '#085041' }}>
                      {s.skillName || (typeof s === 'string' ? s : '')}
                      <button onClick={() => deleteSkill(s.skillId || s.id || i)} className="opacity-50 cursor-pointer text-[14px] bg-none border-none hover:opacity-100 hover:text-[#dc2626] transition-all">×</button>
                    </span>
                  ))}
                </div>
              )
            },
            {
              key: 'experience', icon: <Briefcase size={14}/>, title: 'Experience', color: 'blue',
              action: <button onClick={() => { setExpData({ id: '', jobTitle: '', companyName: '', employmentType: 'FULL TIME', startDate: '', endDate: '', isCurrentJob: false }); setExpModal(true); }} className="ud-btn-add-sm inline-flex items-center gap-[5px] text-[12px] font-bold px-[13px] py-1 rounded-full border-[1.5px] border-[#0a1628] text-[#0a1628] bg-white cursor-pointer hover:bg-[#0a1628] hover:text-white transition-all font-['DM_Sans',sans-serif]"><Plus size={12} /> Add</button>,
              body: experience.length === 0 ? <span className="text-[13px] italic" style={{ color: '#b0b7c3' }}>No experience added yet</span> : experience.map((exp, i) => (
                <div key={i} className="flex gap-3 py-3" style={{ borderBottom: i < experience.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
                  <div className="flex items-center justify-center shrink-0 rounded-[9px]" style={{ width: 36, height: 36, background: '#e6f1fb', color: '#185fa5' }}><Briefcase size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold mb-[2px]">{exp.job_title || '—'}</div>
                    <div className="text-[12.5px]" style={{ color: C.slate }}>{exp.company_name || '—'} · {fmtDate(exp.start_date)} – {exp.isCurrentJob ? 'Present' : fmtDate(exp.end_date)}</div>
                    <span className="text-[10.5px] px-[9px] py-[2px] rounded-full mt-[5px] inline-block font-semibold" style={{ background: '#f0f4ff', color: '#185fa5' }}>{exp.employment_type || ''}</span>
                  </div>
                  <div className="flex gap-[5px] shrink-0 self-start mt-[2px]">
                    <button onClick={() => { setExpData({ id: exp.exp_id, jobTitle: exp.job_title, companyName: exp.company_name, employmentType: exp.employment_type || 'FULL TIME', startDate: exp.start_date, endDate: exp.end_date, isCurrentJob: exp.isCurrentJob }); setExpModal(true); }} className="text-[11.5px] px-3 py-1 rounded-[8px] border font-semibold cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#0d9488] hover:text-white" style={{ borderColor: C.teal, color: C.teal, background: '#fff' }}>Edit</button>
                    <button onClick={() => deleteExp(exp.exp_id)} className="text-[11.5px] px-2.5 py-1 rounded-[8px] border font-semibold cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#fef2f2]" style={{ borderColor: '#fecaca', color: '#dc2626', background: '#fff' }}>Del</button>
                  </div>
                </div>
              ))
            },
            {
              key: 'education', icon: <GraduationCap size={14}/>, title: 'Education', color: 'amber',
              action: <button onClick={() => { setEduData({ id: '', boardName: '', degree: '', specialization: '', institute: '', startYear: '', endYear: '', percentage: '' }); setEduModal(true); }} className="ud-btn-add-sm inline-flex items-center gap-[5px] text-[12px] font-bold px-[13px] py-1 rounded-full border-[1.5px] border-[#0a1628] text-[#0a1628] bg-white cursor-pointer hover:bg-[#0a1628] hover:text-white transition-all font-['DM_Sans',sans-serif]"><Plus size={12} /> Add</button>,
              body: education.length === 0 ? <span className="text-[13px] italic" style={{ color: '#b0b7c3' }}>No education added yet</span> : education.map((edu, i) => (
                <div key={i} className="flex gap-3 py-3" style={{ borderBottom: i < education.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
                  <div className="flex items-center justify-center shrink-0 rounded-[9px]" style={{ width: 36, height: 36, background: '#faeeda', color: '#ba7517' }}><GraduationCap size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold mb-[2px]">{edu.degree || '—'}{edu.specialization ? <span className="font-medium ml-1" style={{ color: C.slate }}>({edu.specialization})</span> : ''}</div>
                    <div className="text-[12.5px]" style={{ color: C.slate }}>{edu.institute_name || '—'}</div>
                    <div className="text-[12.5px]" style={{ color: C.slate }}>{edu.board_name || ''} · {fmtDate(edu.start_year)} – {edu.end_year ? fmtDate(edu.end_year) : 'Present'}</div>
                    {edu.percentage && <span className="text-[10.5px] px-[9px] py-[2px] rounded-full mt-[5px] inline-block font-semibold" style={{ background: '#faeeda', color: '#ba7517' }}>{edu.percentage}%</span>}
                  </div>
                  <div className="flex gap-[5px] shrink-0 self-start mt-[2px]">
                    <button onClick={() => { setEduData({ id: edu.edu_id, boardName: edu.board_name, degree: edu.degree, specialization: edu.specialization, institute: edu.institute_name, startDate: edu.start_year, endDate: edu.end_year, percentage: edu.percentage }); setEduModal(true); }} className="text-[11.5px] px-3 py-1 rounded-[8px] border font-semibold cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#0d9488] hover:text-white" style={{ borderColor: C.teal, color: C.teal, background: '#fff' }}>Edit</button>
                    <button onClick={() => deleteEdu(edu.edu_id)} className="text-[11.5px] px-2.5 py-1 rounded-[8px] border font-semibold cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#fef2f2]" style={{ borderColor: '#fecaca', color: '#dc2626', background: '#fff' }}>Del</button>
                  </div>
                </div>
              ))
            }
          ].map(({ key, icon, title, action, body }) => profileStab === key && (
            <div key={key} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 14, overflow: 'hidden', transition: 'box-shadow .2s' }}>
              <div className="flex items-center justify-between px-[18px] py-[13px]" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-[9px]">
                  <div className="flex items-center justify-center text-[14px] rounded-[8px]" style={{ width: 30, height: 30, background: key === 'education' ? '#faeeda' : key === 'resume' ? '#e6f1fb' : '#e1f5ee', color: key === 'education' ? '#ba7517' : key === 'resume' ? '#185fa5' : '#0f6e56' }}>{icon}</div>
                  <span className="text-[14px] font-bold" style={{ color: C.text }}>{title}</span>
                </div>
                {action}
              </div>
              <div className="px-[18px] py-4">{body}</div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          PANEL: FEEDBACK
      ══════════════════════════════════════ */}
      {activeTab === 'feedback' && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '22px 28px 48px' }}>
          <style>{`@media(max-width:768px){.ud-fb-layout{padding:14px 14px 48px!important}}`}</style>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[16px] text-white mb-6" style={{ background: 'linear-gradient(135deg,#0b2239 0%,#1a3a5c 60%,#0d4a4a 100%)', padding: '26px 30px' }}>
            <div className="absolute pointer-events-none rounded-full" style={{ top: -50, right: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(13,148,136,.25),transparent 70%)' }} />
            <h4 className="relative text-[1.25rem] font-extrabold mb-1"><MessageCircleHeart size={20} className="inline mr-1"/> Share Your Feedback</h4>
            <p className="relative text-[13.5px]" style={{ color: 'rgba(255,255,255,.5)' }}>Tell us about your experience — your voice helps us improve.</p>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(10,22,40,.07)', overflow: 'hidden' }}>
            {/* Head */}
            <div className="flex items-center gap-[9px] px-[22px] py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Pencil size={15} style={{ color: C.teal }} />
              <span className="font-bold text-[14px]">{fbHeaderText}</span>
            </div>

            {/* Loading */}
            {fbState === 'loading' && (
              <div className="flex items-center justify-center gap-3 text-[13.5px] py-14" style={{ color: C.slate }}>
                <div style={{ width: 22, height: 22, border: `3px solid #e2e8f0`, borderTopColor: C.teal, borderRadius: '50%', animation: 'udFbSpin .7s linear infinite' }} /> Loading your feedback…
              </div>
            )}

            {/* Success */}
            {fbState === 'success' && (
              <div className="text-center py-11 px-[22px]">
                <CheckCircle2 size={28} style={{ color: '#22c55e', display: 'block', margin: '0 auto 12px', animation: 'udPopIn .4s cubic-bezier(.34,1.56,.64,1)' }} />
                <h5 className="text-[1.05rem] font-extrabold mb-[7px]">Thank you for your feedback!</h5>
                <p className="text-[13.5px] mb-[22px]" style={{ color: C.slate }}>We appreciate you taking the time to share your thoughts.</p>
                <button onClick={prefillFeedback} className="inline-flex items-center gap-[7px] rounded-full px-[22px] py-2.5 text-[13.5px] font-bold border-none cursor-pointer transition-all hover:bg-[#e2e8f0] font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.text }}>
                  <Pencil size={14} /> Edit My Feedback
                </button>
              </div>
            )}

            {/* Locked */}
            {fbState === 'locked' && fbLocked && (
              <div className="text-center py-9 px-[22px]">
                <Lock size={38} style={{ color: '#94a3b8', display: 'block', margin: '0 auto 12px' }} />
                <h5 className="text-[15px] font-extrabold mb-[5px]">Feedback Locked</h5>
                <p className="text-[13.5px] mb-[18px]" style={{ color: C.slate }}>Submitted {fbLocked.days} day{fbLocked.days !== 1 ? 's' : ''} ago. The 30-day edit window is closed.</p>
                <div className="rounded-[12px] p-[14px] text-left" style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderLeft: '3px solid #94a3b8' }}>
                  <div className="font-bold text-[14px] mb-[5px]">{fbLocked.subject || '—'}</div>
                  <div className="flex items-center gap-[5px] text-[16px] mb-2">
                    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill={i < fbLocked.rating ? '#f59e0b' : 'none'} style={{ color: i < fbLocked.rating ? '#f59e0b' : '#e2e8f0' }} />)}
                    <strong className="text-[13px] ml-1">{fbLocked.rating}/5</strong>
                  </div>
                  <div className="text-[13.5px] whitespace-pre-wrap leading-[1.6]" style={{ color: C.slate }}>{fbLocked.message || '—'}</div>
                </div>
              </div>
            )}

            {/* Form */}
            {fbState === 'form' && (
              <div className="p-[22px]">
                {/* Edit notice */}
                {fbIsEdit && (
                  <div className="flex items-start gap-[9px] rounded-[10px] px-[13px] py-2.5 mb-4 text-[13px]" style={{ background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)', color: C.teal }}>
                    <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div><strong>Editing your feedback</strong> — {fbEditDaysLeft} day{fbEditDaysLeft !== 1 ? 's' : ''} left to edit</div>
                  </div>
                )}
                {/* Alert */}
                {fbAlert && (
                  <div className="flex items-center gap-2 px-[14px] py-[11px] rounded-[10px] text-[13.5px] font-semibold mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    <AlertCircle size={14} /> {fbAlert}
                  </div>
                )}
                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold tracking-[.9px] uppercase mb-[7px]" style={{ color: '#94a3b8' }}>Subject</label>
                  <input value={fbSubject} onChange={e => { setFbSubject(e.target.value); setFbAlert(''); }} placeholder="e.g. Great experience with RojgarShine" maxLength={100}
                    className="w-full px-[14px] py-[10px] border-[1.5px] rounded-[10px] text-[13.5px] outline-none transition-all font-['DM_Sans',sans-serif] focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,.1)]" style={{ borderColor: '#e8ecf1', color: C.text, background: '#fff' }} />
                </div>
                {/* Message */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold tracking-[.9px] uppercase mb-[7px]" style={{ color: '#94a3b8' }}>Message</label>
                  <textarea value={fbMessage} onChange={e => { setFbMessage(e.target.value); setFbAlert(''); }} placeholder="Share your thoughts…" maxLength={500} rows={4}
                    className="w-full px-[14px] py-[10px] border-[1.5px] rounded-[10px] text-[13.5px] outline-none resize-y min-h-[100px] transition-all font-['DM_Sans',sans-serif] focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,.1)]" style={{ borderColor: '#e8ecf1', color: C.text, background: '#fff' }} />
                  <div className={`text-right text-[11.5px] mt-1 ${fbMessage.length > 450 ? 'text-[#f59e0b]' : ''}`} style={{ color: fbMessage.length > 450 ? '#f59e0b' : '#94a3b8' }}>{fbMessage.length} / 500</div>
                </div>
                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold tracking-[.9px] uppercase mb-[7px]" style={{ color: '#94a3b8' }}>Overall Rating</label>
                  <div className="flex items-center gap-[5px]">
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => { setFbRating(v); setFbAlert(''); }} className={`ud-star bg-none border-none p-0 cursor-pointer transition-all ${fbRating >= v ? 'ud-star-lit' : ''}`} style={{ color: fbRating >= v ? '#f59e0b' : '#e2e8f0' }}>
                        <Star size={24} fill={fbRating >= v ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                    <span className="text-[12px] ml-1.5" style={{ color: '#94a3b8' }}>
                      {fbRating ? `${fbRating}/5 — ${['','Poor','Fair','Good','Great','Excellent'][fbRating]}` : 'Tap to rate'}
                    </span>
                  </div>
                </div>
                {/* Submit */}
                <button onClick={submitFeedback} disabled={fbBusy} className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-bold border-none cursor-pointer transition-all font-['DM_Sans',sans-serif] hover:bg-[#0f766e] hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: C.teal, padding: '11px 28px' }}>
                  {fbBusy ? <Loader2 size={14} style={{ animation: 'udFbSpin .7s linear infinite' }} /> : <Send size={14} />}
                  {fbBusy ? (fbIsEdit ? 'Updating…' : 'Submitting…') : (fbIsEdit ? 'Update Feedback' : 'Submit Feedback')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════
          MODALS
      ═══════════════════ */}

      {/* Address Modal */}
      <Modal open={addrModal} onClose={() => setAddrModal(false)}>
        <ModalHead title="Edit Address" onClose={() => setAddrModal(false)} />
        <div className="p-[22px]">
          <ModalInput placeholder="Address Line 1" value={addrLine1} onChange={e => setAddrLine1(e.target.value)} />
          <ModalInput placeholder="Address Line 2 (optional)" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} />
          <ModalInput label="Pincode" placeholder="6-digit pincode" maxLength={6} value={addrPincode} onChange={e => lookupPincode(e.target.value)} />
          {pinStatus && <span className="block text-[11.5px] mb-2" style={{ color: C.slate }}>{pinStatus}</span>}
          {pinInfo && <div className="rounded-[10px] px-[13px] py-[9px] text-[13px] mb-2.5 flex items-center gap-2" style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: C.text }}><MapPin size={14} className="text-[#0d9488]" /> {pinInfo}</div>}
        </div>
        <div className="flex justify-end gap-2.5 px-[22px] py-[14px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setAddrModal(false)} className="px-5 py-[9px] rounded-full text-[13.5px] font-bold border-none cursor-pointer font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.slate }}>Cancel</button>
          <button onClick={saveAddress} className="px-[22px] py-[9px] rounded-full text-[13.5px] font-bold text-white border-none cursor-pointer transition-colors hover:bg-[#0f766e] font-['DM_Sans',sans-serif]" style={{ background: C.teal }}>Save Address</button>
        </div>
      </Modal>

      {/* Skill Modal */}
      <Modal open={skillModal} onClose={() => setSkillModal(false)} maxW={380}>
        <ModalHead title="Add Skill" onClose={() => setSkillModal(false)} />
        <div className="p-[22px]">
          <ModalInput placeholder="e.g. JavaScript, Python, UI/UX…" value={skillName} onChange={e => setSkillName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveSkill(); }} autoFocus />
        </div>
        <div className="flex justify-end gap-2.5 px-[22px] py-[14px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setSkillModal(false)} className="px-5 py-[9px] rounded-full text-[13.5px] font-bold border-none cursor-pointer font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.slate }}>Cancel</button>
          <button onClick={saveSkill} className="px-[22px] py-[9px] rounded-full text-[13.5px] font-bold text-white border-none cursor-pointer hover:bg-[#0f766e] font-['DM_Sans',sans-serif]" style={{ background: C.teal }}>Save Skill</button>
        </div>
      </Modal>

      {/* Experience Modal */}
      <Modal open={expModal} onClose={() => setExpModal(false)}>
        <ModalHead title={expData.id ? 'Edit Experience' : 'Add Experience'} onClose={() => setExpModal(false)} />
        <div className="p-[22px]">
          <ModalInput placeholder="Job Title" value={expData.jobTitle} onChange={e => setExpData(p => ({ ...p, jobTitle: e.target.value }))} />
          <ModalInput placeholder="Company Name" value={expData.companyName} onChange={e => setExpData(p => ({ ...p, companyName: e.target.value }))} />
          <ModalSelect value={expData.employmentType} onChange={e => setExpData(p => ({ ...p, employmentType: e.target.value }))}>
            {['FULL TIME','PART TIME','INTERNSHIP'].map(t => <option key={t}>{t}</option>)}
          </ModalSelect>
          <ModalInput label="Start Date" type="date" value={expData.startDate} onChange={e => setExpData(p => ({ ...p, startDate: e.target.value }))} />
          <ModalInput label="End Date" type="date" value={expData.endDate} onChange={e => setExpData(p => ({ ...p, endDate: e.target.value }))} />
          <div className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" id="curJob" checked={expData.isCurrentJob} onChange={e => setExpData(p => ({ ...p, isCurrentJob: e.target.checked }))} />
            <label htmlFor="curJob">This is my current job</label>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-[22px] py-[14px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setExpModal(false)} className="px-5 py-[9px] rounded-full text-[13.5px] font-bold border-none cursor-pointer font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.slate }}>Cancel</button>
          <button onClick={saveExp} className="px-[22px] py-[9px] rounded-full text-[13.5px] font-bold text-white border-none cursor-pointer hover:bg-[#0f766e] font-['DM_Sans',sans-serif]" style={{ background: C.teal }}>Save</button>
        </div>
      </Modal>

      {/* Education Modal */}
      <Modal open={eduModal} onClose={() => setEduModal(false)}>
        <ModalHead title={eduData.id ? 'Edit Education' : 'Add Education'} onClose={() => setEduModal(false)} />
        <div className="p-[22px]">
          <ModalInput placeholder="Board / University" value={eduData.boardName} onChange={e => setEduData(p => ({ ...p, boardName: e.target.value }))} />
          <ModalInput placeholder="Degree (e.g. B.Tech, MBA)" value={eduData.degree} onChange={e => setEduData(p => ({ ...p, degree: e.target.value }))} />
          <ModalInput placeholder="Specialization (optional)" value={eduData.specialization} onChange={e => setEduData(p => ({ ...p, specialization: e.target.value }))} />
          <ModalInput placeholder="Institute Name" value={eduData.institute} onChange={e => setEduData(p => ({ ...p, institute: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <ModalInput label="Start Date" type="date" value={eduData.startDate} onChange={e => setEduData(p => ({ ...p, startDate: e.target.value }))} />
            <ModalInput label="End Date" type="date" value={eduData.endDate} onChange={e => setEduData(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <ModalInput placeholder="Percentage / CGPA (optional)" value={eduData.percentage} onChange={e => setEduData(p => ({ ...p, percentage: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2.5 px-[22px] py-[14px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setEduModal(false)} className="px-5 py-[9px] rounded-full text-[13.5px] font-bold border-none cursor-pointer font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.slate }}>Cancel</button>
          <button onClick={saveEdu} className="px-[22px] py-[9px] rounded-full text-[13.5px] font-bold text-white border-none cursor-pointer hover:bg-[#0f766e] font-['DM_Sans',sans-serif]" style={{ background: C.teal }}>Save</button>
        </div>
      </Modal>

      {/* Apply Confirm Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)}>
        <ModalHead title="Confirm Application" onClose={() => setApplyModal(false)} />
        <div className="p-[22px]">
          <p className="text-[13.5px] mb-2" style={{ color: C.slate }}>You're about to apply for:</p>
          <div className="rounded-[10px] px-4 py-3 mb-3" style={{ background: '#f8fafc', border: `1px solid ${C.border}` }}>
            <strong style={{ color: C.text }}>{applyJob.title}</strong>
            <span style={{ color: C.slate }}> at {applyJob.company}</span>
          </div>
          {resumeUrl ? (
            <div className="flex items-center gap-2 rounded-[10px] px-4 py-3 text-[13px]" style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f6e56' }}>
              <CheckCircle size={15} /> Your saved resume will be submitted.
            </div>
          ) : (
            <div className="rounded-[10px] px-4 py-3 text-[13px]" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertTriangle size={15} /> No resume found. Please upload a resume before applying.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2.5 px-[22px] py-[14px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setApplyModal(false)} className="px-5 py-[9px] rounded-full text-[13.5px] font-bold border-none cursor-pointer font-['DM_Sans',sans-serif]" style={{ background: '#f1f5f9', color: C.slate }}>Cancel</button>
          <button onClick={confirmApply} disabled={!resumeUrl || applyBusy} className="inline-flex items-center gap-2 px-[22px] py-[9px] rounded-full text-[13.5px] font-bold text-white border-none cursor-pointer hover:bg-[#0f766e] disabled:opacity-45 disabled:cursor-not-allowed font-['DM_Sans',sans-serif] transition-colors" style={{ background: C.teal }}>
            {applyBusy && <Loader2 size={13} style={{ animation: 'udFbSpin .7s linear infinite' }} />}
            {applyBusy ? 'Applying…' : 'Confirm & Apply'}
          </button>
        </div>
      </Modal>

      {/* CF Modal (success/error) */}
      {cfModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(9,29,51,.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setCfModal(p => ({ ...p, open: false })); }}>
          <div className="text-center" style={{ background: '#fff', borderRadius: 20, padding: '42px 38px 34px', maxWidth: 400, width: 'calc(100% - 40px)', boxShadow: '0 32px 80px rgba(9,29,51,.22)', animation: 'udModalIn .3s cubic-bezier(.34,1.56,.64,1)' }}>
            <div className="flex items-center justify-center rounded-full mx-auto mb-5" style={{ width: 66, height: 66, background: cfModal.type === 'success' ? '#e6f7f6' : '#fef2f2', color: cfModal.type === 'success' ? C.teal : '#ef4444' }}>
              {cfModal.type === 'success' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h3 className="text-[1.2rem] font-extrabold mb-[9px]" style={{ color: '#0b2239' }}>{cfModal.title}</h3>
            <p className="text-[.88rem] mb-[26px] leading-[1.7]" style={{ color: C.slate }}>{cfModal.msg}</p>
            <button onClick={() => setCfModal(p => ({ ...p, open: false }))} className="inline-flex items-center gap-2 rounded-full font-extrabold text-white border-none cursor-pointer transition-colors font-['DM_Sans',sans-serif]" style={{ background: cfModal.type === 'success' ? C.teal : '#ef4444', padding: '11px 28px', fontSize: '.88rem' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
