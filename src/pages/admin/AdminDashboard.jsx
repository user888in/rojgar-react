import React, { useState, useEffect, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Chart from "chart.js/auto";
import { API_BASE_URL } from "../../config/api";
import {
  Gauge,
  Building2,
  Users,
  FileText,
  Briefcase,
  Mail,
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Building,
  PieChart,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
  Inbox,
  MailOpen,
  MailX,
  Shield,
  Lock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// Helper components for repeated structures
const StatCard = ({
  title,
  value,
  subText,
  icon: Icon,
  colorClass,
  to,
  linkText,
  iconColors,
}) => {
  const gradientMap = {
    blue: "from-blue-500 to-blue-300",
    green: "from-green-500 to-green-300",
    sky: "from-sky-500 to-sky-300",
    amber: "from-amber-500 to-amber-300",
    violet: "from-violet-500 to-violet-300",
    rose: "from-rose-500 to-rose-300",
  };

  return (
    <Link
      to={to}
      className="block h-full group no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2 rounded-[14px]"
    >
      <div className="bg-white  rounded-[14px] p-[20px_22px] border border-[#e8ecf1] h-full relative overflow-hidden transition-all duration-[220ms] group-hover:-translate-y-[3px] group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)]">
        {/* Animated bottom border */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradientMap[colorClass]} scale-x-0 origin-left transition-transform duration-[350ms] group-hover:scale-x-100`}
        />

        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] text-[#64748b] mb-1">{title}</div>
            <div className="text-[28px] font-extrabold text-[#0f172a] leading-none">
              {value}
            </div>
            <div className="text-[13px] text-[#64748b] mt-1.5">{subText}</div>
          </div>
          <div
            className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center text-[22px] ${iconColors}`}
          >
            <Icon size={22} />
          </div>
        </div>
        <div
          className={`mt-3 text-[12px] font-semibold flex items-center gap-[5px] opacity-75 transition-all duration-200 group-hover:opacity-100 group-hover:gap-[8px]`}
          style={{
            color: iconColors.split("text-")[1]?.split(" ")[0] || "inherit",
          }}
        >
          <ArrowRightCircle
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-[3px]"
          />{" "}
          {linkText}
        </div>
      </div>
    </Link>
  );
};

const DerivedStatCard = ({
  title,
  value,
  subText,
  valueColor,
  icon: Icon,
  iconBgColor,
  iconTextColor,
  progressColor,
  progressPct,
}) => (
  <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden transition-all duration-[220ms] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] group">
    <div
      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-${progressColor.split("-")[1]}-500 to-${progressColor.split("-")[1]}-300 scale-x-0 origin-left transition-transform duration-[350ms] group-hover:scale-x-100`}
    />
    <div className="flex justify-between items-start">
      <div>
        <div className="text-[13px] text-[#64748b] mb-1">{title}</div>
        <div
          className={`text-[28px] font-extrabold leading-none ${valueColor}`}
        >
          {value}
        </div>
        <div className="text-[13px] text-[#64748b] mt-1.5">{subText}</div>
      </div>
      <div
        className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center text-[22px] ${iconBgColor} ${iconTextColor}`}
      >
        <Icon size={22} />
      </div>
    </div>
    <div className="h-[5px] rounded-full bg-[#f1f5f9] mt-3 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-600 ease-in-out ${progressColor}`}
        style={{ width: `${progressPct}%` }}
      />
    </div>
  </div>
);

const getStatusPill = (status) => {
  const map = {
    APPLIED: "applied",
    SHORTLISTED: "shortlisted",
    HIRED: "hired",
    REJECTED: "rejected",
  };
  const cls = map[status] || "applied";
  const lbl = status ? status.charAt(0) + status.slice(1).toLowerCase() : "N/A";

  const styles = {
    applied: "bg-[#eff6ff] text-[#1d4ed8]",
    shortlisted: "bg-[#fffbeb] text-[#d97706]",
    hired: "bg-[#f0fdf4] text-[#16a34a]",
    rejected: "bg-[#fef2f2] text-[#dc2626]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${styles[cls]}`}
    >
      {lbl}
    </span>
  );
};

