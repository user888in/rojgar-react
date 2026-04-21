const RecruiterManageJobs = () => {
  // TODO: Fetch recruiter's posted jobs
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/recruiter/jobs`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">My Jobs</h1>
      <p className="text-[#64748b] mt-2">Manage your job postings here.</p>
    </div>
  );
};

export default RecruiterManageJobs;
