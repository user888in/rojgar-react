import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserCog,
  Users,
  FileText,
  Building2,
  Briefcase,
  LayoutGrid,
  BookOpen,
  Mail,
  MessageSquare,
  Shield,
  Lock,
  UserCircle,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff,
  Pencil,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import footerLogo from '../../assets/images/Rojgarshine White Logo-01.png';

const SIDEBAR_W = 260;

const sections = [
  {
    label: 'Main',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/employers', icon: UserCog, label: 'Employers', page: 'employers' },
      { to: '/admin/candidates', icon: Users, label: 'Candidates', page: 'candidates' },
      { to: '/admin/applications', icon: FileText, label: 'Applications', page: 'applications' },
      { to: '/admin/companies', icon: Building2, label: 'Companies', page: 'companies' },
      { to: '/admin/jobs', icon: Briefcase, label: 'Jobs', page: 'jobs' },
      { to: '/admin/job-categories', icon: LayoutGrid, label: 'Job Categories', page: 'jobCategories' },
      { to: '/admin/blog-categories', icon: BookOpen, label: 'Blog Categories', page: 'blogCategories' },
      { to: '/admin/enquiries', icon: Mail, label: 'Contact Enquiries', page: 'contactEnquiries' },
      { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback', page: 'feedback' },
      { to: '/admin/security-questions', icon: Shield, label: 'Security Questions', page: 'securityQuestions', id: 'menuSecurityQuestions' },
    ],
  },
  {
    label: 'Admin Only',
    items: [
      { to: '/admin/sub-admins', icon: Lock, label: 'Sub Admins', page: 'subAdmins', id: 'menuSubAdmins' },
    ],
  },
];

