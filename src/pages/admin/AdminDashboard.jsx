import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();

  // TODO: Fetch admin dashboard stats
  // Example: fetch(`${API_BASE_URL}/admin/dashboard`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Admin Dashboard</h1>
      <p className="text-[#64748b] mt-2">Welcome, {user?.fullName || user?.email || "Admin"}!</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display admin stats here.</p>
    </div>
  );
};

export default AdminDashboard;