const AdminDashboard = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  const isSubAdmin = user?.role === "SUB_ADMIN";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({});
  const [recentApps, setRecentApps] = useState([]);
  const [recentEnq, setRecentEnq] = useState([]);

  // Chart refs
  const appStatusRef = useRef(null);
  const candidateStatusRef = useRef(null);
  const overviewRef = useRef(null);
  const chartInstances = useRef({});

  // Helpers
  const num = (v) => Number(v) || 0;
  const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 100));
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashRes = await authFetch(`${API_BASE_URL}/admin/dashboard`);
        if (!dashRes.ok) throw new Error("Dashboard fetch failed");
        const d = await dashRes.json();
        setStats(d);

        const appsRes = await authFetch(
          `${API_BASE_URL}/admin/applications?page=0&size=6&direction=desc`,
        );
        if (appsRes.ok) setRecentApps((await appsRes.json()).content || []);

        const enqRes = await authFetch(
          `${API_BASE_URL}/admin/queries?page=0&size=5&direction=desc`,
        );
        if (enqRes.ok) setRecentEnq((await enqRes.json()).content || []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authFetch]);

  useEffect(() => {
    if (loading || error) return;

    // Destroy existing charts to prevent canvas reuse errors
    Object.values(chartInstances.current).forEach((c) => c.destroy());

    const totalApp = num(stats.totalApplications);
    const hired = num(stats.hiredApplications);
    const rejected = num(stats.rejectedApplications);
    const applied = num(stats.appliedApplications);
    const shortlisted = num(stats.shortlistedApplications);

    // App Status Doughnut
    if (appStatusRef.current) {
      chartInstances.current.appStatus = new Chart(appStatusRef.current, {
        type: "doughnut",
        data: {
          labels: ["Applied", "Shortlisted", "Hired", "Rejected"],
          datasets: [
            {
              data: [applied, shortlisted, hired, rejected],
              backgroundColor: ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 12, font: { size: 11 }, padding: 14 },
            },
          },
        },
      });
    }

    // Candidate Status Bar
    if (candidateStatusRef.current) {
      chartInstances.current.candidateStatus = new Chart(
        candidateStatusRef.current,
        {
          type: "bar",
          data: {
            labels: ["Active", "Suspended"],
            datasets: [
              {
                data: [
                  num(stats.activeCandidates),
                  num(stats.suspendedCandidates || 0),
                ],
                backgroundColor: ["#3b82f6", "#B2C5DB"],
                borderRadius: 6,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        },
      );
    }

    // Overview Bar
    if (overviewRef.current) {
      chartInstances.current.overview = new Chart(overviewRef.current, {
        type: "bar",
        data: {
          labels: ["Jobs", "Employers", "Candidates", "Apps", "Enquiries"],
          datasets: [
            {
              data: [
                num(stats.totalJobs),
                num(stats.totalRecruiters),
                num(stats.totalUsers),
                num(stats.totalApplications),
                num(stats.totalEnquiries),
              ],
              backgroundColor: [
                "#8b5cf6",
                "#22c55e",
                "#0ea5e9",
                "#f59e0b",
                "#f43f5e",
              ],
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((c) => c.destroy());
    };
  }, [loading, error, stats]);

  // Derived values for render
  const totalApps = num(stats.totalApplications);
  const hiredApps = num(stats.hiredApplications);
  const rejectedApps = num(stats.rejectedApplications);
  const pendingApps =
    num(stats.appliedApplications) + num(stats.shortlistedApplications);

  const totalRec = num(stats.totalRecruiters);
  const activeEmp = num(stats.activeRecruiters);
  const pendingEmp = num(stats.pendingRecruiters);
  const suspendedEmp = num(stats.suspendedRecruiters);

  return (
    <div className="relative font-['DM_Sans',sans-serif] text-[#0f172a] max-w-[1600px] mx-auto">
      {/* Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9488]"></div>
        </div>
      )}

      {/* Topbar */}
      <div className="sticky top-0 z-[100] bg-white px-8 py-4 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-b border-[#e8ecf1]" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px' }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Dashboard</p>
            <p className="text-[13px] text-[#64748b] m-0 mt-0.5">
              {todayDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSubAdmin && (
              <div className="inline-flex items-center gap-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[12px] font-semibold px-3.5 py-1.5 rounded-full">
                <AlertTriangle size={14} /> Sub Admin Mode
              </div>
            )}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-white border border-[#e8ecf1] rounded-full pl-3 pr-2.5 py-1.5 text-[13px] font-semibold text-[#0f172a] cursor-pointer transition-all duration-200 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:border-[#0d9488]/30"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white text-[12px] font-bold flex items-center justify-center">
                {(user?.fullName || user?.username || "A").charAt(0).toUpperCase()}
              </div>
              <span>{user?.fullName || user?.username || "Admin"}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] px-4 py-3 rounded-[14px] mb-6 flex items-center gap-2">
          <XCircle size={18} />
          <span>Failed to load dashboard data. Please refresh.</span>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] p-[28px_32px] mb-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />

        <h4 className="font-extrabold text-[1.4rem] m-0 mb-1 relative flex items-center gap-2">
          <Gauge size={26} /> Overview
        </h4>
        <p className="text-white/55 text-[14px] pb-4 relative">
          Welcome back! Here's what's happening across your platform today.
        </p>
      </div>

      {/* Row 1: Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Companies"
          value={stats.totalCompanies || "0"}
          subText={`${stats.verifiedCompanies || 0} Verified`}
          icon={Building2}
          colorClass="blue"
          to="/admin/companies"
          linkText="View All"
          iconColors="bg-[#eff6ff] text-[#3b82f6]"
        />
        <StatCard
          title="Employers"
          value={stats.totalRecruiters || "0"}
          subText={`${stats.activeRecruiters || 0} active · ${stats.pendingRecruiters || 0} pending`}
          icon={Building2}
          colorClass="green"
          to="/admin/employers"
          linkText="Manage"
          iconColors="bg-[#f0fdf4] text-[#22c55e]"
        />
        <StatCard
          title="Candidates"
          value={stats.totalUsers || "0"}
          subText={`${stats.activeCandidates || 0} active`}
          icon={Users}
          colorClass="sky"
          to="/admin/candidates"
          linkText="View All"
          iconColors="bg-[#f0f9ff] text-[#0ea5e9]"
        />
        <StatCard
          title="Applications"
          value={stats.totalApplications || "0"}
          subText={`${stats.appliedApplications || 0} pending review`}
          icon={FileText}
          colorClass="amber"
          to="/admin/applications"
          linkText="View All"
          iconColors="bg-[#fffbeb] text-[#f59e0b]"
        />
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs || "0"}
          subText={`${stats.activeJobs || 0} active`}
          icon={Briefcase}
          colorClass="violet"
          to="/admin/jobs"
          linkText="View All"
          iconColors="bg-[#f5f3ff] text-[#8b5cf6]"
        />
        <StatCard
          title="Enquiries"
          value={stats.totalEnquiries || "0"}
          subText={
            stats.totalEnquiries > 0
              ? `${Math.min(stats.totalEnquiries, 5)} recent`
              : "No enquiries yet"
          }
          icon={Mail}
          colorClass="rose"
          to="/admin/enquiries"
          linkText="View All"
          iconColors="bg-[#fff1f2] text-[#f43f5e]"
        />
      </div>

      {/* Row 2: Derived Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DerivedStatCard
          title="Approval Rate"
          value={`${pct(hiredApps, totalApps)}%`}
          subText="of all applications"
          valueColor="text-[#16a34a]"
          icon={CheckCircle2}
          iconBgColor="bg-[#f0fdf4]"
          iconTextColor="text-[#22c55e]"
          progressColor="bg-[#22c55e]"
          progressPct={pct(hiredApps, totalApps)}
        />
        <DerivedStatCard
          title="Rejection Rate"
          value={`${pct(rejectedApps, totalApps)}%`}
          subText="of all applications"
          valueColor="text-[#dc2626]"
          icon={XCircle}
          iconBgColor="bg-[#fef2f2]"
          iconTextColor="text-[#ef4444]"
          progressColor="bg-[#ef4444]"
          progressPct={pct(rejectedApps, totalApps)}
        />
        <DerivedStatCard
          title="Pending Applications"
          value={pendingApps || "0"}
          subText="awaiting review"
          valueColor="text-[#d97706]"
          icon={Hourglass}
          iconBgColor="bg-[#fffbeb]"
          iconTextColor="text-[#f59e0b]"
          progressColor="bg-[#f59e0b]"
          progressPct={pct(pendingApps, totalApps)}
        />
        <DerivedStatCard
          title="Active Employers"
          value={activeEmp || "0"}
          subText={`${suspendedEmp} suspended · ${pendingEmp} pending`}
          valueColor="text-[#3b82f6]"
          icon={Building}
          iconBgColor="bg-[#eff6ff]"
          iconTextColor="text-[#3b82f6]"
          progressColor="bg-[#3b82f6]"
          progressPct={pct(activeEmp, totalRec)}
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <div className="text-[14px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
            <PieChart size={17} className="text-[#0d9488]" /> Application Status
          </div>
          <canvas ref={appStatusRef} height="170" />
        </div>
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <div className="text-[14px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
            <BarChart3 size={17} className="text-[#0d9488]" /> Candidate Status
          </div>
          <canvas ref={candidateStatusRef} height="170" />
        </div>
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <div className="text-[14px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-[#0d9488]" /> Platform
            Overview
          </div>
          <canvas ref={overviewRef} height="170" />
        </div>
      </div>

      {/* Row 4: Employer Breakdown + Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] shadow-[0_4px_20px_rgba(11,34,57,0.08)] flex flex-col">
          <div className="text-[14px] font-bold text-[#0f172a] mb-5 flex items-center gap-2">
            <Building2 size={17} className="text-[#0d9488]" /> Employer
            Breakdown
          </div>

          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-[#64748b]">Active</span>
            <span className="text-[13px] font-bold text-[#16a34a]">
              {activeEmp}
            </span>
          </div>
          <div className="h-[6px] rounded-full bg-[#f1f5f9] mb-3.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16a34a] transition-all duration-600"
              style={{ width: `${pct(activeEmp, totalRec)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-[#64748b]">Pending</span>
            <span className="text-[13px] font-bold text-[#f59e0b]">
              {pendingEmp}
            </span>
          </div>
          <div className="h-[6px] rounded-full bg-[#f1f5f9] mb-3.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#f59e0b] transition-all duration-600"
              style={{ width: `${pct(pendingEmp, totalRec)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-[#64748b]">Suspended</span>
            <span className="text-[13px] font-bold text-[#dc2626]">
              {suspendedEmp}
            </span>
          </div>
          <div className="h-[6px] rounded-full bg-[#f1f5f9] mb-3.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#dc2626] transition-all duration-600"
              style={{ width: `${pct(suspendedEmp, totalRec)}%` }}
            ></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden flex flex-col h-full">
          <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-2">
            <span className="text-[14px] font-bold text-[#0f172a] flex items-center gap-[7px]">
              <Clock size={17} className="text-[#0d9488]" /> Recent Applications
            </span>
            <Link
              to="/admin/applications"
              className="inline-flex items-center gap-[5px] p-[5px_14px] rounded-full text-[12px] font-semibold text-[#0d9488] border-[1.5px] border-[#0d9488]/30 bg-[#0d9488]/5 no-underline transition-all duration-200 hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488]"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    #
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Candidate
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Job Title
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Company
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Status
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="text-[14px] align-middle">
                {!loading && recentApps.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-10 text-[#94a3b8]">
                      <Inbox size={36} className="mx-auto mb-2 opacity-60" />
                      No applications found
                    </td>
                  </tr>
                ) : (
                  recentApps.map((app, i) => (
                    <tr
                      key={i}
                      className="hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-0 transition-colors"
                    >
                      <td className="p-[12px_16px] text-[#64748b]">{i + 1}</td>
                      <td className="p-[12px_16px]">
                        <strong>{app.candidateName || "N/A"}</strong>
                        <div className="text-[13px] text-[#94a3b8]">
                          {app.candidateEmail || ""}
                        </div>
                      </td>
                      <td className="p-[12px_16px]">{app.jobTitle || "N/A"}</td>
                      <td className="p-[12px_16px] text-[#64748b]">
                        {app.companyName || "N/A"}
                      </td>
                      <td className="p-[12px_16px]">
                        {getStatusPill(app.applicationStatus)}
                      </td>
                      <td className="p-[12px_16px] text-[#94a3b8] text-[13px]">
                        {formatDate(app.appliedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Enquiries */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] shadow-[0_4px_20px_rgba(11,34,57,0.08)] overflow-hidden flex flex-col">
          <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-2">
            <span className="text-[14px] font-bold text-[#0f172a] flex items-center gap-[7px]">
              <MailOpen size={17} className="text-[#0d9488]" /> Recent Contact
              Enquiries
            </span>
            <Link
              to="/admin/enquiries"
              className="inline-flex items-center gap-[5px] p-[5px_14px] rounded-full text-[12px] font-semibold text-[#0d9488] border-[1.5px] border-[#0d9488]/30 bg-[#0d9488]/5 no-underline transition-all duration-200 hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488]"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    #
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Name
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Email
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Message
                  </th>
                  <th className="p-[11px_16px] text-[#64748b] text-[12px] font-bold uppercase tracking-[.8px]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="text-[14px] align-middle">
                {!loading && recentEnq.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-10 text-[#94a3b8]">
                      <MailX size={36} className="mx-auto mb-2 opacity-60" />
                      No enquiries yet
                    </td>
                  </tr>
                ) : (
                  recentEnq.map((enq, i) => (
                    <tr
                      key={i}
                      className="hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-0 transition-colors"
                    >
                      <td className="p-[12px_16px] text-[#64748b]">{i + 1}</td>
                      <td className="p-[12px_16px]">
                        <strong>
                          {(enq.firstName || "") + " " + (enq.lastName || "")}
                        </strong>
                      </td>
                      <td className="p-[12px_16px] text-[#64748b]">
                        {enq.email || "N/A"}
                      </td>
                      <td className="p-[12px_16px] text-[#64748b] max-w-[320px]">
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
                          {enq.message || "—"}
                        </span>
                      </td>
                      <td className="p-[12px_16px] text-[#94a3b8] text-[13px]">
                        {formatDate(enq.createdAt || enq.submittedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 6: Sub Admin Management (Admin only) */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] shadow-[0_4px_20px_rgba(11,34,57,0.08)] relative overflow-hidden">
          <div className="text-[14px] font-bold text-[#0f172a] mb-[16px] flex items-center gap-[8px]">
            <Shield size={17} className="text-[#0d9488]" /> Sub Admin Management
            <span className="inline-flex items-center gap-[4px] bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-bold px-[10px] py-[2px] rounded-full tracking-[.8px] uppercase ml-[8px]">
              <Lock size={9} /> Admin Only
            </span>
          </div>

          {isSubAdmin ? (
            <div className="absolute inset-0 bg-[#f8fafc]/90 z-10 flex flex-col items-center justify-center text-center backdrop-blur-[2px]">
              <Lock className="text-[#94a3b8] mb-2" size={32} />
              <p className="text-[13px] text-[#64748b] m-0">
                This section is restricted to <strong>Admins only</strong>.
              </p>
              <small className="text-[#94a3b8] text-[12px] mt-1">
                Contact your administrator for access.
              </small>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="bg-[#f8fafc] w-xs rounded-[10px] p-[14px_18px] border border-[#e8ecf1] flex items-center gap-[14px]">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="text-[12px] text-[#64748b] mb-[3px]">
                    Total Sub Admins
                  </div>
                  <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">
                    {stats.totalSubAdmins || "0"}
                  </div>
                </div>
              </div>
              <Link
                to="/admin/sub-admins"
                className="inline-flex items-center gap-[7px] bg-[#0b2239] text-white px-[20px] py-[9px] rounded-full text-[13.5px] font-semibold no-underline transition-all duration-200 hover:bg-[#1a3a5c]"
              >
                <Users size={16} /> Manage Sub Admins
              </Link>
              <span className="text-[13.5px] text-[#64748b]">
                Create, activate or deactivate sub admin accounts.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