const AdminLayout = () => {
  const { logout, user, getAuthHeaders, updateUser, authFetch } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('edit'); // 'edit' | 'password'
  const [profileForm, setProfileForm] = useState({ fullName: '', username: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ type: '', msg: '' }); // type: 'success' | 'error'
  const [pwForm, setPwForm] = useState({ currentPw: '', newPw: '', confirmPw: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwAlert, setPwAlert] = useState({ type: '', msg: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const sidebarRef = useRef(null);

  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const isActive = (routePath) => {
    const path = location.pathname;
    if (!routePath) return false;
    return path === routePath || path.startsWith(routePath + '/');
  };

  const isLocked = (item) => {
    if (!isSubAdmin) return false;
    return item.id === 'menuSubAdmins' || item.id === 'menuSecurityQuestions';
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleProfileOpen = () => {
    setProfileForm({
      fullName: user?.fullName || '',
      username: user?.username || '',
      phone: user?.phone || '',
    });
    setProfileAlert({ type: '', msg: '' });
    setPwForm({ currentPw: '', newPw: '', confirmPw: '' });
    setPwAlert({ type: '', msg: '' });
    setProfileTab('edit');
    setProfileOpen(true);
  };
  const handleProfileClose = () => setProfileOpen(false);

  // Password strength checker
  const getPwStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f59e0b' },
      { label: 'Good', color: '#3b82f6' },
      { label: 'Strong', color: '#22c55e' },
    ];
    return { score, ...levels[Math.min(score - 1, 3)] };
  };

  const pwStrength = getPwStrength(pwForm.newPw);

  const handleSaveProfile = async () => {
    setProfileAlert({ type: '', msg: '' });
    if (!profileForm.username.trim()) {
      setProfileAlert({ type: 'error', msg: 'Username cannot be empty.' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          username: profileForm.username.trim(),
          phone: profileForm.phone.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setProfileAlert({ type: 'success', msg: 'Profile updated successfully!' });
      updateUser({
        fullName: profileForm.fullName.trim(),
        username: profileForm.username.trim(),
        phone: profileForm.phone.trim(),
      });
    } catch {
      setProfileAlert({ type: 'error', msg: 'Failed to update profile. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwAlert({ type: '', msg: '' });
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwAlert({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwAlert({ type: 'error', msg: 'Password must be at least 8 characters.' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwForm.currentPw, newPassword: pwForm.newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to change password');
      }
      setPwAlert({ type: 'success', msg: 'Password changed successfully!' });
      setPwForm({ currentPw: '', newPw: '', confirmPw: '' });
    } catch (err) {
      setPwAlert({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Mobile Topbar */}
      <div className="flex md:hidden items-center justify-between sticky top-0 z-[200] px-4 py-3" style={{ background: '#0b2239' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-none border-none text-white text-2xl cursor-pointer p-0"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Link to="/admin/dashboard" className="flex items-center">
          <img src={footerLogo} alt="RojgarShine" className="h-12 w-auto object-contain" style={{ filter: 'brightness(1.08)' }} />
        </Link>
        <div className="w-6" />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[150] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Dynamic width styles so SIDEBAR_W controls everything */}
      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar { left: -${SIDEBAR_W}px; }
          .admin-sidebar.open { left: 0; }
        }
        @media (min-width: 768px) {
          .admin-main { margin-left: ${SIDEBAR_W}px; }
        }
        @keyframes rsPmSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar fixed top-0 h-screen z-[200] flex flex-col overflow-y-auto transition-[left] duration-300 ${mobileOpen ? 'open' : ''} md:left-0`}
        style={{
          width: SIDEBAR_W,
          background: '#0b2239',
        }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center" style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <Link to="/admin/dashboard">
              <img
                src={footerLogo}
                alt="RojgarShine"
                className="h-12 w-auto object-contain"
                style={{ filter: 'brightness(1.08)' }}
              />
            </Link>
          </div>
          <div
            className="inline-flex items-center gap-[5px] mt-2 text-[9.5px] font-bold tracking-widest uppercase rounded-full"
            style={
              isSubAdmin
                ? { background: 'rgba(217,119,6,0.2)', color: '#fcd34d', border: '1px solid rgba(217,119,6,0.3)', padding: '3px 10px' }
                : { background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)', padding: '3px 10px' }
            }
          >
            {isSubAdmin ? 'SUB ADMIN' : 'ADMIN'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1" style={{ padding: '10px 0' }}>
          {sections.map((sec, sIdx) => (
            <div key={sec.label}>
              <div
                className="font-bold uppercase tracking-widest"
                style={{
                  padding: '10px 20px 4px',
                  fontSize: '9.5px',
                  color: 'rgba(255,255,255,0.25)',
                  letterSpacing: '1.5px',
                }}
              >
                {sec.label}
              </div>
              {sec.items.map((item) => {
                const active = isActive(item.to);
                const locked = isLocked(item);
                const Icon = item.icon;
                return locked ? (
                  <div
                    key={item.to}
                    className="flex items-center gap-[10px] w-full text-left cursor-not-allowed"
                    style={{
                      padding: '10px 20px',
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: '14px',
                      fontWeight: 400,
                      opacity: 0.35,
                      borderLeft: '3px solid transparent',
                    }}
                  >
                    <Icon size={18} style={{ width: 18 }} />
                    <span className="flex-1">{item.label}</span>
                    <Lock size={18} />
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-[10px] w-full text-left no-underline transition-all"
                    style={{
                      padding: '10px 20px',
                      color: active ? '#14b8a6' : 'rgba(255,255,255,0.55)',
                      fontSize: '14px',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'rgba(13,148,136,0.15)' : 'transparent',
                      borderLeft: active ? '3px solid #14b8a6' : '3px solid transparent',
                      textDecoration: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.88)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                      }
                    }}
                  >
                    <Icon size={18} style={{ width: 18 }} />
                    {item.label}
                  </Link>
                );
              })}
              {sIdx < sections.length - 1 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
              )}
            </div>
          ))}

          {/* Profile + Logout */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
          <button
            onClick={handleProfileOpen}
            className="flex items-center gap-[10px] w-full text-left bg-none border-none cursor-pointer transition-all"
            style={{
              padding: '10px 20px',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '14px',
              fontWeight: 400,
              borderLeft: '3px solid transparent',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.88)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <UserCircle size={18} style={{ width: 18 }} />
            My Profile
          </button>
          <button
            onClick={() => { logout(); setMobileOpen(false); }}
            className="flex items-center gap-[10px] w-full text-left bg-none border-none cursor-pointer transition-all"
            style={{
              padding: '10px 20px',
              color: '#f87171',
              fontSize: '15px',
              fontWeight: 400,
              borderLeft: '3px solid transparent',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={18} style={{ width: 18, color: '#f87171' }} />
            Logout
          </button>
        </nav>

        {/* Admin Info Footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-[10px]">
            <div
              className="flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">
                {fullName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: 1 }}>
                {isSubAdmin ? 'Sub Administrator' : 'Administrator'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Page Content */}
        <div className="p-8">
          <Outlet context={{ onOpenProfile: () => setProfileOpen(true) }} />
        </div>
      </main>

      {/* Profile Modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-5"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={handleProfileClose}
        >
          <div
            className="bg-white w-full max-w-[580px] rounded-[20px] overflow-hidden overflow-y-auto shadow-[0_24px_64px_rgba(11,34,57,0.18)]"
            style={{ maxHeight: 'calc(100vh - 40px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — dark navy with decorative glow */}
            <div className="flex items-center justify-between px-6 py-5 relative overflow-hidden" style={{ background: '#0b2239' }}>
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.3), transparent 70%)' }} />
              <div className="flex items-center gap-[14px] relative z-[1]">
                <div
                  className="flex items-center justify-center text-white font-extrabold text-[18px] flex-shrink-0 border-2 border-white/15"
                  style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">{fullName}</p>
                  <p className="text-[12px] mt-[2px] m-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email || ''}</p>
                  <span
                    className="inline-flex items-center gap-1 mt-[5px] text-[10px] font-bold tracking-[0.8px] px-[10px] py-[3px] rounded-full"
                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.35)', color: '#14b8a6' }}
                  >
                    {isSubAdmin ? 'SUB ADMIN' : 'ADMIN'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleProfileClose}
                type="button"
                aria-label="Close"
                className="flex items-center justify-center w-8 h-8 rounded-lg relative z-[1] cursor-pointer border transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-[#e8ecf1] bg-[#fafbfc]">
              <button
                onClick={() => { setProfileTab('edit'); setProfileAlert({ type: '', msg: '' }); }}
                type="button"
                className={`flex items-center gap-[7px] px-[18px] py-[14px] text-[13.5px] font-medium cursor-pointer bg-transparent border-b-2 transition-all ${
                  profileTab === 'edit'
                    ? 'text-[#0d9488] border-[#0d9488] font-semibold'
                    : 'text-[#64748b] border-transparent hover:text-[#0f172a]'
                }`}
              >
                <Pencil size={14} /> Edit Profile
              </button>
              <button
                onClick={() => { setProfileTab('password'); setPwAlert({ type: '', msg: '' }); }}
                type="button"
                className={`flex items-center gap-[7px] px-[18px] py-[14px] text-[13.5px] font-medium cursor-pointer bg-transparent border-b-2 transition-all ${
                  profileTab === 'password'
                    ? 'text-[#0d9488] border-[#0d9488] font-semibold'
                    : 'text-[#64748b] border-transparent hover:text-[#0f172a]'
                }`}
              >
                <Shield size={14} /> Change Password
              </button>
            </div>

            {/* Edit Profile Tab */}
            {profileTab === 'edit' && (
              <div className="p-6 bg-white">
                {profileAlert.msg && (
                  <div className={`flex items-start gap-[10px] px-[14px] py-3 rounded-[10px] text-[13px] mb-[14px] ${
                    profileAlert.type === 'success'
                      ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a]'
                      : 'bg-[#fef2f2] border border-[#fecaca] text-[#dc2626]'
                  }`}>
                    {profileAlert.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0 mt-[1px]" /> : <AlertCircle size={16} className="flex-shrink-0 mt-[1px]" />}
                    <span>{profileAlert.msg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-[14px]">
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Username</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="username"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#64748b] bg-[#f8fafc] outline-none cursor-not-allowed"
                    />
                    <p className="text-[12px] text-[#64748b] mt-[5px] flex items-center gap-1.5">
                      <Lock size={10} /> Email cannot be changed
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-[10px] mt-5 pt-4 border-t border-[#e8ecf1]">
                  <button
                    onClick={handleProfileClose}
                    type="button"
                    className="px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold bg-[#f1f5f9] text-[#64748b] border-none cursor-pointer transition-all hover:bg-[#e2e8f0] hover:text-[#0f172a]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    type="button"
                    className="px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold bg-[#0d9488] text-white border-none cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-[7px]"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {profileTab === 'password' && (
              <div className="p-6 bg-white">
                {pwAlert.msg && (
                  <div className={`flex items-start gap-[10px] px-[14px] py-3 rounded-[10px] text-[13px] mb-[14px] ${
                    pwAlert.type === 'success'
                      ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a]'
                      : 'bg-[#fef2f2] border border-[#fecaca] text-[#dc2626]'
                  }`}>
                    {pwAlert.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0 mt-[1px]" /> : <AlertCircle size={16} className="flex-shrink-0 mt-[1px]" />}
                    <span>{pwAlert.msg}</span>
                  </div>
                )}

                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Current Password</label>
                  <div className="flex border-[1.5px] border-[#e8ecf1] rounded-[10px] overflow-hidden transition-all focus-within:border-[#0d9488] focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]">
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.currentPw}
                      onChange={(e) => setPwForm(f => ({ ...f, currentPw: e.target.value }))}
                      placeholder="Current password"
                      className="flex-1 px-[14px] py-[10px] border-none shadow-none rounded-none text-[14px] text-[#0f172a] bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                      className="bg-[#f8fafc] border-none border-l-[1.5px] border-l-[#e8ecf1] px-[14px] text-[#64748b] cursor-pointer transition-all hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                    >
                      {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">New Password</label>
                  <div className="flex border-[1.5px] border-[#e8ecf1] rounded-[10px] overflow-hidden transition-all focus-within:border-[#0d9488] focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]">
                    <input
                      type={showPw.new ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={(e) => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="flex-1 px-[14px] py-[10px] border-none shadow-none rounded-none text-[14px] text-[#0f172a] bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                      className="bg-[#f8fafc] border-none border-l-[1.5px] border-l-[#e8ecf1] px-[14px] text-[#64748b] cursor-pointer transition-all hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                    >
                      {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bars */}
                  {pwForm.newPw && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{ background: pwStrength.score >= i ? pwStrength.color : '#e2e8f0' }}
                          />
                        ))}
                      </div>
                      <span className="text-[11.5px] font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                  )}

                  {/* Password requirements card */}
                  <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] px-[14px] py-3 mt-3">
                    <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.8px] mb-2">Password requirements</div>
                    <ul className="list-none p-0 m-0 flex flex-col gap-[5px]">
                      {[
                        { test: pwForm.newPw.length >= 8, label: 'At least 8 characters' },
                        { test: /[A-Z]/.test(pwForm.newPw), label: 'One uppercase letter (A-Z)' },
                        { test: /[0-9]/.test(pwForm.newPw), label: 'One number (0-9)' },
                        { test: /[^A-Za-z0-9]/.test(pwForm.newPw), label: 'One special character (!@#$...)' },
                      ].map((req, i) => (
                        <li key={i} className={`flex items-center gap-[7px] text-[12.5px] transition-colors ${req.test ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>
                          {req.test ? <CheckCircle size={12} className="text-[#22c55e]" /> : <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />}
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="block text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#94a3b8] mb-[7px]">Confirm New Password</label>
                  <div className="flex border-[1.5px] border-[#e8ecf1] rounded-[10px] overflow-hidden transition-all focus-within:border-[#0d9488] focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.confirmPw}
                      onChange={(e) => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                      placeholder="Re-enter new password"
                      className="flex-1 px-[14px] py-[10px] border-none shadow-none rounded-none text-[14px] text-[#0f172a] bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                      className="bg-[#f8fafc] border-none border-l-[1.5px] border-l-[#e8ecf1] px-[14px] text-[#64748b] cursor-pointer transition-all hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                    >
                      {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-[10px] mt-5 pt-4 border-t border-[#e8ecf1]">
                  <button
                    onClick={handleProfileClose}
                    type="button"
                    className="px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold bg-[#f1f5f9] text-[#64748b] border-none cursor-pointer transition-all hover:bg-[#e2e8f0] hover:text-[#0f172a]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    type="button"
                    className="px-[22px] py-[10px] rounded-full text-[13.5px] font-semibold bg-[#0d9488] text-white border-none cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-[7px]"
                  >
                    {pwSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
