const AdminApplications = () => {
  // TODO: Fetch all applications
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/applications`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Applications</h1>
      <p className="text-[#64748b] mt-2">Manage all job applications here.</p>
    </div>
  );
};

export default AdminApplications;
