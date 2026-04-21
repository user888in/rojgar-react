const AdminEnquiries = () => {
  // TODO: Fetch all enquiries
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/enquiries`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Enquiries</h1>
      <p className="text-[#64748b] mt-2">Manage contact enquiries here.</p>
    </div>
  );
};

export default AdminEnquiries;
