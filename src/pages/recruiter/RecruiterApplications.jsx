const RecruiterApplications = () => {
  // TODO: Fetch applications for recruiter's jobs
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/recruiter/applications`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Applications</h1>
      <p className="text-[#64748b] mt-2">Review and manage candidate applications here.</p>
    </div>
  );
};

export default RecruiterApplications;
