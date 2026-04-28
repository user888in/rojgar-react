import { Outlet } from 'react-router-dom';
import Header from './Header';
import PublicFooter from './PublicFooter';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const PublicLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN';
  const isUserDashboard = location.pathname === '/dashboard';
  const showHeader = isAdmin || !isUserDashboard;

  return (
    <div className={`min-h-screen flex flex-col ${showHeader ? 'pt-[62px]' : ''}`}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
