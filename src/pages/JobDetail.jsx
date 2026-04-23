import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Globe,
  Link2,
  Loader2,
  Lock,
  MapPin,
  Send,
  Sparkles,
  Tag,
  TriangleAlert,
  BriefcaseBusiness,
  ArrowLeft,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const moneyFormatter = new Intl.NumberFormat("en-IN");

function formatDate(dateStr) {
  if (!dateStr) return "Recently posted";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recently posted";
  }
}

function stripHtml(html) {
  if (!html) return "No description available.";
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  return text || "No description available.";
}

function initials(name) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]).toUpperCase();
}

function toJobId(value) {
  if (value == null) return "";
  return String(value);
}

function TwitterIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
      <path
        d="M17.4 8.2c-.4.2-.9.4-1.4.5.5-.3.8-.8 1-1.4-.5.3-1.1.5-1.6.7-.5-.6-1.2-.9-2-.9-1.5 0-2.8 1.3-2.8 2.8 0 .2 0 .4.1.6-2.3-.1-4.4-1.2-5.8-2.9-.2.4-.3.8-.3 1.3 0 .8.4 1.5.9 2-.3 0-.7-.1-1-.2 0 1.1.8 2.1 1.8 2.3-.2.1-.5.1-.8.1-.2 0-.4 0-.6-.1.4 1 1.3 1.7 2.4 1.8-.9.7-2 1.1-3.2 1.1H6c1.1.7 2.5 1.1 3.9 1.1 4.8 0 7.5-4 7.5-7.5v-.3c.5-.4.9-.8 1.2-1.3-.4.2-.9.3-1.4.4z"
        fill="#fff"
      />
    </svg>
  );
}

function LinkedInIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="0" y="0" width="24" height="24" rx="6" fill="#0A66C2" />
      <path d="M6.4 9.2H9v8H6.4v-8z" fill="#fff" />
      <circle cx="7.7" cy="6.9" r="1.3" fill="#fff" />
      <path
        d="M10.8 9.2h2.5v1.1h.1c.3-.6 1.2-1.2 2.5-1.2 2.7 0 3.2 1.8 3.2 4.1v4H16.5v-3.6c0-.9 0-2-1.2-2s-1.4.9-1.4 1.9v3.7h-2.6v-8z"
        fill="#fff"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M12 5.7c-3.4 0-6.2 2.7-6.2 6.1 0 1.2.4 2.4 1 3.3l-.7 2.7 2.8-.7c.9.5 2 .8 3 .8 3.4 0 6.2-2.7 6.2-6.1s-2.7-6.1-6.1-6.1zm3.6 8.6c-.1.4-.7.8-1.1.9-.3.1-.7.1-1.1.1-.3 0-.8-.1-1.3-.3-2.2-.9-3.6-3-3.7-3.1-.1-.1-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .4.3l.5 1.2c.1.3.1.5 0 .7-.1.2-.2.4-.3.5-.1.1-.2.3-.1.5.1.2.5.8 1.1 1.3.8.7 1.4.9 1.6 1 .2.1.4 0 .5-.1.2-.2.4-.5.6-.7.1-.2.3-.2.5-.1l1.3.6c.2.1.3.2.4.3.1.2.1.7 0 1z"
        fill="#fff"
      />
    </svg>
  );
}

