import { useParams } from "react-router-dom";

const CompanyJobs = () => {
  const { id } = useParams();

  // TODO: Fetch jobs for company using id
  // import { useAuth } from "../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/companies/${id}/jobs`, { headers: getAuthHeaders() })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#091d33]">Company Jobs</h1>
      <p className="text-[#64748b] mt-2">Company ID: {id}</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display company jobs here.</p>
    </div>
  );
};

export default CompanyJobs;
