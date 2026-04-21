const AdminSecurityQ = () => {
  // TODO: Fetch and manage security questions
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/security-questions`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Security Questions</h1>
      <p className="text-[#64748b] mt-2">Manage security questions here.</p>
    </div>
  );
};

export default AdminSecurityQ;
