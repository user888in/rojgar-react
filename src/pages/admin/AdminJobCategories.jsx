const AdminJobCategories = () => {
  // TODO: Fetch and manage job categories
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/job-categories`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Job Categories</h1>
      <p className="text-[#64748b] mt-2">Manage job categories here.</p>
    </div>
  );
};

export default AdminJobCategories;
