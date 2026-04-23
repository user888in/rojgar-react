import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageSpinner from '../ui/PageSpinner';

const GuestRoute = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <PageSpinner />;
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
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
