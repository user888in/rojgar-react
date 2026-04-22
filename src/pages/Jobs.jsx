import {
  MapPin,
  Search,
  Tag,
  X,
  Share2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  RotateCw,
  Lock,
  Tags,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

// ─── tiny debounce hook ───────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── strip HTML helper ────────────────────────────────────────────────────────
function stripHtml(html, maxLen = 120) {
  if (!html) return "No description available.";
  const div = document.createElement("div");
  div.innerHTML = html;
  let text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  return maxLen && text.length > maxLen ? text.substring(0, maxLen) + "…" : text || "No description available.";
}

// ─── format date helper ───────────────────────────────────────────────────────
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

// JOB CARD
const JobCard = ({ job, appliedJobs, onApply, onViewDetails, onShare }) => {
  // FIX 1: backend uses jobId, not id
  const jobId       = job.jobId ?? job.id;
  const hasApplied  = appliedJobs?.has(Number(jobId)) ?? false;
  const isClosed    = job.status === "CLOSED";
  const canApply    = !isClosed && !hasApplied;
  const companyName = job.companyName ?? job.company ?? "Company";
  const companyLogo = job.companyLogo;
  const location    = job.location ?? "Remote";
  const salary      = job.salary
    ? `₹ ${Number(job.salary).toLocaleString("en-IN")}`
    : "Not disclosed";
  const category    = job.categoryName ?? job.category ?? "General";
  const experience  = job.experienceRequired ?? job.experience;
  const description = stripHtml(job.description ?? job.jobDescription, 120);
  const createdAt   = job.createdAt ?? job.postedDate;

  const getInitials = () =>
    companyName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 h-full flex flex-col transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300 relative group">
      {/* Share Button */}
      <button
        onClick={(e) => onShare?.(job, e)}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center cursor-pointer transition-all hover:bg-teal-50 hover:text-teal-600 hover:border-teal-400 z-10"
        title="Share this job"
      >
        <Share2 size={16} />
      </button>

      {/* Company Logo & Title */}
      <div className="flex items-start gap-3 mb-3" style={{ paddingRight: 34 }}>
        <div className="min-w-[44px] w-18 h-12 rounded-xl bg-gray-100 border-gray-200 flex items-center justify-center font-extrabold text-sm text-navy-900 flex-shrink-0 overflow-hidden">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-full h-full object-fill"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.textContent = getInitials();
              }}
            />
          ) : (
            getInitials()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-navy-900 mb-0.5 leading-tight line-clamp-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="truncate">{companyName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 my-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
          <MapPin size={14} /> {location}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
          <Briefcase size={14} /> {category}
        </span>
        {experience && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
            <Clock size={14} /> {experience}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-md px-2.5 py-1">
          {salary}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4 line-clamp-3">
        {description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={14} /> {formatDate(createdAt)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails?.(jobId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Eye size={16} /> View
          </button>
          <button
            onClick={() => onApply?.(job)}
            disabled={!canApply}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold border-none transition-all ${
              !canApply
                ? isClosed
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-50 text-green-600 cursor-default"
                : "bg-[#091D33] text-white hover:bg-teal-600 hover:-translate-y-px cursor-pointer"
            }`}
          >
            {isClosed ? (
              <><XCircle size={16} /> Closed</>
            ) : hasApplied ? (
              <><CheckCircle size={16} /> Applied</>
            ) : (
              <><Send size={16} /> Apply</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* JOBS PAGE */
const Jobs = () => {
  const navigate = useNavigate();
  const { token, userIsJobSeeker } = useAuth();   // expose userIsJobSeeker from your AuthContext if possible

  const [jobs,        setJobs]        = useState([]);
  const [totalJobs,   setTotalJobs]   = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(0);   // FIX 2: backend is 0-based
  const [filters,     setFilters]     = useState({ title: "", location: "", category: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal,  setShowApplyModal]  = useState(false);
  const [showLoginModal,  setShowLoginModal]  = useState(false);
  const [applying,        setApplying]        = useState(false);
  const [appliedJobs,     setAppliedJobs]     = useState(new Set());
  const [error,           setError]           = useState(null);

  // FIX 3: debounce filter changes so we don't fire on every keystroke
  const debouncedFilters = useDebounce(filters, 400);

  const jobsPerPage = 9;

  /* ── Read URL params once on mount ─────────────────────────────────────── */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const title    = p.get("title")    || "";
    const location = p.get("location") || "";
    const category = p.get("category") || "";
    if (title || location || category) {
      // FIX 4: Don't spread stale `filters`; build fresh object
      setFilters({ title, location, category });
      setCurrentPage(0);
    }
  }, []); // intentionally empty — runs once on mount

  /* ── Fetch applied jobs (mirrors common.js fetchAppliedJobs) ────────────── */
  const fetchAppliedJobs = useCallback(async () => {
    // FIX 5: actually fetch applied jobs — was completely missing
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/applications/my?page=0&size=500`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.content || []);
      const ids  = new Set(
        list.map((app) => Number(app.jobId ?? app.job_id ?? app.job?.jobId ?? app.job?.id))
            .filter(Boolean)
      );
      setAppliedJobs(ids);
    } catch (err) {
      console.warn("[Jobs] fetchAppliedJobs failed:", err);
    }
  }, [token]);

  /* ── Fetch jobs ─────────────────────────────────────────────────────────── */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // FIX 6: send 0-based page directly (currentPage is already 0-based)
      const params = new URLSearchParams({ page: currentPage });
      if (debouncedFilters.title)    params.append("title",    debouncedFilters.title);
      if (debouncedFilters.location) params.append("location", debouncedFilters.location);
      if (debouncedFilters.category) params.append("category", debouncedFilters.category);

      const response = await fetch(`${API_BASE_URL}/jobs/openjobs?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        throw new Error("Jobs endpoint returned 401. Ensure /api/jobs/** is permitAll() in SecurityConfig.");
      }
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      // Handle Spring Page response shape: { content, totalElements, totalPages, number }
      if (Array.isArray(data)) {
        setJobs(data);
        setTotalJobs(data.length);
        setTotalPages(1);
      } else {
        setJobs(data.content || data.jobs || []);
        setTotalJobs(data.totalElements ?? data.total ?? 0);
        setTotalPages(data.totalPages ?? Math.ceil((data.totalElements ?? 0) / jobsPerPage));
        // sync current page from server response (Spring returns `number`)
        if (data.number !== undefined) setCurrentPage(data.number);
      }
    } catch (err) {
      console.error("[Jobs] fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedFilters, token]);

  // Fetch jobs whenever page or debounced filters change
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Fetch applied jobs once after auth is known
  useEffect(() => { fetchAppliedJobs(); }, [fetchAppliedJobs]);

  /* ── Apply flow ─────────────────────────────────────────────────────────── */
  const handleApplyClick = (job) => {
    setSelectedJob(job);
    if (!token) { setShowLoginModal(true); return; }
    setShowApplyModal(true);
  };

  const confirmApply = async () => {
    if (!selectedJob) return;
    const jobId = selectedJob.jobId ?? selectedJob.id;
    setApplying(true);
    try {
      // FIX 7: correct endpoint — /applications/apply/:jobId  (matches common.js)
      const response = await fetch(`${API_BASE_URL}/applications/apply/${jobId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      setShowApplyModal(false);

      if (response.ok) {
        setAppliedJobs((prev) => new Set([...prev, Number(jobId)]));
        // Optimistically flip the card button
        setJobs((prev) =>
          prev.map((j) =>
            (j.jobId ?? j.id) === jobId ? { ...j, hasApplied: true } : j
          )
        );
        alert("Applied successfully! 🎉");
      } else if (response.status === 409) {
        setAppliedJobs((prev) => new Set([...prev, Number(jobId)]));
        alert("You've already applied for this job.");
      } else if (response.status === 401) {
        setShowLoginModal(true);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Failed to apply. Please try again.");
      }
    } catch (err) {
      console.error("[Jobs] confirmApply error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  /* ── Search / filter helpers ────────────────────────────────────────────── */
  const handleSearch = () => setCurrentPage(0);

  const clearFilters = () => {
    setFilters({ title: "", location: "", category: "" });
    setCurrentPage(0);
  };

  const removeFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setCurrentPage(0);
  };

  /* ── Navigation helpers ─────────────────────────────────────────────────── */
  const redirectToLogin = () => {
    setShowLoginModal(false);
    const returnUrl = encodeURIComponent(window.location.pathname);
    navigate(`/login?return=${returnUrl}`);
  };

  const viewJobDetails = (jobId) => navigate(`/jobs/${jobId}`);

  const shareJob = async (job, e) => {
    e.stopPropagation();
    const jobId   = job.jobId ?? job.id;
    const shareUrl = `${window.location.origin}/jobs/${jobId}`;
    if (navigator.share) {
      navigator.share({ title: `${job.title} at ${job.companyName}`, url: shareUrl }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Job link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  /* ── Pagination ─────────────────────────────────────────────────────────── */
  // FIX 8: pagination display is 1-based for UX but currentPage state is 0-based
  const getPageNumbers = () => {
    const display  = currentPage + 1;   // 1-based for display
    const pages    = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (display <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (display >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = display - 2; i <= display + 2; i++) pages.push(i);
    }
    return pages;
  };

  const paginate = (displayPage) => {
    // displayPage is 1-based; convert to 0-based for state
    const zero = displayPage - 1;
    if (zero < 0 || zero >= totalPages) return;
    setCurrentPage(zero);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const displayPage        = currentPage + 1;   // 1-based for UI

  return (
    <>
      {/* ── Hero Search ── */}
      <section
        className="relative overflow-hidden py-14 pb-18"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a2a3a 50%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,169,156,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,169,156,0.06)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
              Find Your <span className="text-teal-500">Dream Job</span>
            </h1>
            <p className="text-white/50 text-base mb-8">
              Search thousands of verified openings from top companies across India
            </p>
            <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row items-stretch gap-0 shadow-xl">
              <div className="flex items-center gap-1 flex-1 px-3 py-2 md:border-r border-gray-200">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, skills, keywords..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  value={filters.title}
                  onChange={(e) => setFilters((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-center gap-1 flex-1 px-3 py-2 md:border-r border-gray-200">
                <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="City, state or remote..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  value={filters.location}
                  onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-center gap-1 flex-1 px-3 py-2">
                <Tags size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Category..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  value={filters.category}
                  onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-[#091D33] text-white border-none rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-teal-600 md:mt-0 mt-2"
              >
                <Search size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Listings ── */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
          <div>
            <div className="text-lg font-bold text-navy-900">Open Positions</div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="font-bold text-teal-600">{totalJobs}</span> jobs found
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <X size={18} /> Clear all filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.title && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <Search size={14} /> {filters.title}
                <button onClick={() => removeFilter("title")} className="bg-none border-none cursor-pointer text-teal-600 p-0 flex items-center ml-1"><X size={14} /></button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <MapPin size={14} /> {filters.location}
                <button onClick={() => removeFilter("location")} className="bg-none border-none cursor-pointer text-teal-600 p-0 flex items-center ml-1"><X size={14} /></button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <Tags size={14} /> {filters.category}
                <button onClick={() => removeFilter("category")} className="bg-none border-none cursor-pointer text-teal-600 p-0 flex items-center ml-1"><X size={14} /></button>
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-500">Loading jobs…</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-16">
              <div className="w-18 h-18 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h6 className="text-base font-bold text-navy-900 mb-2">Error loading jobs</h6>
              <p className="text-sm text-gray-500 mb-1">{error}</p>
              <p className="text-xs text-gray-400">Hitting: <code>{API_BASE_URL}/jobs/openjobs</code></p>
              <button
                onClick={fetchJobs}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#091D33] text-white hover:bg-teal-600 transition-all cursor-pointer"
              >
                <RotateCw size={16} /> Try Again
              </button>
            </div>
          ) : jobs.length > 0 ? (
            // FIX 9: key uses jobId (not id) — matches actual API field
            jobs.map((job) => (
              <JobCard
                key={job.jobId ?? job.id}
                job={job}
                appliedJobs={appliedJobs}
                onApply={handleApplyClick}
                onViewDetails={viewJobDetails}
                onShare={shareJob}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-18 h-18 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-gray-400" />
              </div>
              <h6 className="text-base font-bold text-navy-900 mb-2">No jobs found</h6>
              <p className="text-sm text-gray-500">Try adjusting your search filters or check back later</p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#091D33] text-white hover:bg-teal-600 transition-all cursor-pointer"
              >
                <RotateCw size={16} /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && jobs.length > 0 && (
          <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
            <button
              onClick={() => paginate(displayPage - 1)}
              disabled={currentPage === 0}
              className="min-w-[38px] h-9 border border-gray-200 bg-white rounded-lg text-sm text-gray-500 cursor-pointer flex items-center justify-center px-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`min-w-[38px] h-9 border rounded-lg text-sm cursor-pointer flex items-center justify-center transition-all ${
                  displayPage === pageNum
                    ? "bg-[#091D33] text-white border-navy-900 font-bold"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => paginate(displayPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="min-w-[38px] h-9 border border-gray-200 bg-white rounded-lg text-sm text-gray-500 cursor-pointer flex items-center justify-center px-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* ── Apply Modal ── */}
      {showApplyModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-gray-100 px-6 pt-5 pb-2">
              <h5 className="font-bold text-lg text-navy-900">Confirm Application</h5>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
                onClick={() => setShowApplyModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-center py-6 px-6">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-teal-600" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Applying for</p>
              <h6 className="font-bold text-base text-navy-900">{selectedJob.title}</h6>
              <p className="text-xs text-gray-500 mt-2">at {selectedJob.companyName ?? selectedJob.company}</p>
              <p className="text-xs text-gray-500 mt-3">
                Your saved profile and resume will be shared with the recruiter.
              </p>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-center gap-3">
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer"
                onClick={() => setShowApplyModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={confirmApply}
                disabled={applying}
                className="px-5 py-2 rounded-lg text-sm font-semibold border-none bg-[#091D33] text-white hover:bg-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {applying ? (
                  <><Loader size={16} className="animate-spin" /> Applying…</>
                ) : (
                  <><Send size={16} /> Confirm Apply</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-gray-100 px-6 pt-5 pb-2">
              <h5 className="font-bold text-lg text-navy-900">Login Required</h5>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
                onClick={() => setShowLoginModal(false)}
              >
                <X size={24} />
              </button>   
            </div>
            <div className="text-center py-4 px-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-amber-600" />
              </div>
              <h6 className="font-bold text-base mb-2">Sign in to apply</h6>
              <p className="text-sm text-gray-500">
                Create a free account or login to apply for jobs and track your applications.
              </p>
            </div>
            <div className="border-t border-gray-100 px-6 py-7 flex justify-center gap-3">
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold  hover:border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer"
                onClick={() => setShowLoginModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={redirectToLogin}
                className="px-5 py-2 hover:-translate-y-[2px] rounded-lg text-sm font-semibold border-none bg-[#091D33] text-white hover:bg-teal-600 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogIn size={16} /> Login to Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
};

export default Jobs;
