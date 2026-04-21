const Companies = () => {
  // TODO: Fetch companies list
  // import { useAuth } from "../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/companies/public`, { headers: getAuthHeaders() })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#091d33]">Companies</h1>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display companies here.</p>
    </div>
  );
};

export default Companies;
