import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import OverlaySpinner from '../../components/ui/OverlaySpinner';
import StatCard from '../../components/recruiter/dashboard/StatCard';
import DashboardChart from '../../components/recruiter/dashboard/DashboardChart';
import TableCard from '../../components/recruiter/dashboard/TableCard';
import StatusPill from '../../components/recruiter/dashboard/StatusPill';

const revealProps = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 100));
const pctStr = (n, d) => `${pct(n, d)}%`;
const formatDate = (dateValue) => {
  return dateValue
    ? new Date(dateValue).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';
};

const readJobStatus = (job) => (job?.status || job?.jobStatus || job?.jobPostStatus || job?.statusType || '').toUpperCase();
const readAppStatus = (app) => (app?.applicationStatus || app?.status || app?.appStatus || '').toUpperCase();
const readJobTitle = (job) => job?.title || job?.jobTitle || job?.name || 'N/A';
const readCategory = (job) => job?.categoryName || job?.category?.name || job?.jobCategory || 'N/A';
const readLocation = (job) => job?.location || job?.city || job?.place || 'N/A';
const readPostedAt = (job) => job?.postedAt || job?.createdAt || job?.publishedAt || job?.jobPostedAt || null;
const readCandidateName = (app) => app?.candidateName || app?.applicantName || app?.userName || app?.name || 'N/A';
const readCandidateEmail = (app) => app?.candidateEmail || app?.email || app?.applicantEmail || '';
const readAppliedAt = (app) => app?.appliedAt || app?.createdAt || app?.applicationDate || null;
const readJobTitleApp = (app) => app?.jobTitle || app?.title || app?.job?.title || 'N/A';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { token, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const headers = getAuthHeaders();
        const statsRes = await fetch(`${API_BASE_URL}/auth/recruiter/dashboard/stats`, {
          method: 'GET',
          headers,
        });
        
        if (!statsRes.ok) {
          const errorText = await statsRes.text();
          let errorMsg = `HTTP ${statsRes.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.message || errorJson.error || errorMsg;
          } catch (e) {
            errorMsg = errorText || errorMsg;
          }
          throw new Error(errorMsg);
        }

        const statsJson = await statsRes.json();
        setStats(statsJson || {});
        console.log('✅ Stats loaded');

        // Load jobs
        const jobsRes = await fetch(`${API_BASE_URL}/jobs/my?page=0&size=5`, {
          method: 'GET',
          headers,
        });
        
        if (!jobsRes.ok) {
          console.error('❌ Jobs API failed:', jobsRes.status, await jobsRes.text());
          throw new Error(`Jobs: HTTP ${jobsRes.status}`);
        }
        
        const jobsJson = await jobsRes.json();
        setRecentJobs(jobsJson?.content || []);
        console.log('✅ Jobs loaded');

        // Load applications
        const appsRes = await fetch(`${API_BASE_URL}/applications/recruiter?page=0&size=5`, {
          method: 'GET',
          headers,
        });
        
        if (!appsRes.ok) {
          console.error('❌ Applications API failed:', appsRes.status, await appsRes.text());
          throw new Error(`Applications: HTTP ${appsRes.status}`);
        }
        
        const appsJson = await appsRes.json();
        setRecentApps(appsJson?.content || []);
        console.log('✅ Applications loaded');
        
        console.log('✅ All dashboard data loaded');
      } catch (err) {
        console.error('❌ Dashboard Error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token, getAuthHeaders]);

  const totals = useMemo(() => {
    return {
      total: stats.totalJobs || 0,
      active: stats.activeJobs || 0,
      closed: stats.closedJobs || 0,
      totalApps: stats.totalApplications || 0,
      hired: stats.totalHired || 0,
      rejected: stats.totalRejected || 0,
      shortlisted: stats.totalShortlisted || 0,
      pending: stats.totalPending || 0,
    };
  }, [stats]);

  const appStatusChart = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: ['Applied', 'Shortlisted', 'Hired', 'Rejected'],
        datasets: [
          {
            data: [totals.pending, totals.shortlisted, totals.hired, totals.rejected],
            backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 }, padding: 14 },
          },
        },
      },
    }),
    [totals]
  );

  const jobStatusChart = useMemo(
    () => ({
      type: 'bar',
      data: {
        labels: ['Active', 'Closed'],
        datasets: [
          {
            data: [totals.active, totals.closed],
            backgroundColor: ['#22c55e', '#ef4444'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    }),
    [totals]
  );

  const overviewChart = useMemo(
    () => ({
      type: 'bar',
      data: {
        labels: ['Jobs', 'Applications', 'Hired', 'Pending'],
        datasets: [
          {
            data: [totals.total, totals.totalApps, totals.hired, totals.pending],
            backgroundColor: ['#0d9488', '#3b82f6', '#22c55e', '#f59e0b'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    }),
    [totals]
  );

  return (
    <div id="dashboardSection" className="content">
      <OverlaySpinner show={loading} />

      <motion.div {...revealProps} className="page-hero">
        <h4>
          <i className="bi bi-speedometer2" style={{ marginRight: 8 }} />Overview
        </h4>
        <p>Welcome back! Here is a snapshot of your recruitment activity.</p>
      </motion.div>

      <div className={`error-alert ${error ? 'show' : ''}`}>
        <i className="bi bi-exclamation-triangle" />
        <span>{error || 'Failed to load dashboard data.'}</span>
      </div>

      <motion.div {...revealProps} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <StatCard
          tone="teal"
          iconClass="bi-briefcase-fill"
          iconStyle={{ background: 'rgba(13,148,136,0.1)', color: 'var(--teal)' }}
          label="Total Jobs Posted"
          value={totals.total}
          subLabel={`${totals.active} active · ${totals.closed} closed`}
          onClick={() => navigate('/recruiter/jobs')}
        />
        <StatCard
          tone="green"
          iconClass="bi-check-circle-fill"
          iconStyle={{ background: '#f0fdf4', color: '#22c55e' }}
          label="Active Jobs"
          value={totals.active}
          subLabel={totals.total ? `${pctStr(totals.active, totals.total)} of total` : '—'}
          progress={{ width: pctStr(totals.active, totals.total), background: '#22c55e' }}
          onClick={() => navigate('/recruiter/jobs?status=OPEN')}
        />
        <StatCard
          tone="red"
          iconClass="bi-x-circle-fill"
          iconStyle={{ background: '#fef2f2', color: '#ef4444' }}
          label="Closed Jobs"
          value={totals.closed}
          subLabel="No longer accepting"
          progress={{ width: pctStr(totals.closed, totals.total), background: '#ef4444' }}
          onClick={() => navigate('/recruiter/jobs?status=CLOSED')}
        />
        <StatCard
          tone="amber"
          iconClass="bi-file-earmark-text-fill"
          iconStyle={{ background: '#fffbeb', color: '#f59e0b' }}
          label="Total Applications"
          value={totals.totalApps}
          subLabel={`${totals.hired} hired · ${totals.pending} pending`}
          onClick={() => navigate('/recruiter/applications')}
        />
      </motion.div>

      <motion.div {...revealProps} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <StatCard
          tone="green"
          iconClass="bi-person-check-fill"
          iconStyle={{ background: '#f0fdf4', color: '#22c55e' }}
          label="Hired"
          value={totals.hired}
          valueClassName="text-[#22c55e]"
          subLabel="Successful placements"
          progress={{ width: pctStr(totals.hired, totals.totalApps), background: '#22c55e' }}
          onClick={() => navigate('/recruiter/applications?status=HIRED')}
        />
        <StatCard
          tone="red"
          iconClass="bi-person-x-fill"
          iconStyle={{ background: '#fef2f2', color: '#ef4444' }}
          label="Rejected"
          value={totals.rejected}
          valueClassName="text-[#ef4444]"
          subLabel="Not shortlisted"
          progress={{ width: pctStr(totals.rejected, totals.totalApps), background: '#ef4444' }}
          onClick={() => navigate('/recruiter/applications?status=REJECTED')}
        />
        <StatCard
          tone="amber"
          iconClass="bi-star-fill"
          iconStyle={{ background: '#fffbeb', color: '#f59e0b' }}
          label="Shortlisted"
          value={totals.shortlisted}
          valueClassName="text-[#f59e0b]"
          subLabel="Under consideration"
          progress={{ width: pctStr(totals.shortlisted, totals.totalApps), background: '#f59e0b' }}
          onClick={() => navigate('/recruiter/applications?status=SHORTLISTED')}
        />
        <StatCard
          tone="blue"
          iconClass="bi-hourglass-split"
          iconStyle={{ background: '#eff6ff', color: '#3b82f6' }}
          label="Pending Review"
          value={totals.pending}
          valueClassName="text-[#3b82f6]"
          subLabel="Awaiting decision"
          progress={{ width: pctStr(totals.pending, totals.totalApps), background: '#3b82f6' }}
          onClick={() => navigate('/recruiter/applications?status=APPLIED')}
        />
      </motion.div>

      <motion.div {...revealProps} className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
        <div className="chart-card">
          <div className="chart-card-title">
            <i className="bi bi-pie-chart-fill" /> Application Status
          </div>
          <DashboardChart {...appStatusChart} />
        </div>
        <div className="chart-card">
          <div className="chart-card-title">
            <i className="bi bi-bar-chart-fill" /> Job Status Breakdown
          </div>
          <DashboardChart {...jobStatusChart} />
        </div>
        <div className="chart-card">
          <div className="chart-card-title">
            <i className="bi bi-graph-up" /> Recruitment Overview
          </div>
          <DashboardChart {...overviewChart} />
        </div>
      </motion.div>

      <motion.div {...revealProps} className="mb-4">
        <TableCard
          title="Recent Job Postings"
          iconClass="bi-briefcase"
          actionTo="/recruiter/jobs"
          actionLabel="View All"
        >
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Job Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-[#e2e8f0] border-t-[#0d9488] animate-spin" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : recentJobs.length ? (
                recentJobs.map((job, index) => (
                  <tr key={job.id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{readJobTitle(job)}</strong></td>
                    <td>{readCategory(job)}</td>
                    <td>{readLocation(job)}</td>
                    <td><StatusPill type="job" status={readJobStatus(job)} /></td>
                    <td>{formatDate(readPostedAt(job))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      </motion.div>

      <motion.div {...revealProps}>
        <TableCard
          title="Recent Applications"
          iconClass="bi-clock-history"
          actionTo="/recruiter/applications"
          actionLabel="View All"
        >
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-[#e2e8f0] border-t-[#0d9488] animate-spin" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : recentApps.length ? (
                recentApps.map((app, index) => (
                  <tr key={app.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{readCandidateName(app)}</strong>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{readCandidateEmail(app)}</div>
                    </td>
                    <td>{readJobTitleApp(app)}</td>
                    <td><StatusPill type="app" status={readAppStatus(app)} /></td>
                    <td>{formatDate(readAppliedAt(app))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      </motion.div>
    </div>
  );
};

export default RecruiterDashboard;
