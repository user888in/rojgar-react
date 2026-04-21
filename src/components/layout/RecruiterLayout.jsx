import { Outlet } from 'react-router-dom';
import Header from './Header';

const RecruiterLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterLayout;
