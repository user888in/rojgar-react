import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // TODO: Fetch and display user profile
  // Example: fetch(`${API_BASE_URL}/profile/me`, { headers: getAuthHeaders() })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#091d33]">My Profile</h1>
      <p className="text-[#64748b] mt-2">Welcome, {user?.fullName || user?.email || 'User'}!</p>
      <p className="text-sm text-[#64748b] mt-4">Fetch and display profile details here.</p>
    </div>
  );
};

export default Profile;
