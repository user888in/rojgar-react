const AdminFeedback = () => {
  // TODO: Fetch all feedback
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/feedback`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Feedback</h1>
      <p className="text-[#64748b] mt-2">Manage user feedback here.</p>
    </div>
  );
};

export default AdminFeedback;
