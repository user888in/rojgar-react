import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageSpinner from '../ui/PageSpinner';

const GuestRoute = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner />;
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    const isRecruiterAuth = location.pathname === '/recruiter/login' || location.pathname === '/recruiter/register';
    
    // Admins can see recruiter auth pages without being redirected
    if ((hasRole('ADMIN') || hasRole('SUB_ADMIN')) && isRecruiterAuth) {
      return <Outlet />;
    }

    if (hasRole('ADMIN') || hasRole('SUB_ADMIN')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (hasRole('RECRUITER')) {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
