import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import recruiterLogo from '../../assets/images/Rojgarshine White Logo-01.png';

const RecruiterSidebar = ({ displayName, initials, onProfileOpen, onCompanyOpen, onLogout }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) => `rs-item ${isActive ? 'active' : ''}`;

  return (
    <>
      <div className="rs-mobile-topbar" id="rsMobileTopbar">
        <button
          className="rs-mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          type="button"
        >
          <i className="bi bi-list" />
        </button>
        <Link to="/recruiter/dashboard" className="rs-mobile-brand">
          <img src={recruiterLogo} alt="RojgarShine" />
        </Link>
        <div style={{ width: 24 }} />
      </div>

      <div
        className={`rs-mobile-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`rs-sidebar ${mobileOpen ? 'open' : ''}`} id="recruiterSidebar">
        <div className="rs-brand">
          <Link to="/recruiter/dashboard">
            <img src={recruiterLogo} alt="RojgarShine" />
          </Link>
          <div className="rs-role-badge">
            <i className="bi bi-person-badge" /> Recruiter
          </div>
        </div>

        <nav className="rs-nav">
          <div className="rs-section-label">Main</div>
          <NavLink to="/recruiter/dashboard" end className={linkClass}>
            <i className="bi bi-speedometer2" /> Dashboard
          </NavLink>
          <NavLink to="/recruiter/post-job" end className={linkClass}>
            <i className="bi bi-plus-circle" /> Post Job
          </NavLink>
          <NavLink to="/recruiter/jobs" end className={linkClass}>
            <i className="bi bi-briefcase" /> Manage Jobs
          </NavLink>

          <div className="rs-section-label">Candidates</div>
          <NavLink to="/recruiter/applications" end className={linkClass}>
            <i className="bi bi-file-earmark-text" /> Applications
          </NavLink>

          <div className="rs-divider" />

          <div className="rs-section-label">Account</div>
          <NavLink to="/feedback" end className={linkClass}>
            <i className="bi bi-star-fill" /> Feedback
          </NavLink>
          <button
            className="rs-item"
            onClick={() => {
              setMobileOpen(false);
              onProfileOpen();
            }}
            type="button"
          >
            <i className="bi bi-person-circle" /> My Profile
          </button>
          <button
            className="rs-item"
            onClick={() => {
              setMobileOpen(false);
              onCompanyOpen();
            }}
            type="button"
          >
            <i className="bi bi-building" /> My Company
          </button>
          <button
            className="rs-item"
            onClick={() => {
              setMobileOpen(false);
              onLogout();
            }}
            type="button"
            style={{ color: '#f87171' }}
          >
            <i className="bi bi-box-arrow-right" style={{ color: '#f87171' }} /> Logout
          </button>
        </nav>

        <div className="rs-footer">
          <div className="rs-user-info">
            <div className="rs-avatar">{initials}</div>
            <div>
              <div className="rs-user-name">{displayName}</div>
              <div className="rs-user-role">Recruiter Account</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default RecruiterSidebar;
