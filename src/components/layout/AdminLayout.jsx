import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  Briefcase,
  Tags,
  FolderTree,
  Shield,
  MessageSquare,
  Mail,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const AdminLayout = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/applications', icon: ClipboardList, label: 'Applications' },
    { to: '/admin/candidates', icon: Users, label: 'Candidates' },
    { to: '/admin/companies', icon: Building2, label: 'Companies' },
    { to: '/admin/employers', icon: Shield, label: 'Employers' },
    { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/admin/job-categories', icon: Tags, label: 'Job Categories' },
    { to: '/admin/blog-categories', icon: FolderTree, label: 'Blog Categories' },
    { to: '/admin/sub-admins', icon: Shield, label: 'Sub-Admins' },
    { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
    { to: '/admin/enquiries', icon: Mail, label: 'Enquiries' },
    { to: '/admin/security-questions', icon: HelpCircle, label: 'Security Q' },
  ];

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#091d33] text-white flex flex-col fixed h-full overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="text-xl font-bold text-[#18a99c]">
            RojgarShine
          </Link>
          <p className="text-xs text-white/50 mt-1">
            {user?.role === 'ADMIN' ? 'Admin Portal' : 'Sub-Admin Portal'}
          </p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-6 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-3 px-2">
            {user?.fullName || user?.email || 'Admin'}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
