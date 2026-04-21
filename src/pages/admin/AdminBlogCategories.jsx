const AdminBlogCategories = () => {
  // TODO: Fetch and manage blog categories
  // import { useAuth } from "../../context/AuthContext";
  // const { getAuthHeaders } = useAuth();
  // fetch(`${API_BASE_URL}/admin/blog-categories`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">Blog Categories</h1>
      <p className="text-[#64748b] mt-2">Manage blog categories here.</p>
    </div>
  );
};

export default AdminBlogCategories;
