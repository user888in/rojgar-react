const AdminCandidates = () => {
  // TODO: Fetch all candidates
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/candidates`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Candidates</h1>
      <p className="text-[#64748b] mt-2">Manage all candidates here.</p>
    </div>
  );
};

export default AdminCandidates;
