import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import RecruiterManageJobsHero from '../../components/recruiter/manage-jobs/RecruiterManageJobsHero';
import RecruiterManageJobsStats from '../../components/recruiter/manage-jobs/RecruiterManageJobsStats';
import RecruiterManageJobsTable from '../../components/recruiter/manage-jobs/RecruiterManageJobsTable';
import EditJobModal from '../../components/recruiter/manage-jobs/EditJobModal';

const RecruiterManageJobs = () => {
  const { getAuthHeaders } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormState, setEditFormState] = useState({ id: '', title: '', location: '', categoryId: '', salary: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Categories for edit modal
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const toastTimeoutRef = useRef(null);

  // Load job counts
  const loadJobCounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/my/jobs/count`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load job counts');
      }

      const data = await response.json();
      setStats({
        total: data.totalJobs || 0,
        active: data.activeJobs || 0,
        closed: data.closeJobs || 0,
      });
    } catch (error) {
      console.error('Error loading job counts:', error);
    }
  };

  const showToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, message });
    toastTimeoutRef.current = setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000);
  };

  const loadCategoriesForEdit = async (selectedId) => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/job-categories`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      const mapped = (data || []).map((c) => ({
        id: c.categoryId ?? c.id ?? c._id ?? c.value,
        name: c.categoryName ?? c.name ?? c.label ?? c.category ?? String(c),
      }));
      setCategories(mapped);
    } catch (err) {
      console.error('Error loading categories', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onEditFormChange = (field, value) => {
    setEditFormState((p) => ({ ...p, [field]: value }));
  };

  const saveEditedJob = async () => {
    setEditError('');
    const { id, title, location, categoryId, salary, description } = editFormState;
    if (!title || !title.trim()) {
      setEditError('Job title is required.');
      return;
    }

    setEditSaving(true);
    try {
      const payload = {
        title: title.trim(),
        location: location || '',
        description: description || '',
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(salary && { salary: Number(salary) }),
      };

      const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || 'Update failed');
      }

      setEditModalOpen(false);
      showToast('success', 'Job updated successfully ✓');
      await Promise.all([loadJobCounts(), loadJobs(currentPage, filterStatus, searchQuery)]);
    } catch (err) {
      console.error('Update job error', err);
      setEditError(err.message || 'Failed to update job');
    } finally {
      setEditSaving(false);
    }
  };

  // Load jobs with pagination and filters
  const loadJobs = async (page = 0, status = '', search = '') => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10', // perPage from HTML reference
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/jobs/my?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load jobs (${response.status})`);
      }

      const data = await response.json();

      // Handle both array and paginated response formats
      let jobsData = [];
      let totalElements = 0;
      let totalPages = 0;

      if (Array.isArray(data)) {
        jobsData = data;
        totalElements = data.length;
        totalPages = 1;
      } else {
        jobsData = data.content || [];
        totalElements = data.totalElements || 0;
        totalPages = data.totalPages || 0;
      }

      // Transform jobs data to match component expectations
      const transformedJobs = jobsData.map(job => ({
        id: job.jobId || job.id,
        title: job.title || job.jobTitle || 'N/A',
        location: job.location || job.city || 'N/A',
        status: (job.status || job.jobStatus || '').toUpperCase(),
        posted: job.postedAt || job.createdAt || job.publishedAt,
        description: job.description || job.jobDescription || '',
        categoryId: job.categoryId || job.category?.id || job.jobCategoryId,
        salary: job.salary || job.annualSalary || job.salaryMax || job.salaryMin,
      }));

      setJobs(transformedJobs);
      setTotalElements(totalElements);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(0);
    loadJobs(0, status, searchQuery);
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(0);
    // Debounce search like in HTML reference
    setTimeout(() => {
      loadJobs(0, filterStatus, query);
    }, 400);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      loadJobs(page, filterStatus, searchQuery);
    }
  };

  // Handle job actions (edit, close, reopen)
  const handleJobAction = async (action, jobId) => {
    // Open edit modal locally
    if (action === 'edit') {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      setEditFormState({
        id: job.id,
        title: job.title || '',
        location: job.location || '',
        categoryId: job.categoryId ?? '',
        salary: job.salary ?? '',
        description: job.description || '',
      });
      await loadCategoriesForEdit(job.categoryId);
      setEditError('');
      setEditModalOpen(true);
      return;
    }

    try {
      let url, method = 'PUT';

      switch (action) {
        case 'close':
          url = `${API_BASE_URL}/jobs/${jobId}/close`;
          break;
        case 'reopen':
          url = `${API_BASE_URL}/jobs/${jobId}/reopen`;
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} job`);
      }

      // Reload data after action
      await Promise.all([loadJobCounts(), loadJobs(currentPage, filterStatus, searchQuery)]);
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      setError(`Failed to ${action} job: ${error.message}`);
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadJobCounts(), loadJobs()]);
    };
    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-6 pb-10 pt-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1">
            <RecruiterManageJobsHero />
          </div>
          <Link
            to="/recruiter/post-job"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <i className="bi bi-plus-circle-fill" /> Post New Job
          </Link>
        </div>

        <RecruiterManageJobsStats stats={stats} onFilter={handleFilterChange} />
        <RecruiterManageJobsTable
          jobs={jobs}
          loading={loading}
          error={error}
          activeStatusFilter={filterStatus}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          onJobAction={handleJobAction}
        />
        {toast.show && (
          <div className={`fixed bottom-6 right-6 z-50 rounded-lg p-3.5 ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        <EditJobModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          formState={editFormState}
          onFormChange={onEditFormChange}
          onSave={saveEditedJob}
          saving={editSaving}
          error={editError}
          categories={categories}
          loadingCategories={loadingCategories}
        />
      </div>
    </div>
  );
};

export default RecruiterManageJobs;
