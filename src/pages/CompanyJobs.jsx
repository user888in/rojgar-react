import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Send,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const moneyFormatter = new Intl.NumberFormat("en-IN");

function stripHtml(html, maxLen = 120) {
  if (!html) return "No description available.";
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "No description available.";
  return maxLen && text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
}

function initials(name) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return (
    parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]
  ).toUpperCase();
}

function CompanyLogo({
  logoUrl,
  companyName,
  tone = "card",
  className = "",
  imgClassName = "",
  imgStyle,
}) {
  const [failed, setFailed] = useState(false);
  const isHero = tone === "hero";
  const sizeStyle = isHero
    ? {
        minWidth: "64px",
        maxWidth: "100px",
        width: "100px",
        height: "64px",
        borderRadius: "16px",
        backgroundColor: "rgba(24, 169, 156, 0.15)",
        border: "1.5px solid rgba(24, 169, 156, 0.3)",
        color: "#18a99c",
        fontSize: "1.3rem",
      }
    : {
        minWidth: "44px",
        maxWidth: "70px",
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        backgroundColor: "#f1f5f9",
        border: "1px solid #e2e8f0",
        color: "#091d33",
        fontSize: "14px",
      };
  const boxClass =
    "flex items-center justify-center overflow-hidden font-extrabold shrink-0 " +
    className;

  if (logoUrl && !failed) {
    return (
      <div className={boxClass} style={sizeStyle}>
        <img
          src={logoUrl}
          alt={companyName || "Company logo"}
          className={`h-full w-full object-cover ${imgClassName}`}
          style={imgStyle}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={boxClass} style={sizeStyle}>
      {initials(companyName)}
    </div>
  );
}

function CompanyJobCard({
  job,
  appliedJobs,
  onApply,
  onViewDetails,
  onShare,
  companyNameFallback,
}) {
  const jobId = job.jobId ?? job.id;
  const hasApplied = appliedJobs.has(String(jobId));
  const isClosed = job.status === "CLOSED";
  const canApply = !isClosed && !hasApplied;
  const companyName =
    job.companyName ?? job.company ?? companyNameFallback ?? "Company";
  const companyLogo = job.companyLogo;
  const location = job.location ?? "Remote";
  const salary = job.salary
    ? `₹ ${moneyFormatter.format(Number(job.salary))}`
    : "Not disclosed";
  const category = job.categoryName ?? job.category ?? "General";
  const description = stripHtml(job.description ?? job.jobDescription, 120);

  return (
    <div className="relative flex h-full flex-col rounded-[14px] border border-transparent bg-white p-[22px] shadow-1 transition-all duration-200 hover:-translate-y-1 hover:border-[#18a99c] hover:shadow-3">
      <button
        type="button"
        onClick={(e) => onShare?.(job, e)}
        className="absolute right-[10px] top-[10px] z-10 flex h-7 w-7 items-center justify-center rounded-[7px] border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] transition-all hover:scale-110 hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
        title="Share this job"
      >
        <Share2 size={15} />
      </button>

      <div className="mb-3 flex items-center gap-3 pr-[34px]">
        <CompanyLogo
          logoUrl={companyLogo}
          companyName={companyName}
          tone="card"
          imgStyle={{ objectFit: "contain", backgroundColor: "white" }}
        />
        <span
          className={`mb-0 inline-flex items-center gap-1.5 text-[0.67rem] font-bold uppercase tracking-[0.5px] ${
            isClosed ? "text-[#ef4444]" : "text-[#16a34a]"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {job.status ?? (isClosed ? "CLOSED" : "OPEN")}
        </span>
      </div>

      <h3 className="pr-[34px] text-[1rem] font-bold leading-[1.3] text-[#091d33]">
        {job.title}
      </h3>

      <div className="mb-3 flex flex-wrap gap-[7px]">
        <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#f1f5f9] px-[10px] py-1 text-[0.76rem] text-[#64748b]">
          <MapPin size={11} />
          {location}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#f1f5f9] px-[10px] py-1 text-[0.76rem] text-[#64748b]">
          <Briefcase size={11} />
          {category}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#e6f7f6] px-[10px] py-1 text-[0.76rem] text-[#0f766e]">
          {salary}
        </span>
        {job.experienceRequired || job.experience ? (
          <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#f1f5f9] px-[10px] py-1 text-[0.76rem] text-[#64748b]">
            <Clock size={11} />
            {job.experienceRequired ?? job.experience}
          </span>
        ) : null}
      </div>

      <p
        className="mb-4 flex-1 text-[0.82rem] leading-[1.65] text-[#64748b]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewDetails?.(jobId)}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-transparent bg-transparent px-[12px] py-[9px] text-[0.82rem] font-bold text-[#091d33] transition-colors hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
        >
          <Eye size={15} />
          View
        </button>
        <button
          type="button"
          onClick={() => onApply?.(job)}
          disabled={!canApply}
          className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] px-[12px] py-[9px] text-[0.82rem] font-bold transition-all ${
            !canApply
              ? isClosed
                ? "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8] shadow-none"
                : "cursor-default bg-[#ecfdf5] text-[#16a34a] shadow-[0_4px_12px_rgba(22,163,74,0.25)]"
              : "bg-[#18a99c] text-white shadow-[0_4px_12px_rgba(24,169,156,0.3)] hover:-translate-y-[1px] hover:bg-[#14968a] hover:shadow-[0_6px_16px_rgba(24,169,156,0.38)]"
          }`}
        >
          {isClosed ? (
            <>
              <XCircle size={15} />
              Closed
            </>
          ) : hasApplied ? (
            <>
              <CheckCircle size={15} />
              Applied
            </>
          ) : (
            <>
              <Send size={15} />
              Apply
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const CompanyJobs = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const routeName = searchParams.get("name")?.trim() || "";
  const companyQuery = routeName || id?.trim() || "";
  const invalidCompany = !companyQuery;
  const companyDisplayName = routeName || id || "Company";

  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState("");
  const [appliedJobs, setAppliedJobs] = useState(() => new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [applying, setApplying] = useState(false);

  const isJobSeeker = user?.role === "JOB_SEEKER";
  const visibleAppliedJobs = token && isJobSeeker ? appliedJobs : new Set();

  const companyTitle = companyDisplayName;
  const companyLogo = jobs[0]?.companyLogo || null;
  const jobsPerPage = 9;

  useEffect(() => {
    document.title = `${companyDisplayName} Jobs - RojgarShine`;
  }, [companyDisplayName]);

  useEffect(() => {
    if (invalidCompany) return;

    const controller = new AbortController();

    const loadJobs = async () => {
      setLoading(true);
      setError("");

      const candidates = Array.from(new Set([routeName, id].filter(Boolean)));
      let lastError = "";

      try {
        for (const companyKey of candidates) {
          const response = await fetch(
            `${API_BASE_URL}/jobs/company/${encodeURIComponent(companyKey)}?page=${currentPage}`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              signal: controller.signal,
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (controller.signal.aborted) return;

            if (Array.isArray(data)) {
              setJobs(data);
              setTotalJobs(data.length);
              setTotalPages(1);
            } else {
              const content = data.content || data.jobs || [];
              setJobs(content);
              setTotalJobs(
                data.totalElements ?? data.total ?? content.length ?? 0,
              );
              setTotalPages(
                data.totalPages ??
                  Math.ceil(
                    (data.totalElements ?? content.length ?? 0) / jobsPerPage,
                  ),
              );
              if (data.number !== undefined) setCurrentPage(data.number);
            }
            return;
          }

          lastError = `Server error: ${response.status}`;
        }

        throw new Error(lastError || "Unable to load company jobs");
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load company jobs");
          setJobs([]);
          setTotalJobs(0);
          setTotalPages(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadJobs();
    return () => controller.abort();
  }, [companyQuery, routeName, id, currentPage, token, invalidCompany]);

  useEffect(() => {
    if (!token || !isJobSeeker) return;

    const controller = new AbortController();

    const loadAppliedJobs = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/applications/my?page=0&size=500`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.content || [];
        const ids = new Set(
          list
            .map(
              (application) =>
                application.jobId ??
                application.job_id ??
                application.job?.jobId ??
                application.job?.id,
            )
            .filter((value) => value != null)
            .map((value) => String(value)),
        );

        if (!controller.signal.aborted) {
          setAppliedJobs(ids);
        }
      } catch {
        // non-blocking
      }
    };

    loadAppliedJobs();
    return () => controller.abort();
  }, [token, isJobSeeker]);

  const viewJobDetails = (jobId) => navigate(`/jobs/${jobId}`);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setShowApplyModal(true);
  };

  const confirmApply = async () => {
    if (!selectedJob) return;
    const jobId = selectedJob.jobId ?? selectedJob.id;

    setApplying(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/applications/apply/${jobId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      setShowApplyModal(false);

      if (response.ok) {
        setAppliedJobs((prev) => new Set(prev).add(String(jobId)));
        setJobs((prev) =>
          prev.map((j) =>
            (j.jobId ?? j.id) === jobId ? { ...j, hasApplied: true } : j,
          ),
        );
        window.alert("Applied successfully!");
      } else if (response.status === 409) {
        setAppliedJobs((prev) => new Set(prev).add(String(jobId)));
        window.alert("You've already applied for this job.");
      } else if (response.status === 401) {
        setShowLoginModal(true);
      } else {
        const data = await response.json().catch(() => ({}));
        window.alert(data.message || "Failed to apply. Please try again.");
      }
    } catch {
      window.alert("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const redirectToLogin = () => {
    setShowLoginModal(false);
    navigate(
      `/login?return=${encodeURIComponent(window.location.pathname + window.location.search)}`,
    );
  };

  const shareJob = async (job, e) => {
    e.stopPropagation();
    const jobId = job.jobId ?? job.id;
    const shareUrl = `${window.location.origin}/jobs/${jobId}`;
    const title = `${job.title} at ${job.companyName || companyDisplayName}`;

    if (navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(() => {});
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("Job link copied to clipboard!");
    } catch {
      window.alert("Failed to copy link");
    }
  };

  const paginate = (pageNum) => {
    const nextPage = pageNum - 1;
    if (nextPage < 0 || nextPage >= totalPages) return;
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const display = currentPage + 1;
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    } else if (display <= 3) {
      for (let i = 1; i <= 5; i += 1) pages.push(i);
    } else if (display >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i += 1) pages.push(i);
    } else {
      for (let i = display - 2; i <= display + 2; i += 1) pages.push(i);
    }
    return pages;
  };

  if (invalidCompany) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[18px] bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fee2e2] text-[#ef4444]">
              <AlertTriangle size={30} />
            </div>
            <h1 className="mb-2 text-xl font-bold text-[#091d33]">
              Company Not Found
            </h1>
            <p className="mb-6 text-sm text-[#64748b]">
              We could not determine which company jobs to show.
            </p>
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#091d33] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#0d2a4a]"
            >
              <ArrowLeft size={16} />
              Browse All Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <section className="relative overflow-hidden bg-[#091d33] py-12 pb-11">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.2)_0%,transparent_70%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <div className="h-4 w-36 rounded-full bg-white/10 animate-pulse" />
              <div className="h-10 w-1/2 rounded-2xl bg-white/10 animate-pulse" />
              <div className="h-8 w-32 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[18px] bg-white p-5 shadow-[0_2px_20px_rgba(9,29,51,0.07)]"
              >
                <div className="mb-4 h-12 w-12 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-3 w-11/12 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-3 w-8/12 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[18px] bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
            <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#fee2e2] text-[#ef4444]">
              <AlertTriangle size={32} />
            </div>
            <h1 className="mb-2 text-[1.25rem] font-bold text-[#091d33]">
              Unable to load company jobs
            </h1>
            <p className="mb-6 text-sm text-[#64748b]">{error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage(0)}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#091d33] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2a4a]"
              >
                <Loader2 size={16} />
                Try Again
              </button>
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-transparent px-5 py-3 text-sm font-bold text-[#091d33] transition-colors hover:bg-[#f8fafc]"
              >
                <ArrowLeft size={16} />
                Browse All Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <section className="company-hero relative mb-8 overflow-hidden bg-[#091d33] py-14 pb-[52px]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.18)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.1)_0%,transparent_70%)]" />
        <div className="inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-[22px] flex items-center gap-2 text-[0.75rem] text-white/40">
              <Link to="/" className="transition-colors hover:text-[#18a99c]">
                Home
              </Link>
              <ChevronRight size={12} />
              <Link
                to="/jobs"
                className="transition-colors hover:text-[#18a99c]"
              >
                Jobs
              </Link>
              <ChevronRight size={12} />
              <span>{companyTitle}</span>
            </div>

            <div className="mb-5 flex items-center gap-5 max-[560px]:gap-4">
              <CompanyLogo
                logoUrl={companyLogo}
                companyName={companyTitle}
                tone="hero"
                className="max-[560px]:!h-[52px] max-[560px]:!w-[52px] max-[560px]:!min-w-[52px] max-[560px]:!max-w-[52px] max-[560px]:!rounded-[13px]"
                imgStyle={{ borderRadius: "14px", backgroundColor: "white", objectFit: "contain" }}
              />
              <h1 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-white">
                {companyTitle}
              </h1>
            </div>

            <div className="mt-0 inline-flex items-center gap-2 rounded-full border border-[rgba(24,169,156,0.25)] bg-[rgba(24,169,156,0.15)] px-4 py-2 text-sm font-bold text-[#18a99c]">
              <Briefcase size={14} />
              {totalJobs > 0
                ? `${totalJobs.toLocaleString("en-IN")} open positions`
                : "Fetching jobs..."}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <CompanyJobCard
                key={job.jobId ?? job.id}
                job={job}
                appliedJobs={visibleAppliedJobs}
                onApply={handleApplyClick}
                onViewDetails={viewJobDetails}
                onShare={shareJob}
                companyNameFallback={companyDisplayName}
              />
            ))
          ) : (
            <div className="col-span-full rounded-[16px] bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f7f6] text-[#18a99c]">
                <Briefcase size={30} />
              </div>
              <h2 className="mb-2 text-base font-bold text-[#091d33]">
                No Open Positions
              </h2>
              <p className="text-sm text-[#64748b]">
                There are no current openings at {companyDisplayName}.
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && jobs.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => paginate(currentPage)}
              disabled={currentPage === 0}
              className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm text-[#64748b] transition-all hover:border-[#091d33] hover:bg-[#f8fafc] hover:text-[#091d33] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => paginate(pageNum)}
                className={`flex h-9 min-w-[38px] items-center justify-center rounded-lg border px-3 text-sm transition-all ${
                  currentPage + 1 === pageNum
                    ? "border-[#091d33] bg-[#091d33] font-bold text-white"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#091d33] hover:bg-[#f8fafc] hover:text-[#091d33]"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              onClick={() => paginate(currentPage + 2)}
              disabled={currentPage >= totalPages - 1}
              className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm text-[#64748b] transition-all hover:border-[#091d33] hover:bg-[#f8fafc] hover:text-[#091d33] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {showApplyModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-[#f0f4f8] px-6 pb-3 pt-5">
              <h2 className="text-lg font-bold text-[#091d33]">
                Confirm Application
              </h2>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-[#94a3b8] transition-colors hover:bg-[#f8fafc] hover:text-[#64748b]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f7f6] text-[#18a99c]">
                <Send size={32} />
              </div>
              <p className="mb-1 text-sm text-[#64748b]">Applying for</p>
              <h3 className="text-base font-bold text-[#091d33]">
                {selectedJob.title || "—"}
              </h3>
              <p className="mt-2 text-xs text-[#64748b]">
                at {selectedJob.companyName || companyDisplayName}
              </p>
              <p className="mt-3 text-xs text-[#64748b]">
                Your saved profile and resume will be shared with the recruiter.
              </p>
            </div>
            <div className="flex justify-center gap-3 border-t border-[#f0f4f8] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="rounded-[10px] border border-[#e2e8f0] bg-transparent px-5 py-2.5 text-sm font-bold text-[#091d33] transition-colors hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApply}
                disabled={applying}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#091d33] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0d2a4a] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {applying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {applying ? "Applying..." : "Confirm Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-[16px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-[#f0f4f8] px-6 pb-3 pt-5">
              <h2 className="text-lg font-bold text-[#091d33]">
                Login Required
              </h2>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-[#94a3b8] transition-colors hover:bg-[#f8fafc] hover:text-[#64748b]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fef3c7] text-[#f59e0b]">
                <XCircle size={32} />
              </div>
              <h3 className="mb-2 text-base font-bold text-[#091d33]">
                Sign in to apply
              </h3>
              <p className="text-sm text-[#64748b]">
                Create a free account or login to apply for jobs and track your
                applications.
              </p>
            </div>
            <div className="flex justify-center gap-3 border-t border-[#f0f4f8] px-6 py-6">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="rounded-[10px] border border-[#e2e8f0] bg-transparent px-5 py-2.5 text-sm font-bold text-[#091d33] transition-colors hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={redirectToLogin}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#091d33] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0d2a4a]"
              >
                <ArrowLeft size={16} />
                Login to Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyJobs;
