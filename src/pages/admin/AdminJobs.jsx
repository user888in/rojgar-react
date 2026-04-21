const AdminJobs = () => {
  // TODO: Fetch all jobs
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/jobs`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Jobs</h1>
      <p className="text-[#64748b] mt-2">Manage all jobs here.</p>
    </div>
  );
};

export default AdminJobs;
