const AdminCompanies = () => {
  // TODO: Fetch all companies
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/companies`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Companies</h1>
      <p className="text-[#64748b] mt-2">Manage all companies here.</p>
    </div>
  );
};

export default AdminCompanies;
