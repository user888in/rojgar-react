const AdminSubAdmins = () => {
  // TODO: Fetch and manage sub-admins
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/sub-admins`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Sub-Admins</h1>
      <p className="text-[#64748b] mt-2">Manage sub-admins here.</p>
    </div>
  );
};

export default AdminSubAdmins;
