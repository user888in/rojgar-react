const AdminEmployers = () => {
  // TODO: Fetch all employers
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/employers`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Employers</h1>
      <p className="text-[#64748b] mt-2">Manage all employers here.</p>
    </div>
  );
};

export default AdminEmployers;
