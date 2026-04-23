import { useMemo, useState } from 'react';
import './RecruiterManageJobsTable.css';

const statusClasses = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-rose-50 text-rose-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-700',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const RecruiterManageJobsTable = ({
  jobs = [],
  loading = false,
  error = '',
  activeStatusFilter = '',
  onSearch,
  onPageChange,
  currentPage = 0,
  totalPages = 0,
  totalElements = 0,
  onJobAction
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const effectiveFilter = statusFilter || activeStatusFilter;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch = searchValue
        ? [job.title, job.location].some((value) => (value || '').toLowerCase().includes(searchValue))
        : true;
      const matchesStatus = effectiveFilter ? job.status === effectiveFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, effectiveFilter]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    // Reset to first page when filter changes
    if (onPageChange) {
      onPageChange(0);
    }
  };

  const handleJobAction = (action, jobId) => {
    if (onJobAction) {
      onJobAction(action, jobId);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      OPEN: 'Open',
      CLOSED: 'Closed',
      ACTIVE: 'Open',
      PUBLISHED: 'Open',
    };
    return statusMap[status] || status;
  };

  const isJobOpen = (status) => {
    return ['OPEN', 'ACTIVE', 'PUBLISHED'].includes(status?.toUpperCase());
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const cp = currentPage; // 0-based
    const pages = [];

    // Build visible page numbers
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= cp - 2 && i <= cp + 2)) {
        pages.push(i);
      }
    }

    const pageButtons = [];
    let prev = null;

    for (const p of pages) {
      if (prev !== null && p - prev > 1) {
        pageButtons.push(
          <li key={`ellipsis-${p}`} className="page-item disabled">
            <span className="page-link">…</span>
          </li>
        );
      }
      pageButtons.push(
        <li key={p} className={`page-item ${p === cp ? 'active' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange && onPageChange(p)}
          >
            {p + 1}
          </button>
        </li>
      );
      prev = p;
    }

    return (
      <nav>
        <ul className="pagination pagination-mobile">
          <li className={`page-item ${cp === 0 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange && onPageChange(cp - 1)}
              disabled={cp === 0}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '11px' }}></i>
            </button>
          </li>
          {pageButtons}
          <li className={`page-item ${cp === totalPages - 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange && onPageChange(cp + 1)}
              disabled={cp >= totalPages - 1}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="recruiter-manage-jobs-container rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <i className="bi bi-briefcase"></i>
          </span>
          All Job Postings
        </div>
        <div className="filter-controls flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="search-input flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
            <i className="bi bi-search text-slate-400" />
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search title, location…"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:w-56"
            />
          </div>
          <select
            value={statusFilter || activeStatusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-teal-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open / Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="table-responsive overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm text-slate-700">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.28em] text-slate-500">
            <tr>
              <th className="px-4 py-2.75">#</th>
              <th className="px-4 py-2.75">Title</th>
              <th className="px-4 py-2.75">Location</th>
              <th className="px-4 py-2.75">Status</th>
              <th className="px-4 py-2.75">Posted</th>
              <th className="px-4 py-2.75">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-11 text-center text-sm text-slate-400">
                  <div className="spinner-border spinner-border-sm text-primary me-2" style={{width: '1rem', height: '1rem'}}></div>
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-4 py-11 text-center text-sm text-rose-600">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-11 text-center text-sm text-slate-400">
                  <i className="bi bi-inbox me-2"></i>
                  No jobs found.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job, index) => (
                <tr key={job.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-2.75 font-semibold text-slate-900">
                    {currentPage * 10 + index + 1}
                  </td>
                  <td className="px-4 py-2.75">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white">
                        {(job.title || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{job.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.75 text-slate-600">
                    <i className="bi bi-geo-alt me-1 text-slate-400"></i>
                    {job.location}
                  </td>
                  <td className="px-4 py-2.75">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      isJobOpen(job.status)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isJobOpen(job.status) ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      ></span>
                      {getStatusDisplay(job.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.75 text-slate-600 text-sm">
                    {formatDate(job.posted)}
                  </td>
                  <td className="px-4 py-2.75">
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.25 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 hover:border-amber-400 min-w-[55px]">
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      {isJobOpen(job.status) ? (
                        <button
                          onClick={() => handleJobAction('close', job.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.25 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:border-rose-400 min-w-[55px]"
                        >
                          <i className="bi bi-pause-circle"></i> Close
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJobAction('reopen', job.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.25 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-400 min-w-[55px]"
                        >
                          <i className="bi bi-play-circle"></i> Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="results-info text-sm text-slate-500">
          {totalElements === 0
            ? 'No results found'
            : `Showing ${currentPage * 10 + 1}–${Math.min((currentPage + 1) * 10, totalElements)} of ${totalElements} jobs`
          }
        </div>
        <div className="pagination-container">
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};

export default RecruiterManageJobsTable;
