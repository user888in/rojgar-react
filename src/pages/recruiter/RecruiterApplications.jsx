import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import OverlaySpinner from '../../components/ui/OverlaySpinner';

const STATUS_OPTIONS = ['APPLIED', 'SHORTLISTED', 'HIRED', 'REJECTED'];

const statusLabel = (status) => {
  const raw = (status || '').toUpperCase();
  return raw ? `${raw.charAt(0)}${raw.slice(1).toLowerCase()}` : 'Applied';
};

const formatDate = (dateValue) =>
  dateValue
    ? new Date(dateValue).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

const initialOf = (name) => (name?.trim()?.charAt(0) || '?').toUpperCase();

const mapApp = (app) => ({
  ...app,
  id: app.applicationId || app.id,
  applicationStatus: (app.applicationStatus || app.status || 'APPLIED').toUpperCase(),
  candidateName: app.candidateName || app.fullName || app.applicantName || 'N/A',
  email: app.candidateEmail || app.email || app.applicantEmail || '',
  jobTitle: app.jobTitle || app.title || app?.job?.title || 'N/A',
  resumeUrl: app.resumeUrl || '',
  candidateId: app.candidateId || app.userId || app.applicantId || null,
});

const statusPillClass = (status) => {
  const value = (status || '').toUpperCase();
  if (value === 'SHORTLISTED') return 'bg-blue-100 text-blue-600';
  if (value === 'HIRED') return 'bg-green-100 text-green-600';
  if (value === 'REJECTED') return 'bg-red-100 text-red-600';
  return 'bg-amber-100 text-amber-700';
};

