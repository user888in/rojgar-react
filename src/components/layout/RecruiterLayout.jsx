import { Outlet } from 'react-router-dom';
import Header from './Header';
import RecruiterFooter from './RecruiterFooter';

const RecruiterLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] pt-[62px]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <RecruiterFooter />
    </div>
  );
};

export default RecruiterLayout;
