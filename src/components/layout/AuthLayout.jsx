import { Outlet } from 'react-router-dom';
import Header from './Header';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
