import { Outlet } from 'react-router-dom';
import Header from './Header';


const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col pt-[62px]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
