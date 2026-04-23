import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import RecruiterPostJobHero from '../../components/recruiter/post-job/RecruiterPostJobHero';
import RecruiterPostJobForm from '../../components/recruiter/post-job/RecruiterPostJobForm';
import RecruiterPostJobSidebar from '../../components/recruiter/post-job/RecruiterPostJobSidebar';

const RecruiterPostJob = () => {
  const { token, getAuthHeaders, isAuthenticated, logout } = useAuth();
  const [formState, setFormState] = useState({
    title: '',
    category: '',
    categoryId: '',
    locationPin: '',
    location: '',
    salary: '',
    description: '',
  });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(`${API_BASE_URL}/job-categories`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to load categories');
        }

        const data = await response.json();
        const items = Array.isArray(data)
          ? data.map((item) => {
              if (typeof item === 'string') {
                return { id: item, name: item };
              }
              return {
                id: item.id || item._id || item.categoryId || item.value || item.name,
                name: item.categoryName || item.name || item.label || item.category || '',
              };
            })
          : [];

        setCategories(items.filter((item) => item.name));
      } catch (error) {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [isAuthenticated, token, getAuthHeaders]);

  const handleFormChange = (key, value) => {
  setFormState((prev) => ({
    ...prev,
    [key]: value,
    ...(key === 'category' ? { categoryId: '' } : {}),
  }));
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    console.log('Token exists:', !!token);
    console.log('Token value:', token);

    if (!token) {
      setSubmitError('Your session has expired. Please login again.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formState.title,
        category: formState.category,
        categoryId: formState.categoryId || undefined,
        location: formState.location,
        pincode: formState.locationPin,
        salary: Number(formState.salary),
        description: formState.description,
      };

      console.log('API URL:', `${API_BASE_URL}/jobs`);
      console.log('Payload:', payload);
      console.log('Headers:', getAuthHeaders());

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const body = await response.json().catch(() => ({}));
      console.log('Response body:', body);

      if (!response.ok) {
        // Handle 401 Unauthorized by logging out
        if (response.status === 401) {
          console.log('Token expired or invalid, logging out...');
          logout();
          throw new Error('Your session has expired. Please login again.');
        }

        const message = body?.message || body?.error || `Failed to submit job (${response.status})`;
        throw new Error(message);
      }

      setSubmitSuccess('Job posted successfully.');
      setFormState({
        title: '',
        category: '',
        categoryId: '',
        locationPin: '',
        location: '',
        salary: '',
        description: '',
      });
    } catch (error) {
      setSubmitError(error.message || 'Job submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 pb-10 pt-6">
      <div className="space-y-6">
        <RecruiterPostJobHero />

        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
          <RecruiterPostJobForm
            formState={formState}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            categories={categories}
            loadingCategories={loadingCategories}
            submitting={submitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
          />
          <RecruiterPostJobSidebar formState={formState} />
        </div>
      </div>
    </div>
  );
};

export default RecruiterPostJob;
