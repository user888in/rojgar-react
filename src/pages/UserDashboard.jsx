import { useAuth } from "../context/AuthContext";

const UserDashboard = () => {
  const { user } = useAuth();

  // TODO: Fetch user dashboard data
  // Example: fetch(`${API_BASE_URL}/users/dashboard`, { headers: getAuthHeaders() })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#091d33]">Dashboard</h1>
      <p className="text-[#64748b] mt-2">Welcome, {user?.fullName || user?.email || "Job Seeker"}!</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display dashboard data here.</p>
    </div>
  );
};

export default UserDashboard;