function CompanyLogo({ logoUrl, companyName, className = "", imgClassName = "", imgStyle }) {
  const [failed, setFailed] = useState(false);
  const fallback = initials(companyName);

  const boxClass =
    "flex items-center justify-center overflow-hidden font-extrabold text-[#18a99c] bg-[#092035] border border-[rgba(24,169,156,0.3)] text-[1.1rem] shrink-0 " +
    className;
  const fallbackClass = boxClass.replace("w-[52px]", "w-[44px]").replace("sm:w-[100px]", "sm:w-[50px]");

  if (logoUrl && !failed) {
    return (
      <div className={boxClass}>
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

  return <div className={fallbackClass}>{fallback}</div>;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const jobId = useMemo(() => toJobId(id), [id]);
  const invalidJobId = !jobId;
  const isJobSeeker = user?.role === "JOB_SEEKER";
  const isClosed = job?.status === "CLOSED";
  const visibleAppliedJobIds = token && isJobSeeker ? appliedJobIds : new Set();
  const isApplied = visibleAppliedJobIds.has(jobId);
  const canApply = !!job && !isClosed && !isApplied;

  useEffect(() => {
    if (!job) {
      document.title = "Job Details - RojgarShine";
      return;
    }
    document.title = `${job.title || "Job Details"} - RojgarShine`;
  }, [job]);

  useEffect(() => {
    if (invalidJobId) return;

    const controller = new AbortController();

    const loadJob = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(response.status === 404 ? "Job Not Found" : "Unable to load job details");
        }

        const data = await response.json();
        if (!controller.signal.aborted) {
          setJob(data);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load job details");
          setJob(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadJob();
    return () => controller.abort();
  }, [jobId, token, invalidJobId]);

  useEffect(() => {
    if (!token || !isJobSeeker) return;

    const controller = new AbortController();

    const loadAppliedJobs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/applications/my?page=0&size=500`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.content || [];
        const ids = new Set(
          list
            .map((application) => application.jobId ?? application.job_id ?? application.job?.jobId ?? application.job?.id)
            .filter((value) => value != null)
            .map((value) => toJobId(value))
        );

        if (!controller.signal.aborted) {
          setAppliedJobIds(ids);
        }
      } catch {
        // Non-blocking, the page still works without the applied-job cache.
      }
    };

    loadAppliedJobs();
    return () => controller.abort();
  }, [token, isJobSeeker]);

  const descriptionHtml = job?.description || "No description available.";
  const descriptionText = useMemo(() => stripHtml(descriptionHtml), [descriptionHtml]);
  const companyName = job?.companyName || job?.company || "—";
  const companyDescription = job?.companyDescription || "No description available.";
  const companyId =
    job?.companyId ??
    job?.company?.id ??
    job?.company?.companyId ??
    job?.company?.companyID ??
    job?.company?.company_id ??
    job?.companyDetails?.id ??
    job?.companyDetails?.companyId ??
    job?.companyDetails?.companyID ??
    job?.companyDetails?.company_id;
  const salaryText = job?.salary
    ? `₹ ${moneyFormatter.format(Number(job.salary))}`
    : "Salary not disclosed";
  const sideSalaryText = job?.salary ? `₹ ${moneyFormatter.format(Number(job.salary))}` : "Not disclosed";
  const postedText = job?.createdAt ? `Posted on ${formatDate(job.createdAt)}` : "Recently posted";
  const location = job?.location || "—";
  const category = job?.categoryName || job?.category || "—";

  const shareUrl = useMemo(() => {
    if (!jobId) return window.location.href;
    return `${window.location.origin}/jobs/${jobId}`;
  }, [jobId]);

  const shareTitle = useMemo(() => {
    if (!job) return document.title;
    return `${job.title || "Job Details"} at ${companyName} - RojgarShine`;
  }, [job, companyName]);

  const handleApply = () => {
    if (!job || isClosed) return;
    if (!token || !isJobSeeker) {
      setShowLoginModal(true);
      return;
    }
    if (isApplied) return;
    setShowApplyModal(true);
  };

  const confirmApply = async () => {
    if (!job) return;

    setApplying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications/apply/${jobId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        setAppliedJobIds((prev) => new Set(prev).add(jobId));
        setShowApplyModal(false);
        window.alert("Applied successfully!");
        return;
      }

      if (response.status === 409) {
        setAppliedJobIds((prev) => new Set(prev).add(jobId));
        setShowApplyModal(false);
        window.alert("You've already applied for this job.");
        return;
      }

      if (response.status === 401) {
        setShowApplyModal(false);
        setShowLoginModal(true);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setShowApplyModal(false);
      window.alert(data.message || "Failed to apply. Please try again.");
    } catch {
      setShowApplyModal(false);
      window.alert("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const redirectToLogin = () => {
    setShowLoginModal(false);
    navigate(`/login?return=${encodeURIComponent(`/jobs/${jobId}`)}`);
  };

  const copyJobLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      window.alert("Failed to copy link");
    }
  };

  const shareJobOn = (platform) => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    const map = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
    };
    const shareLink = map[platform];
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400,noopener,noreferrer");
    }
  };

  const companyJobsHref = companyId
    ? `/companies/${companyId}/jobs${job?.companyName ? `?name=${encodeURIComponent(job.companyName)}` : ""}`
    : job?.companyName
      ? `/companies/${encodeURIComponent(job.companyName)}/jobs?name=${encodeURIComponent(job.companyName)}`
      : "/companies";

  if (invalidJobId) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[16px] bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(9,29,51,0.07)] sm:px-10">
            <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#fee2e2] text-[2rem] text-[#ef4444]">
              <TriangleAlert size={32} />
            </div>
            <h1 className="mb-2 text-[1.25rem] font-bold text-[#091d33]">Job Not Found</h1>
            <p className="mb-6 text-sm text-[#64748b]">
              This job may have been removed or does not exist anymore.
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
        <div className="mx-auto w-full max-w-7xl px-4 pb-5 pt-4 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-[18px] bg-[#091d33] px-6 py-10 shadow-[0_16px_40px_rgba(9,29,51,0.16)] sm:px-8">
            <div className="h-4 w-40 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-4 h-10 w-3/5 rounded-2xl bg-white/10 animate-pulse" />
            <div className="mt-3 h-4 w-2/5 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-8 w-32 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-8 w-32 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
              <div className="mb-4 h-3 w-40 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-4">
                <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-11/12 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-10/12 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-8/12 rounded-full bg-slate-200 animate-pulse" />
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
                <div className="mb-4 h-3 w-36 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-4 w-10/12 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
                <div className="mb-4 h-3 w-28 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-3 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                </div>
                <div className="mt-5 h-4 w-full rounded-full bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex min-h-[calc(100vh-62px)] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[16px] bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(9,29,51,0.07)] sm:px-10">
            <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#fee2e2] text-[2rem] text-[#ef4444]">
              <TriangleAlert size={32} />
            </div>
            <h1 className="mb-2 text-[1.25rem] font-bold text-[#091d33]">Job Not Found</h1>
            <p className="mb-6 text-sm text-[#64748b]">
              This job may have been removed or does not exist anymore.
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

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <section className="relative mb-7 overflow-hidden bg-[#091d33] py-12 pb-11">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.2)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.1)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[.82rem] text-white/55">
                <Link to="/" className="transition-colors hover:text-white">
                  Home
                </Link>
                <ChevronRight size={12} />
                <Link to="/jobs" className="transition-colors hover:text-white">
                  Jobs
                </Link>
                <ChevronRight size={12} />
                <span className="text-white/75">{job.title || "Job Details"}</span>
              </div>

              <span
                className={[
                  "mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[.7rem] font-bold uppercase tracking-[.5px]",
                  isClosed ? "bg-[rgba(239,68,68,0.15)] text-[#f87171]" : "bg-[rgba(34,197,94,0.15)] text-[#4ade80]",
                ].join(" ")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {job.status || "OPEN"}
              </span>

              <div className="mb-3 flex items-start gap-3">
                <CompanyLogo
                  key={`${job.companyLogo || "no-logo"}-${companyName}`}
                  logoUrl={job.companyLogo}
                  companyName={companyName}
                  className="h-[52px] w-[52px] rounded-[12px] text-[1.1rem] sm:w-[100px]"
                  imgStyle={{ borderRadius: "10px" }}
                />
                <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white">
                  {job.title || "Job Details"}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[.82rem] text-white/75">
                  <Building2 size={14} className="text-[#18a99c]" />
                  {companyName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[.82rem] text-white/75">
                  <MapPin size={14} className="text-[#18a99c]" />
                  {location}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[.82rem] text-white/75">
                  <Tag size={14} className="text-[#18a99c]" />
                  {category}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end">
              <div className="mb-1 text-[1.6rem] font-extrabold text-[#18a99c]">
                {salaryText}
              </div>
              <div className="mb-5 text-[.78rem] text-white/40">{postedText}</div>
              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className={[
                  "inline-flex items-center gap-2 rounded-[12px] px-8 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(24,169,156,0.4)] transition-all",
                  isClosed
                    ? "cursor-not-allowed bg-white/12 shadow-none"
                    : isApplied
                      ? "cursor-not-allowed bg-[#16a34a] shadow-[0_4px_16px_rgba(22,163,74,0.3)]"
                      : "bg-[#18a99c] hover:-translate-y-0.5 hover:bg-[#14968a] hover:shadow-[0_8px_24px_rgba(24,169,156,0.45)]",
                ].join(" ")}
              >
                {isClosed ? <X size={16} /> : isApplied ? <CircleDot size={16} /> : <Send size={16} />}
                {isClosed ? "Job Closed" : isApplied ? "Applied" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          <section className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
            <div className="mb-4 flex items-center gap-2 text-[.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c] after:h-px after:flex-1 after:bg-[#e2e8f0]">
              <BriefcaseBusiness size={14} />
              Job Description
            </div>
            <div
              className="space-y-4 text-[.9rem] leading-[1.85] text-[#64748b] [&_h1]:mt-6 [&_h1]:text-[1.15rem] [&_h1]:font-bold [&_h1]:text-[#091d33] [&_h2]:mt-6 [&_h2]:text-[1.05rem] [&_h2]:font-bold [&_h2]:text-[#091d33] [&_h3]:mt-5 [&_h3]:text-[1rem] [&_h3]:font-bold [&_h3]:text-[#091d33] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:m-0"
              aria-label={descriptionText}
              title={descriptionText}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />

            <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-[#e2e8f0] pt-5">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-[.8px] text-[#64748b]">
                Share job
              </span>
              <button
                type="button"
                onClick={() => shareJobOn("twitter")}
                className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f1f5f9] px-3.5 py-2 text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
              >
                <TwitterIcon className="h-4 w-4 shrink-0" />
                Twitter
              </button>
              <button
                type="button"
                onClick={() => shareJobOn("linkedin")}
                className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f1f5f9] px-3.5 py-2 text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
              >
                <LinkedInIcon className="h-4 w-4 shrink-0" />
                LinkedIn
              </button>
              <button
                type="button"
                onClick={() => shareJobOn("whatsapp")}
                className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f1f5f9] px-3.5 py-2 text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={copyJobLink}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors",
                  shareCopied
                    ? "border-[#22c55e] bg-[#f0fdf4] text-[#16a34a]"
                    : "border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]",
                ].join(" ")}
              >
                {shareCopied ? <Sparkles size={13} /> : <Link2 size={13} />}
                {shareCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
              <div className="mb-4 flex items-center gap-2 text-[.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c] after:h-px after:flex-1 after:bg-[#e2e8f0]">
                <Globe size={14} />
                Job Overview
              </div>

              <ul className="m-0 list-none space-y-0 p-0">
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <BriefcaseBusiness size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Job Title
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {job.title || "—"}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Company
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {companyName}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <span className="text-[14px] font-bold">₹</span>
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Salary
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {sideSalaryText}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Location
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {location}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <Tag size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Category
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {category}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <CircleDot size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Status
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {job.status || "—"}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 border-b border-[#f0f4f8] py-3 last:border-b-0">
                  <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f7f6] text-[#18a99c]">
                    <CalendarDays size={14} />
                  </div>
                  <div>
                    <div className="text-[.67rem] font-bold uppercase tracking-[.5px] text-[#64748b]">
                      Posted On
                    </div>
                    <div className="mt-[1px] text-[.875rem] font-semibold text-[#091d33]">
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                </li>
              </ul>

              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className={[
                  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(24,169,156,0.3)] transition-all",
                  isClosed
                    ? "cursor-not-allowed bg-[#f1f5f9] text-[#64748b] shadow-none"
                    : isApplied
                      ? "cursor-not-allowed bg-[#16a34a] text-white"
                      : "bg-[#18a99c] hover:bg-[#14968a]",
                ].join(" ")}
              >
                {isClosed ? <X size={16} /> : isApplied ? <CircleDot size={16} /> : <Send size={16} />}
                {isClosed ? "Job Closed" : isApplied ? "Applied" : "Apply Now"}
              </button>
            </section>

            <section className="rounded-[16px] bg-white p-7 shadow-[0_2px_20px_rgba(9,29,51,0.07)]">
              <div className="mb-4 flex items-center gap-2 text-[.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c] after:h-px after:flex-1 after:bg-[#e2e8f0]">
                <Building2 size={14} />
                Company
              </div>
              <div className="flex items-center gap-3">
                <CompanyLogo
                  key={`${job.companyLogo || "no-logo"}-${companyName}-side`}
                  logoUrl={job.companyLogo}
                  companyName={companyName}
                  className="h-[52px] w-[52px] rounded-[12px] text-[1.1rem]"
                  imgStyle={{ borderRadius: "10px", backgroundColor: "white" }}
                />
                <div>
                  <div className="text-[1rem] font-bold text-[#091d33]">{companyName}</div>
                  {job.companyCity || job.companyLocation ? (
                    <div className="mt-0.5 text-[.8rem] text-[#64748b]">
                      {job.companyCity || job.companyLocation}
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="mt-4 border-t border-[#e2e8f0] pt-4 text-[.84rem] leading-[1.7] text-[#64748b]">
                {companyDescription}
              </p>
              <Link
                to={companyJobsHref}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9] px-4 py-3 text-[.84rem] font-bold text-[#091d33] transition-colors hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]"
              >
                <BriefcaseBusiness size={15} />
                View All Jobs at this Company
              </Link>
            </section>
          </aside>
        </div>
      </main>

      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-[#f0f4f8] px-6 pb-3 pt-5">
              <h2 className="text-lg font-bold text-[#091d33]">Confirm Application</h2>
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
              <h3 className="text-base font-bold text-[#091d33]">{job.title || "—"}</h3>
              <p className="mt-2 text-xs text-[#64748b]">at {companyName}</p>
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
                {applying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {applying ? "Applying..." : "Confirm Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-[16px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-[#f0f4f8] px-6 pb-3 pt-5">
              <h2 className="text-lg font-bold text-[#091d33]">Login Required</h2>
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
                <Lock size={32} />
              </div>
              <h3 className="mb-2 text-base font-bold text-[#091d33]">Sign in to apply</h3>
              <p className="text-sm text-[#64748b]">
                Create a free account or login to apply for jobs and track your applications.
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
                <Lock size={16} />
                Login to Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
