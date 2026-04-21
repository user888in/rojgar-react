import { useAuth } from "../../context/AuthContext";

const RecruiterDashboard = () => {
  const { user } = useAuth();

  // TODO: Fetch recruiter dashboard stats
  // Example: fetch(`${API_BASE_URL}/recruiter/dashboard`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Recruiter Dashboard</h1>
      <p className="text-[#64748b] mt-2">Welcome, {user?.fullName || user?.email || "Recruiter"}!</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display recruiter stats here.</p>
    </div>
  );
};

export default RecruiterDashboard;