const RecruiterApplications = () => {
  const { getAuthHeaders } = useAuth();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [applications, setApplications] = useState([]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [jobTitles, setJobTitles] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [jobTitleFilter, setJobTitleFilter] = useState('');

  const [stats, setStats] = useState({
    totalApplication: 0,
    applied: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  });

  const [toasts, setToasts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const tableCardRef = useRef(null);

  const pushToast = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const loadApplicationStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/applications/my/application/count`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats({
        totalApplication: data.totalApplication || 0,
        applied: data.applied || 0,
        shortlisted: data.shortlisted || 0,
        hired: data.hired || 0,
        rejected: data.rejected || 0,
      });
    } catch (err) {
      console.warn('Could not load application stats:', err);
    }
  };

  const loadJobTitles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/my/titles`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const titles = await res.json();
      setJobTitles(Array.isArray(titles) ? titles : []);
    } catch (err) {
      console.warn('Could not load job titles:', err);
    }
  };

  const loadApplications = async (page = 0) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(perPage),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (jobTitleFilter) params.append('jobTitle', jobTitleFilter);

      const res = await fetch(`${API_BASE_URL}/applications/recruiter?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error ${res.status}`);
      }

      const data = await res.json();
      const mapped = (data.content || []).map(mapApp);
      setApplications(mapped);
      setStatusDrafts(
        mapped.reduce((acc, item) => {
          acc[item.id] = item.applicationStatus;
          return acc;
        }, {})
      );
      setCurrentPage(data.number || 0);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('loadApplications error:', err);
      setError(err?.message || 'Failed to load applications');
      setApplications([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobTitles();
    loadApplicationStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(0);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadApplications(0);
    loadApplicationStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, jobTitleFilter, perPage]);

  const pageInfo = useMemo(() => {
    if (!applications.length) return 'No results found';
    const from = currentPage * perPage + 1;
    const to = from + applications.length - 1;
    return `Showing ${from}-${to} • Page ${currentPage + 1} of ${Math.max(totalPages, 1)}`;
  }, [applications.length, currentPage, perPage, totalPages]);

  const openUpdateModal = (appId, newStatus, candidateName, jobTitle) => {
    setPendingUpdate({
      id: appId,
      newStatus,
      candidateName,
      jobTitle,
    });
    setUpdateNote('');
    setModalOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingUpdate?.id || !pendingUpdate?.newStatus) return;

    setUpdating(true);
    try {
      const payload = { status: pendingUpdate.newStatus };
      const note = updateNote.trim();
      if (note) payload.note = note;

      const res = await fetch(`${API_BASE_URL}/applications/${pendingUpdate.id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `Error ${res.status}`);
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === pendingUpdate.id
            ? {
                ...item,
                applicationStatus: pendingUpdate.newStatus,
              }
            : item
        )
      );
      setStatusDrafts((prev) => ({ ...prev, [pendingUpdate.id]: pendingUpdate.newStatus }));

      const labels = {
        SHORTLISTED: 'Shortlisted!',
        HIRED: 'Hired!',
        REJECTED: 'Rejected.',
      };
      pushToast(`${labels[pendingUpdate.newStatus] || 'Status updated'}${note ? ' Note sent to candidate.' : ''}`);
      setModalOpen(false);
      await loadApplicationStats();
    } catch (err) {
      pushToast(err?.message || 'Failed to update status', 'danger');
    } finally {
      setUpdating(false);
    }
  };

  const openResume = async (candidateId, download = false) => {
    if (!candidateId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/profile/download/resume/${candidateId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) {
          pushToast('Resume not found.', 'warning');
          return;
        }
        if (res.status === 403) {
          pushToast(download ? 'No permission to download.' : 'No permission to view.', 'danger');
          return;
        }
        pushToast(download ? 'Failed to download resume.' : 'Failed to open resume.', 'danger');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${candidateId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      pushToast(download ? 'Network error downloading resume.' : 'Network error opening resume.', 'danger');
    }
  };

  const handleKpiFilter = (status) => {
    setStatusFilter(status);
    setSearchInput('');
    setSearchQuery('');
    setJobTitleFilter('');
    tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="content">
      <OverlaySpinner show={loading} />

      <div className="page-hero">
        <h4>
          <i className="bi bi-file-earmark-text" style={{ marginRight: 8 }} />
          Applications
        </h4>
        <p>{greeting} — Review, filter and manage all candidate applications for your job postings</p>
      </div>

      <div className={`error-alert ${error ? 'show' : ''}`}>
        <i className="bi bi-exclamation-triangle" />
        <span>{error || 'Failed to load applications.'}</span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button type="button" onClick={() => handleKpiFilter('')} className="stat-card teal text-left">
          <div className="stat-top">
            <div>
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.totalApplication}</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--teal)' }}>
              <i className="bi bi-people-fill" />
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-semibold text-teal-600">
            <i className="bi bi-funnel mr-1 text-[10px]" />
            Show all
          </div>
        </button>

        <button type="button" onClick={() => handleKpiFilter('APPLIED')} className="stat-card amber text-left">
          <div className="stat-top">
            <div>
              <div className="stat-label">Applied</div>
              <div className="stat-value">{stats.applied}</div>
            </div>
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="bi bi-send-fill" />
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-semibold text-amber-600">
            <i className="bi bi-funnel mr-1 text-[10px]" />
            Filter applied
          </div>
        </button>

        <button type="button" onClick={() => handleKpiFilter('SHORTLISTED')} className="stat-card blue text-left">
          <div className="stat-top">
            <div>
              <div className="stat-label">Shortlisted</div>
              <div className="stat-value">{stats.shortlisted}</div>
            </div>
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <i className="bi bi-star-fill" />
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-semibold text-blue-600">
            <i className="bi bi-funnel mr-1 text-[10px]" />
            Filter shortlisted
          </div>
        </button>

        <button type="button" onClick={() => handleKpiFilter('HIRED')} className="stat-card green text-left">
          <div className="stat-top">
            <div>
              <div className="stat-label">Hired</div>
              <div className="stat-value">{stats.hired}</div>
            </div>
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <i className="bi bi-check-circle-fill" />
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-semibold text-green-600">
            <i className="bi bi-funnel mr-1 text-[10px]" />
            Filter hired
          </div>
        </button>

        <button type="button" onClick={() => handleKpiFilter('REJECTED')} className="stat-card red text-left">
          <div className="stat-top">
            <div>
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{stats.rejected}</div>
            </div>
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <i className="bi bi-x-circle-fill" />
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-semibold text-red-600">
            <i className="bi bi-funnel mr-1 text-[10px]" />
            Filter rejected
          </div>
        </button>
      </div>

      <div ref={tableCardRef} className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">
            <i className="bi bi-file-earmark-text" />
            All Applications
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border-[1.5px] border-[#e8ecf1] bg-slate-50 px-3.5 py-1.5 focus-within:border-teal-600">
              <i className="bi bi-search text-[13px] text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, email, job..."
                className="w-[180px] border-none bg-transparent text-[13px] text-slate-900 outline-none"
              />
            </div>

            <select
              value={jobTitleFilter}
              onChange={(event) => setJobTitleFilter(event.target.value)}
              className="rounded-full border-[1.5px] border-[#e8ecf1] bg-slate-50 px-3.5 py-1.5 text-[13px] text-slate-500 outline-none focus:border-teal-600"
            >
              <option value="">All Jobs</option>
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-full border-[1.5px] border-[#e8ecf1] bg-slate-50 px-3.5 py-1.5 text-[13px] text-slate-500 outline-none focus:border-teal-600"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Job Title</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-400">
                    <i className="bi bi-inbox block text-4xl" />
                    <span className="mt-2 inline-block">No applications found</span>
                  </td>
                </tr>
              ) : (
                applications.map((app, index) => {
                  const displayIndex = currentPage * perPage + index + 1;
                  const rowDraftStatus = statusDrafts[app.id] || app.applicationStatus;
                  return (
                    <tr key={app.id || displayIndex}>
                      <td>{displayIndex}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-400 text-xs font-bold text-white">
                            {initialOf(app.candidateName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{app.candidateName}</div>
                            {app.email ? <div className="text-[11.5px] text-slate-500">{app.email}</div> : null}
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-500">{app.jobTitle}</td>
                      <td className="text-[12.5px] text-slate-400">{formatDate(app.appliedAt || app.createdAt)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${statusPillClass(
                            app.applicationStatus
                          )}`}
                        >
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel(app.applicationStatus)}
                        </span>
                      </td>
                      <td>
                        {app.candidateId ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => openResume(app.candidateId, false)}
                              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600 transition hover:bg-teal-600 hover:text-white"
                            >
                              <i className="bi bi-eye" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openResume(app.candidateId, true)}
                              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600 transition hover:bg-teal-600 hover:text-white"
                            >
                              <i className="bi bi-download" />
                              Download
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <select
                            value={rowDraftStatus}
                            onChange={(event) => {
                              setStatusDrafts((prev) => ({ ...prev, [app.id]: event.target.value }));
                            }}
                            className="rounded-lg border-[1.5px] border-[#e8ecf1] bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 outline-none focus:border-teal-600"
                          >
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="APPLIED">Applied</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => openUpdateModal(app.id, rowDraftStatus, app.candidateName, app.jobTitle)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-teal-700"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5">
          <div className="text-[13px] text-slate-500">
            {pageInfo}
            {totalElements ? ` • ${totalElements} total` : ''}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(event) => setPerPage(Number(event.target.value))}
              className="rounded-full border-[1.5px] border-[#e8ecf1] bg-slate-50 px-3.5 py-1.5 text-[13px] text-slate-500 outline-none focus:border-teal-600"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => loadApplications(currentPage - 1)}
              className="rounded-md border border-[#e8ecf1] px-3 py-1.5 text-[13px] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="bi bi-chevron-left mr-1 text-[11px]" />
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
              onClick={() => loadApplications(currentPage + 1)}
              className="rounded-md border border-[#e8ecf1] px-3 py-1.5 text-[13px] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <i className="bi bi-chevron-right ml-1 text-[11px]" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && pendingUpdate && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(9,29,51,0.55)] p-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget && !updating) setModalOpen(false);
          }}
          role="presentation"
        >
          <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(11,34,57,0.18)]">
            <div className="flex items-center justify-between bg-gradient-to-br from-[#091d33] to-[#1a3a5c] px-6 py-5">
              <div>
                <div className="text-[15px] font-bold text-white">{pendingUpdate.candidateName || 'Candidate'}</div>
                <div className="mt-0.5 text-xs text-white/50">{pendingUpdate.jobTitle || 'Application'}</div>
              </div>
              <button
                type="button"
                disabled={updating}
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed"
              >
                <i className="bi bi-x text-base" />
              </button>
            </div>

            <div className="px-6 pb-2 pt-5">
              <div className="mb-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-slate-400">New Status</div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${statusPillClass(
                    pendingUpdate.newStatus
                  )}`}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel(pendingUpdate.newStatus)}
                </span>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-slate-400">
                  Note to Candidate
                  <span className="normal-case font-normal text-slate-400"> (optional)</span>
                </div>
                <textarea
                  value={updateNote}
                  onChange={(event) => setUpdateNote(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="e.g. Your interview is scheduled for Friday at 2:00 PM via Google Meet."
                  className="min-h-[110px] w-full resize-y rounded-[10px] border-[1.5px] border-[#e8ecf1] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-900 outline-none transition focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11.5px] text-slate-400">
                    <i className="bi bi-info-circle mr-1" />
                    Candidate will see this note with their status update
                  </span>
                  <span className="text-[11.5px] text-slate-400">{updateNote.length}/500</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2 border-t border-[#e8ecf1] px-6 py-4">
              <button
                type="button"
                disabled={updating}
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-[13.5px] font-semibold text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={confirmStatusUpdate}
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updating ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" />
                    Confirm Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2">
        {toasts.map((toast) => {
          const tone =
            toast.type === 'danger'
              ? 'bg-red-700'
              : toast.type === 'warning'
                ? 'bg-amber-700'
                : 'bg-green-700';
          const icon =
            toast.type === 'danger'
              ? 'bi-x-circle-fill'
              : toast.type === 'warning'
                ? 'bi-exclamation-circle-fill'
                : 'bi-check-circle-fill';

          return (
            <div
              key={toast.id}
              className={`flex min-w-[240px] items-center gap-2.5 rounded-xl border-l-[3px] border-white/30 px-4 py-3 text-[13.5px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] ${tone}`}
            >
              <i className={`bi ${icon}`} />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecruiterApplications;
