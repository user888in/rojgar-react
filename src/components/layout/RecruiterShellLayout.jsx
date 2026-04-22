import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RecruiterSidebar from '../recruiter/RecruiterSidebar';
import RecruiterTopbar from '../recruiter/RecruiterTopbar';
import RecruiterProfileModal from '../recruiter/RecruiterProfileModal';
import RecruiterCompanyModal from '../recruiter/RecruiterCompanyModal';
import '../../styles/recruiter-dashboard.css';

const pageTitles = {
  '/recruiter/dashboard': 'Dashboard',
  '/recruiter/post-job': 'Post Job',
  '/recruiter/jobs': 'Manage Jobs',
  '/recruiter/applications': 'Applications',
  '/recruiter/feedback': 'Feedback',
};

const getInitials = (name) => {
  if (!name) return 'R';
  const parts = name.trim().split(' ').filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  return letters.toUpperCase();
};

const RecruiterShellLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const displayName = user?.fullName || user?.username || user?.email || 'Recruiter';
  const initials = getInitials(displayName);
  const title = pageTitles[location.pathname] || 'Dashboard';

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="recruiter-shell">
      <RecruiterSidebar
        displayName={displayName}
        initials={initials}
        onProfileOpen={() => setProfileOpen(true)}
        onCompanyOpen={() => setCompanyOpen(true)}
        onLogout={logout}
      />

      <div className="main-content">
        <RecruiterTopbar
          title={title}
          dateLabel={dateLabel}
          displayName={displayName}
          initials={initials}
          onProfileOpen={() => setProfileOpen(true)}
        />
        <Outlet />
      </div>

      <RecruiterProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <RecruiterCompanyModal open={companyOpen} onClose={() => setCompanyOpen(false)} />
    </div>
  );
};

export default RecruiterShellLayout;
