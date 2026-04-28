import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Info,
  LayoutGrid,
  Bookmark,
  MessageSquareHeart,
  ArrowLeftRight,
  LogIn,
  UserPlus,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  UserCircle,
  FileText,
  LogOut,
  PlusCircle,
  Briefcase,
  Users,
  Landmark,
} from 'lucide-react';
import rojgar_shine_logo from "../../assets/images/Rojgarshine logo-01.png"

function initials(name) {
  if (!name) return 'U';
  const p = name.trim().split(' ');
  return (p.length > 1 ? p[0][0] + p[1][0] : p[0][0]).toUpperCase();
}

const jobSeekerLinks = [
  { to: '/jobs', icon: Search, label: 'Jobs', page: 'jobs' },
  { to: '/govt-jobs', icon: Landmark, label: 'Govt Jobs', page: 'govt', badge: 'New' },
  { to: '/about', icon: Info, label: 'About Us', page: 'about' },
  { to: '/services', icon: LayoutGrid, label: 'Services', page: 'services' },
  { to: '/blog', icon: Bookmark, label: 'Blog', page: 'blog' },
  { to: '/feedback', icon: MessageSquareHeart, label: 'Feedback', page: 'feedbacks' },
];

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN';
  const isRecruiterMode = location.pathname.startsWith('/recruiter');
  const isRecruiterHomePage = location.pathname === '/recruiter';

  const recruiterLinks = [
    { to: isAuthenticated ? '/recruiter/dashboard' : '/recruiter/login', icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { to: isAuthenticated ? '/recruiter/post-job' : '/recruiter/login', icon: PlusCircle, label: 'Post Job', page: 'post' },
    { to: isAuthenticated ? '/recruiter/jobs' : '/recruiter/login', icon: Briefcase, label: 'Manage Jobs', page: 'manage' },
    { to: isAuthenticated ? '/recruiter/applications' : '/recruiter/login', icon: Users, label: 'Applications', page: 'applications' },
  ];

  let navLinks = isRecruiterMode ? recruiterLinks : jobSeekerLinks;

  const logoTo = isRecruiterMode ? '/recruiter' : '/';
  const switchTo = isRecruiterMode ? '/' : '/recruiter';
  const switchLabel = isRecruiterMode ? 'Job Seeker' : 'For Recruiters';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);

  const ddRef = useRef(null);
  const burgerRef = useRef(null);
  const mobileRef = useRef(null);

  const isUserDashboard = location.pathname === '/dashboard';

  // Header should be hidden ONLY on the User Dashboard for standard users
  if (!isAdmin && isUserDashboard) {
    return null;
  }

  const isActive = useCallback(
    (page) => {
      const path = location.pathname;
      if (page === 'jobs') return path === '/jobs' || path.startsWith('/jobs/');
      if (page === 'about') return path === '/about';
      if (page === 'services') return path === '/services';
      if (page === 'blog') return path === '/blog';
      if (page === 'feedbacks') return path === '/feedback';
      if (page === 'govt') return path === '/govt-jobs';
      if (page === 'dashboard') return path === '/recruiter/dashboard' || path === '/dashboard';
      if (page === 'post') return path === '/recruiter/post-job';
      if (page === 'manage') return path === '/recruiter/jobs';
      if (page === 'applications') return path === '/recruiter/applications';
      return false;
    },
    [location.pathname]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setDdOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (
        ddRef.current &&
        !ddRef.current.contains(e.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(e.target)
      ) {
        setDdOpen(false);
      }
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const avatarInner = user?.profileImg ? (
    <img
      src={user.profileImg}
      alt={isAdmin ? 'Admin' : initials(user.fullName)}
      className="w-full h-full object-cover rounded-full"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.textContent = isAdmin ? 'A' : initials(user.fullName);
      }}
    />
  ) : (
    isAdmin ? 'A' : initials(user?.fullName)
  );

  const firstName = (user?.fullName || 'User').split(' ')[0];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[62px] bg-white border-b border-[#e2e8f0] flex items-center px-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {/* Logo */}
        <Link to={logoTo} className="flex items-center gap-2 no-underline mr-7 flex-shrink-0">
          <img
            src={rojgar_shine_logo}
            alt="RojgarShine"
            className="h-10"
          />
          {isRecruiterMode && (
            <span className="text-[9px] font-extrabold tracking-[1.4px] uppercase text-white bg-[#091d33] px-2 py-[2px] rounded border border-[rgba(245,158,11,0.4)]">
              Recruiter
            </span>
          )}
        </Link>

        {/* Desktop links */}
        <div className="flex items-center gap-[2px] flex-1 max-[900px]:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-[6px] py-[7px] px-[13px] rounded-lg text-[13px] font-medium no-underline transition-colors whitespace-nowrap border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] ${isActive(item.page)
                ? 'bg-[#e6f7f5] text-[#18a99c] font-semibold'
                : 'text-[#64748b]'
                }`}
            >
              <item.icon size={14} />
              {item.label}
              {item.badge && (
                <span className="absolute -top-[3px] -right-[1px] px-[5px] py-[4px] text-[7.5px] font-bold text-white bg-red-700 rounded uppercase leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right area */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Switch pill (desktop) */}
          <Link
            to={switchTo}
            className="inline-flex items-center gap-[6px] text-xs font-semibold text-[#64748b] no-underline border border-[#e2e8f0] rounded-full py-[5px] px-[14px] transition-all whitespace-nowrap hover:bg-[#f1f5f9] hover:border-[#b0bec8] hover:text-[#091d33] max-[900px]:hidden"
          >
            <ArrowLeftRight size={14} />
            {switchLabel}
          </Link>

          {/* Auth area */}
          <div className="relative" ref={ddRef}>
            {isLoading ? (
              <div className="w-[120px] h-9 rounded-full bg-[#e8ecf0] animate-pulse" />
            ) : (isAuthenticated && !(isRecruiterHomePage && user?.role !== 'RECRUITER')) ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDdOpen((v) => !v);
                  }}
                  className="flex items-center gap-[7px] bg-white border-[1.5px] border-[#e2e8f0] rounded-full py-1 pr-3 pl-1 cursor-pointer transition-colors hover:bg-[#f1f5f9] hover:border-[#b0bec8]"
                >
                  <div className="w-[30px] h-[30px] rounded-full bg-[#091d33] text-white text-[11px] font-bold flex items-center justify-center overflow-hidden border-2 border-[#18a99c] flex-shrink-0">
                    {avatarInner}
                  </div>
                  <span className="text-[13px] font-semibold text-[#091d33] max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap max-[480px]:hidden">
                    {isAdmin ? 'Admin' : firstName}
                  </span>
                  <ChevronDown size={10} className="text-[#94a3b8]" />
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute top-[calc(100%+10px)] right-0 bg-white border-[0.5px] border-[#e2e8f0] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.10)] min-w-[220px] z-[9999] overflow-hidden ${ddOpen ? 'block' : 'hidden'
                    }`}
                >
                  <div className="py-[14px] px-4 pb-3 border-b-[0.5px] border-[#f0f4f8]">
                    <div className="text-[13px] font-bold text-[#091d33]">
                      {isAdmin ? 'Admin' : (user?.fullName || 'User')}
                    </div>
                    <div className="text-[11px] text-[#9aabb8] mt-[2px]">
                      {user?.email || ''}
                    </div>
                    {isRecruiterMode && (
                      <span className="inline-block mt-[6px] text-[10px] font-bold tracking-[1px] uppercase bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.25)] rounded-full px-[10px] py-[2px]">
                        Recruiter
                      </span>
                    )}
                  </div>

                  {!isRecruiterMode && (
                    <>
                      <Link
                        to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <LayoutDashboard size={15} className="text-[#18a99c] shrink-0" />
                        Dashboard
                      </Link>
                      <Link
                        to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <UserCircle size={15} className="text-[#185FA5] shrink-0" />
                        My Profile
                      </Link>
                      <Link
                        to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <FileText size={15} className="text-[#f59e0b] shrink-0" />
                        My Applications
                      </Link>
                      <div className="h-[0.5px] bg-[#f0f4f8] my-1" />
                      <Link
                        to="/recruiter"
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <ArrowLeftRight size={15} className="text-[#64748b] shrink-0" />
                        Switch to Recruiter
                      </Link>
                    </>
                  )}

                  {isRecruiterMode && (
                    <>
                      <Link
                        to={isAdmin ? '/admin/dashboard' : '/recruiter/dashboard'}
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <LayoutDashboard size={15} className="text-[#18a99c] shrink-0" />
                        Dashboard
                      </Link>
                      <Link
                        to="/recruiter/jobs"
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <Briefcase size={15} className="text-[#f59e0b] shrink-0" />
                        Manage Jobs
                      </Link>
                      <div className="h-[0.5px] bg-[#f0f4f8] my-1" />
                      <Link
                        to="/"
                        className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#374151] no-underline bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#f8fafc] hover:text-[#091d33]"
                      >
                        <ArrowLeftRight size={15} className="text-[#64748b] shrink-0" />
                        Switch to Job Seeker
                      </Link>
                    </>
                  )}

                  <div className="h-[0.5px] bg-[#f0f4f8] my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setDdOpen(false);
                    }}
                    className="flex items-center gap-[10px] w-full py-[10px] px-4 text-[13px] text-[#dc2626] bg-transparent border-none text-left cursor-pointer transition-colors hover:bg-[#fff5f5] hover:text-[#991b1b]"
                  >
                    <LogOut size={15} className="shrink-0" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={isRecruiterMode ? '/recruiter/login' : '/login'}
                  className="inline-flex items-center gap-[6px] h-9 px-[18px] bg-transparent text-[#091d33] rounded-[9px] text-[13px] font-semibold no-underline transition-colors border-[1.5px] border-[#e2e8f0] hover:bg-[#f1f5f9]"
                >
                  <LogIn size={14} />
                  Login
                </Link>
                <Link
                  to={isRecruiterMode ? '/recruiter/register' : '/register'}
                  className="inline-flex items-center gap-[6px] h-9 px-[18px] bg-[#091d33] text-white rounded-[9px] text-[13px] font-semibold no-underline transition-colors border-none hover:bg-[#0d2a47] max-[900px]:hidden"
                >
                  <UserPlus size={14} />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            ref={burgerRef}
            onClick={() => setMobileOpen((v) => !v)}
            className="hidden max-[900px]:block bg-none border border-[#e2e8f0] rounded-lg text-lg text-[#091d33] cursor-pointer py-[5px] px-[9px] transition-colors hover:bg-[#f1f5f9]"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        ref={mobileRef}
        className={`fixed top-[62px] left-0 right-0 bg-white border-b border-[#e2e8f0] shadow-[0_6px_20px_rgba(0,0,0,0.08)] py-3 px-4 pb-5 z-[9998] flex-col gap-1 ${mobileOpen ? 'flex' : 'hidden'
          }`}
      >
        {navLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`relative flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] ${isActive(item.page)
              ? 'bg-[#e6f7f5] text-[#18a99c] font-semibold'
              : 'text-[#64748b]'
              }`}
          >
            <item.icon size={16} />
            {item.label}
            {item.badge && (
              <span className="absolute top-1.5 right-2 px-2 py-0.5 text-[8px] font-bold text-white bg-red-500 rounded-full uppercase shadow-[0_2px_4px_rgba(239,68,68,0.3)] leading-none">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div className="h-px bg-[#e2e8f0] my-2" />

        <Link
          to={switchTo}
          className="flex items-center gap-2 py-[10px] px-[14px] text-[13px] font-semibold text-[#64748b] no-underline rounded-lg transition-colors hover:bg-[#f1f5f9] hover:text-[#091d33]"
        >
          <ArrowLeftRight size={14} />
          {isRecruiterMode ? 'Switch to Job Seeker' : 'Switch to Recruiter'}
        </Link>

        {isAuthenticated && !(isRecruiterHomePage && user?.role !== 'RECRUITER') && (
          <>
            <div className="h-px bg-[#e2e8f0] my-2" />
            {!isRecruiterMode && (
              <>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
                >
                  <LayoutDashboard size={16} className="text-[#18a99c]" />
                  Dashboard
                </Link>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
                >
                  <UserCircle size={16} className="text-[#185FA5]" />
                  My Profile
                </Link>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
                >
                  <FileText size={16} className="text-[#f59e0b]" />
                  My Applications
                </Link>
              </>
            )}
            {isRecruiterMode && (
              <>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/recruiter/dashboard'}
                  className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
                >
                  <LayoutDashboard size={16} className="text-[#18a99c]" />
                  Dashboard
                </Link>
                <Link
                  to="/recruiter/jobs"
                  className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
                >
                  <Briefcase size={16} className="text-[#f59e0b]" />
                  Manage Jobs
                </Link>
              </>
            )}
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#fff5f5] text-[#dc2626] hover:text-[#991b1b] text-left"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        )}

        {(!isAuthenticated || (isRecruiterHomePage && user?.role !== 'RECRUITER')) && (
          <>
            <div className="h-px bg-[#e2e8f0] my-2" />
            <Link
              to={isRecruiterMode ? '/recruiter/login' : '/login'}
              className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] hover:text-[#091d33] text-[#64748b]"
            >
              <LogIn size={16} />
              Login
            </Link>
            <Link
              to={isRecruiterMode ? '/recruiter/register' : '/register'}
              className="flex items-center gap-[6px] w-full rounded-[9px] py-[10px] px-[14px] text-sm no-underline transition-colors border-none bg-transparent cursor-pointer hover:bg-[#f1f5f9] text-[#18a99c] font-semibold"
            >
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Header;
