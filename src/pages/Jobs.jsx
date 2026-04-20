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
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: Use a single consistent token key across your whole app.
//         Check your login page — whatever key it uses to SAVE the token,
//         use the SAME key here to READ it.
//         Common keys: "token", "authToken", "jwt"
//         Change TOKEN_KEY below to match your login page.
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY = "token"; // ← change this to match your login page

const getToken = () => localStorage.getItem(TOKEN_KEY);

// Jobs Page Component
const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    title: "",
    location: "",
    category: "",
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  const jobsPerPage = 9;

  // Check login status
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!getToken());
    };
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    return () => window.removeEventListener("authChange", checkAuth);
  }, []);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: jobsPerPage,
      });

      if (filters.title) params.append("title", filters.title);
      if (filters.location) params.append("location", filters.location);
      if (filters.category) params.append("category", filters.category);

      const token = getToken();

      // FIX 2: Make sure API_BASE_URL + "/jobs" matches what your SecurityConfig permits.
      //         If SecurityConfig has: .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll()
      //         Then API_BASE_URL should end with /api  →  e.g. "https://tunnel.com/api"
      //         So the final URL becomes: https://tunnel.com/api/jobs?page=1&limit=9
      const response = await fetch(`${API_BASE_URL}/jobs/openjobs`, {
        headers: {
          "Content-Type": "application/json",
          // FIX 3: Always send Authorization header structure correctly
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // FIX 4: Handle 401 gracefully — jobs page is public so 401 means
      //         the endpoint is not permitted in SecurityConfig, not an auth error.
      if (response.status === 401) {
        throw new Error(
          "Jobs endpoint returned 401. Check SecurityConfig — /api/jobs/** must be permitAll() for GET requests."
        );
      }

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      // FIX 5: Handle both response shapes — { jobs, total } or flat array
      if (Array.isArray(data)) {
        setJobs(data);
        setTotalJobs(data.length);
      } else {
        setJobs(data.jobs || data.content || []);
        setTotalJobs(data.total || data.totalElements || 0);
      }

      if (data.appliedJobIds) {
        setAppliedJobs(new Set(data.appliedJobIds));
      }
    } catch (err) {
      console.error("[Jobs] fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };
  // Note: removing direct fetchJobs() call here because useEffect already
  // triggers fetchJobs when currentPage or filters change.

  // Clear all filters
  const clearFilters = () => {
    setFilters({ title: "", location: "", category: "" });
    setCurrentPage(1);
    const titleInput    = document.getElementById("searchTitle");
    const locationInput = document.getElementById("searchLocation");
    const categoryInput = document.getElementById("searchCategory");
    if (titleInput)    titleInput.value    = "";
    if (locationInput) locationInput.value = "";
    if (categoryInput) categoryInput.value = "";
  };

  // Remove single filter
  const removeFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    const inputMap = {
      title:    "searchTitle",
      location: "searchLocation",
      category: "searchCategory",
    };
    const input = document.getElementById(inputMap[key]);
    if (input) input.value = "";
    setCurrentPage(1);
  };

  // Handle apply click
  const handleApplyClick = (job) => {
    const token = getToken();
    if (!token) {
      setSelectedJob(job);
      setShowLoginModal(true);
      return;
    }
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  // Confirm application submission
  const confirmApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: selectedJob.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired — clear and show login
          localStorage.removeItem(TOKEN_KEY);
          setIsLoggedIn(false);
          setShowApplyModal(false);
          setShowLoginModal(true);
          return;
        }
        throw new Error(data.message || "Application failed");
      }

      if (data.success || response.ok) {
        alert(data.message || "Application submitted successfully!");
        setShowApplyModal(false);
        setAppliedJobs((prev) => new Set([...prev, selectedJob.id]));
        setJobs((prev) =>
          prev.map((job) =>
            job.id === selectedJob.id
              ? { ...job, status: "APPLIED", hasApplied: true }
              : job
          )
        );
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  // Redirect to login page
  const redirectToLogin = () => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `/login.html?return=${returnUrl}`;
  };

  // View job details
  const viewJobDetails = (jobId) => {
    window.location.href = `/job-details.html?id=${jobId}`;
  };

  // Share job
  const shareJob = async (job, e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/job-details.html?id=${job.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Job link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    const date     = new Date(dateStr);
    const now      = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Pagination
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const paginate = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v).length;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  // ── Job Card ───────────────────────────────────────────────────────────────
  const JobCard = ({ job }) => {
    const hasApplied = appliedJobs.has(job.id) || job.hasApplied || job.status === "APPLIED";
    const isClosed   = job.status === "CLOSED";
    const canApply   = !isClosed && !hasApplied;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-400 relative group">
        <button
          onClick={(e) => shareJob(job, e)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center cursor-pointer transition-all hover:bg-teal-50 hover:text-teal-600 hover:border-teal-400 z-10"
          title="Share this job"
        >
          <Share2 size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="min-w-[44px] w-12 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-extrabold text-sm text-navy-900 flex-shrink-0 overflow-hidden">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
            ) : (
              job.company?.charAt(0) || "C"
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-navy-900 mb-0.5 leading-tight line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="truncate">{job.company}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {job.employeeCount || "10-50"} employees
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
            <MapPin size={14} /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-md px-2.5 py-1">
            ₹ {job.salary}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
            <Briefcase size={14} /> {job.category}
          </span>
          {job.experience && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2.5 py-1">
              <Clock size={14} /> {job.experience}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={14} /> Posted {formatDate(job.postedDate)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => viewJobDetails(job.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Eye size={16} /> View
            </button>
            <button
              onClick={() => handleApplyClick(job)}
              disabled={!canApply}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold border-none transition-all cursor-pointer ${
                !canApply
                  ? isClosed
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-50 text-green-600 cursor-default"
                  : "bg-[#091D33] text-white hover:bg-teal-600 hover:-translate-y-px"
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

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-14 pb-18"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a2a3a 50%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,169,156,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,169,156,0.06)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>
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
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  id="searchTitle"
                  placeholder="Job title, skills, keywords..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  defaultValue={filters.title}
                  onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-center gap-1 flex-1 px-3 py-2 md:border-r border-gray-200">
                <MapPin size={18} className="text-gray-400" />
                <input
                  type="text"
                  id="searchLocation"
                  placeholder="City, state or remote..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  defaultValue={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-center gap-1 flex-1 px-3 py-2">
                <Tags size={18} className="text-gray-400" />
                <input
                  type="text"
                  id="searchCategory"
                  placeholder="Category..."
                  className="border-none outline-none text-sm text-navy-900 bg-transparent w-full placeholder:text-gray-400"
                  defaultValue={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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

      {/* Job Listings */}
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

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.title && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <Search size={14} /> {filters.title}
                <button onClick={() => removeFilter("title")} className="bg-none border-none cursor-pointer text-teal-600 text-sm leading-none p-0 flex items-center ml-1">
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <MapPin size={14} /> {filters.location}
                <button onClick={() => removeFilter("location")} className="bg-none border-none cursor-pointer text-teal-600 text-sm leading-none p-0 flex items-center ml-1">
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-teal-500 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
                <Tags size={14} /> {filters.category}
                <button onClick={() => removeFilter("category")} className="bg-none border-none cursor-pointer text-teal-600 text-sm leading-none p-0 flex items-center ml-1">
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-16">
              <div className="w-18 h-18 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h6 className="text-base font-bold text-navy-900 mb-2">Error loading jobs</h6>
              <p className="text-sm text-gray-500 mb-1">{error}</p>
              {/* FIX 6: Show helpful debug info in development */}
              <p className="text-xs text-gray-400">
                Hitting: <code>{API_BASE_URL}/jobs</code>
              </p>
              <button
                onClick={fetchJobs}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#091D33] text-white hover:bg-teal-600 transition-all cursor-pointer"
              >
                <RotateCw size={16} /> Try Again
              </button>
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-18 h-18 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-gray-400" />
              </div>
              <h6 className="text-base font-bold text-navy-900 mb-2">No jobs found</h6>
              <p className="text-sm text-gray-500">
                Try adjusting your search filters or check back later
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#091D33] text-white hover:bg-teal-600 transition-all cursor-pointer"
              >
                <RotateCw size={16} /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {totalPages > 1 && !loading && jobs.length > 0 && (
          <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="min-w-[38px] h-9 border border-gray-200 bg-white rounded-lg text-sm text-gray-500 cursor-pointer flex items-center justify-center px-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`min-w-[38px] h-9 border rounded-lg text-sm cursor-pointer flex items-center justify-center transition-all ${
                  currentPage === pageNum
                    ? "bg-[#091D33] text-white border-navy-900 font-bold"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="min-w-[38px] h-9 border border-gray-200 bg-white rounded-lg text-sm text-gray-500 cursor-pointer flex items-center justify-center px-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-navy-900 hover:text-navy-900 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowApplyModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative border-b border-gray-100 px-6 pt-5 pb-2">
              <h5 className="font-bold text-lg text-navy-900">Confirm Application</h5>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none" onClick={() => setShowApplyModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="text-center py-6 px-6">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-teal-600" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Applying for</p>
              <h6 className="font-bold text-base text-navy-900">{selectedJob.title}</h6>
              <p className="text-xs text-gray-500 mt-2">at {selectedJob.company}</p>
              <p className="text-xs text-gray-500 mt-3">
                Your saved profile and resume will be shared with the recruiter.
              </p>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-center gap-3">
              <button className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setShowApplyModal(false)}>
                Cancel
              </button>
              <button
                onClick={confirmApply}
                disabled={applying}
                className="px-5 py-2 rounded-lg text-sm font-semibold border-none bg-[#091D33] text-white hover:bg-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {applying ? <><Loader size={16} className="animate-spin" /> Applying...</> : <><Send size={16} /> Confirm Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative border-b border-gray-100 px-6 pt-5 pb-2">
              <h5 className="font-bold text-lg text-navy-900">Login Required</h5>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none" onClick={() => setShowLoginModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="text-center py-6 px-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-amber-600" />
              </div>
              <h6 className="font-bold text-base mb-2">Sign in to apply</h6>
              <p className="text-sm text-gray-500">
                Create a free account or login to apply for jobs and track your applications.
              </p>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-center gap-3">
              <button className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setShowLoginModal(false)}>
                Cancel
              </button>
              <button onClick={redirectToLogin} className="px-5 py-2 rounded-lg text-sm font-semibold border-none bg-[#091D33] text-white hover:bg-teal-600 transition-all flex items-center gap-2 cursor-pointer">
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
