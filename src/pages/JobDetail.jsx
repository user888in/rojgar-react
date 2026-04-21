import { useParams } from "react-router-dom";

const JobDetail = () => {
  const { id } = useParams();

  // TODO: Fetch job details using id
  // import { useAuth } from "../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/jobs/${id}`, { headers: getAuthHeaders() })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#091d33]">Job Detail</h1>
      <p className="text-[#64748b] mt-2">Job ID: {id}</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display job details here.</p>
    </div>
  );
};

export default JobDetail;
