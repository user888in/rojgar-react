import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Briefcase,
  DoorOpen,
  XCircle,
  Banknote,
  Search,
  Filter,
  Eye,
  Tag,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

const AdminJobs = () => {
  const { user, authFetch } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};

  const isSubAdmin = user?.role === "SUB_ADMIN";

  // Stats State
  const [stats, setStats] = useState({
    total: "--",
    open: "--",
    closed: "--",
    avgSalary: null,
  });

  // Table & Filter State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const perPage = 10;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [viewJobData, setViewJobData] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  // Load Stats
  const loadStats = useCallback(async () => {
    const fetchStatCount = async (status) => {
      try {
        const params = new URLSearchParams({ page: 0, size: 1 });
        if (status) params.set("status", status);
        const res = await authFetch(`${API_BASE_URL}/admin/jobs?${params}`);
        if (!res.ok) return { count: "--", avgSalary: null };
        const data = await res.json();
        const pageData = data?.jobs ? data.jobs : data;
        return {
          count: pageData.totalElements ?? "--",
          avgSalary: data.avgSalary ?? null,
        };
      } catch {
        return { count: "--", avgSalary: null };
      }
    };

    try {
      const [all, open, closed] = await Promise.all([
        fetchStatCount(null),
        fetchStatCount("OPEN"),
        fetchStatCount("CLOSED"),
      ]);
      setStats({
        total: all.count,
        open: open.count,
        closed: closed.count,
        avgSalary: all.avgSalary,
      });
    } catch (err) {
      console.error("Stats load error:", err);
    }
  }, [authFetch]);

  // Load Jobs Table
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("size", perPage);
      params.set("direction", "desc");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);

      const res = await authFetch(`${API_BASE_URL}/admin/jobs?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const pageData = data?.jobs ? data.jobs : data;
      const content = Array.isArray(pageData)
        ? pageData
        : pageData.content || [];

      setTotalPages(pageData.totalPages ?? 1);
      setTotalElements(pageData.totalElements ?? content.length);
      setJobs(content);
    } catch (err) {
      console.error("Jobs load error:", err);
      setError(
        "Failed to load jobs. Please check your connection and try refreshing.",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Helpers
  const formatSalary = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 100000)
      return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L";
    return "₹" + n.toLocaleString("en-IN");
  };

  const formatDate = (d) => {
    return d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  };

  const getStatusConfig = (status) => {
    const map = {
      OPEN: {
        bg: "bg-[#f0fdf4]",
        text: "text-[#16a34a]",
        dot: "bg-[#22c55e]",
        label: "Open",
      },
      CLOSED: {
        bg: "bg-[#fef2f2]",
        text: "text-[#dc2626]",
        dot: "bg-[#ef4444]",
        label: "Closed",
      },
      PAUSED: {
        bg: "bg-[#fffbeb]",
        text: "text-[#d97706]",
        dot: "bg-[#f59e0b]",
        label: "Paused",
      },
      DRAFT: {
        bg: "bg-[#f8fafc]",
        text: "text-[#64748b]",
        dot: "bg-[#94a3b8]",
        label: "Draft",
      },
    };
    return map[status] || map.DRAFT;
  };

  const StatusPill = ({ status }) => {
    const cfg = getStatusConfig(status || "");
    return (
      <span
        className={`inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  // Pagination Logic
  const renderPaginationBtns = () => {
    if (totalPages <= 1) return null;
    const visible = new Set([0, totalPages - 1]);
    for (
      let i = Math.max(0, page - 2);
      i <= Math.min(totalPages - 1, page + 2);
      i++
    )
      visible.add(i);
    const sorted = [...visible].sort((a, b) => a - b);

    const btns = [];
    let prevP = null;

    sorted.forEach((p) => {
      if (prevP !== null && p - prevP > 1) {
        btns.push(
          <button
            key={`ellipsis-${p}`}
            disabled
            className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] text-[12.5px] font-semibold flex items-center justify-center opacity-40 cursor-not-allowed"
          >
            …
          </button>,
        );
      }
      btns.push(
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-[32px] h-[32px] rounded-[8px] border-[1.5px] text-[12.5px] font-semibold flex items-center justify-center transition-all font-['DM_Sans',sans-serif] ${
            p === page
              ? "bg-[#0d9488] border-[#0d9488] text-white"
              : "bg-[#f8fafc] text-[#64748b] border-[#e8ecf1] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] cursor-pointer"
          }`}
        >
          {p + 1}
        </button>,
      );
      prevP = p;
    });

    return (
      <>
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {btns}
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] flex items-center justify-center transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </>
    );
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
  };

  const handleStatCardClick = (status) => {
    setSearchInput("");
    setStatusFilter(status === "ALL" ? "" : status);
    window.scrollTo({
      top: document.querySelector(".table-card")?.offsetTop - 80,
      behavior: "smooth",
    });
  };

  const offset = page * perPage;

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#0f172a] relative">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">
              Jobs Management
            </p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSubAdmin && (
              <div className="inline-flex items-center gap-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-xs font-semibold px-3.5 py-1.5 rounded-full">
                <ShieldAlert size={14} /> Sub Admin Mode
              </div>
            )}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-white border border-[#e8ecf1] rounded-full pl-3 pr-2.5 py-1.5 text-sm font-semibold text-[#0f172a] cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[rgba(13,148,136,0.3)]"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white text-xs font-bold flex items-center justify-center">
                {(user?.fullName || user?.username || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span>{user?.fullName || user?.username || "Admin"}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] px-[32px] py-[28px] mb-[24px] text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative z-10 flex items-center gap-2">
          <Briefcase size={22} className="fill-current" /> Jobs Overview
        </h4>
        <p className="text-[13.5px] text-white/55 m-0 relative z-10">
          Manage all job postings across the platform. Add, edit, or remove
          listings.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div
          onClick={() => handleStatCardClick("ALL")}
          className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] transition-all hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] relative overflow-hidden group cursor-pointer block"
        >
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">
                Total Jobs
              </div>
              <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">
                {stats.total}
              </div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">
                all postings
              </div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f5f3ff] text-[#8b5cf6]">
              <Briefcase size={20} className="fill-current" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#8b5cf6] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter
              size={12}
              className="transition-transform group-hover:translate-x-[3px]"
            />{" "}
            Show all
          </div>
        </div>

        <div
          onClick={() => handleStatCardClick("OPEN")}
          className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] transition-all hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] relative overflow-hidden group cursor-pointer block"
        >
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#22c55e] to-[#86efac]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">
                Open Jobs
              </div>
              <div className="text-[26px] font-extrabold text-[#16a34a] leading-none">
                {stats.open}
              </div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">
                accepting applications
              </div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f0fdf4] text-[#22c55e]">
              <DoorOpen size={20} className="fill-current" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#16a34a] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter
              size={12}
              className="transition-transform group-hover:translate-x-[3px]"
            />{" "}
            Filter open
          </div>
        </div>

        <div
          onClick={() => handleStatCardClick("CLOSED")}
          className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] transition-all hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] relative overflow-hidden group cursor-pointer block"
        >
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#ef4444] to-[#fca5a5]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">
                Closed Jobs
              </div>
              <div className="text-[26px] font-extrabold text-[#dc2626] leading-none">
                {stats.closed}
              </div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">
                no longer active
              </div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#fef2f2] text-[#ef4444]">
              <XCircle size={20} className="fill-current" />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#dc2626] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Filter
              size={12}
              className="transition-transform group-hover:translate-x-[3px]"
            />{" "}
            Filter closed
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] transition-all hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] relative overflow-hidden group cursor-pointer block">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">
                Avg Salary
              </div>
              <div className="text-[26px] font-extrabold text-[#f59e0b] leading-none">
                {stats.avgSalary !== null
                  ? formatSalary(Math.round(stats.avgSalary))
                  : "--"}
              </div>
              <div className="text-[12px] text-[#64748b] mt-[6px]">
                across all jobs
              </div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#fffbeb] text-[#f59e0b]">
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-[10px] text-[11px] font-semibold text-[#f59e0b] flex items-center gap-[5px] opacity-75 group-hover:opacity-100 group-hover:gap-[8px] transition-all">
            <Tag
              size={12}
              className="transition-transform group-hover:translate-x-[3px]"
            />{" "}
            View salary insights
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[16px_20px] mb-[20px] flex items-center gap-[12px] flex-wrap shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[10px] px-[14px] py-[8px] flex-1 min-w-[200px] transition-all focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] focus-within:border-[#0d9488]">
          <Search size={14} className="text-[#64748b] shrink-0" />
          <input
            type="text"
            placeholder="Search by title, company, location…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-[#0f172a] font-['DM_Sans',sans-serif] placeholder:text-[#aab]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border-[1.5px] border-[#e8ecf1] rounded-[10px] px-[14px] py-[8px] min-w-[140px] bg-[#f8fafc] text-[#0f172a] outline-none cursor-pointer font-['DM_Sans',sans-serif] transition-all focus:border-[#0d9488]"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-[7px] px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold cursor-pointer border-[1.5px] font-['DM_Sans',sans-serif] transition-all whitespace-nowrap bg-[#f8fafc] text-[#64748b] border-[#e8ecf1] hover:bg-[#e2e8f0] hover:text-[#0f172a]"
        >
          <XCircle size={14} /> Clear
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        <div className="px-[20px] py-[16px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <Briefcase size={16} className="text-[#0d9488] fill-current" /> All
            Job Listings
          </span>
          <span className="text-[12.5px] text-[#64748b] bg-[#f8fafc] border border-[#e8ecf1] rounded-full px-[12px] py-[4px]">
            {loading
              ? "Loading…"
              : `${totalElements} result${totalElements !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {[
                  "#",
                  "Job Title",
                  "Company",
                  "Category",
                  "Location",
                  "Salary",
                  "Status",
                  "Posted",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="py-[11px] px-[16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] whitespace-nowrap border-b border-[#f1f5f9]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-[60px] text-[#94a3b8]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2
                        size={18}
                        className="animate-spin text-[#0d9488]"
                      />{" "}
                      Loading jobs…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="text-center py-[60px]">
                    <div className="text-center p-[20px] text-[#94a3b8]">
                      <AlertCircle
                        size={48}
                        className="mx-auto mb-[12px] text-[#cbd5e1]"
                      />
                      <h6 className="text-[15px] text-[#64748b] m-0 mb-[6px] font-semibold">
                        Failed to load jobs
                      </h6>
                      <p className="text-[13px] m-0">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-[60px]">
                    <div className="text-center p-[20px] text-[#94a3b8]">
                      <Briefcase
                        size={48}
                        className="mx-auto mb-[12px] text-[#cbd5e1]"
                      />
                      <h6 className="text-[15px] text-[#64748b] m-0 mb-[6px] font-semibold">
                        No jobs found
                      </h6>
                      <p className="text-[13px] m-0">
                        Try adjusting your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job, i) => (
                  <tr
                    key={job.jobId}
                    className="hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-b-0 transition-colors"
                  >
                    <td className="py-[12px] px-[16px] text-[#64748b] text-[12px] align-middle">
                      {offset + i + 1}
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <div className="font-semibold text-[#0f172a] text-[13.5px]">
                        {job.title || "Untitled"}
                      </div>
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <div className="text-[13px] text-[#0f172a]">
                        {job.companyName || "—"}
                      </div>
                      <div className="text-[11.5px] text-[#94a3b8]">
                        {job.recruiterName || ""}
                      </div>
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      {job.categoryName ? (
                        <span className="inline-flex items-center gap-[6px] text-[13px] font-medium px-[12px] py-[5px] rounded-full bg-[#eff6ff] text-[#1d4ed8]">
                          <Tag size={10} className="fill-current" />
                          {job.categoryName}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8] text-[12px]">—</span>
                      )}
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <div className="flex items-center gap-[5px] text-[13px] text-[#64748b]">
                        <MapPin size={12} className="text-[#94a3b8]" />
                        {job.location || "—"}
                      </div>
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <span className="text-[13px] font-bold text-[#0d9488]">
                        {formatSalary(job.salary)}
                      </span>
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <StatusPill status={job.status || job.jobStatus} />
                    </td>
                    <td className="py-[12px] px-[16px] text-[12.5px] text-[#94a3b8] align-middle">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="py-[12px] px-[16px] align-middle">
                      <button
                        onClick={() => setViewJobData(job)}
                        title="View Details"
                        className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] cursor-pointer transition-all hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)]"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Wrap */}
        <div className="flex items-center justify-between px-[20px] py-[14px] border-t border-[#f1f5f9] flex-wrap gap-[10px]">
          <span className="text-[13px] text-[#64748b]">
            {totalElements === 0
              ? "No results"
              : `Showing ${offset + 1}–${Math.min(offset + perPage, totalElements)} of ${totalElements} jobs`}
          </span>
          <div className="flex gap-[4px]">{renderPaginationBtns()}</div>
        </div>
      </div>

      {/* View Job Modal */}
      {viewJobData && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
          onClick={() => setViewJobData(null)}
        >
          <div
            className="bg-white w-full max-w-[760px] rounded-[20px] overflow-hidden shadow-[0_24px_64px_rgba(11,34,57,0.18)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0b2239] px-[24px] py-[20px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)]" />
              <div className="relative z-10">
                <p className="text-[17px] font-extrabold text-white m-0">
                  {viewJobData.title || "Untitled Job"}
                </p>
                <p className="text-[12.5px] text-white/50 m-0 mt-[3px]">
                  {viewJobData.companyName || "—"}
                </p>
              </div>
              <button
                onClick={() => setViewJobData(null)}
                className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.15)] hover:text-white relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-[24px] bg-white overflow-y-auto">
              <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] m-[0_0_14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                Basic Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[16px]">
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Status
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    <StatusPill
                      status={viewJobData.status || viewJobData.jobStatus}
                    />
                  </div>
                </div>
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Category
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    {viewJobData.categoryName ? (
                      <span className="inline-flex items-center gap-[6px] text-[13px] font-medium px-[12px] py-[5px] rounded-full bg-[#eff6ff] text-[#1d4ed8]">
                        <Tag size={10} className="fill-current" />
                        {viewJobData.categoryName}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8] text-[12px]">—</span>
                    )}
                  </div>
                </div>
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Location
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    {viewJobData.location || "—"}
                  </div>
                </div>
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Annual Salary
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    <span className="text-[13px] font-bold text-[#0d9488]">
                      {formatSalary(viewJobData.salary)}
                    </span>
                  </div>
                </div>
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Recruiter
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    {viewJobData.recruiterName || "—"}
                  </div>
                </div>
                <div className="mb-[2px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Posted On
                  </div>
                  <div className="text-[14px] text-[#0f172a]">
                    {formatDate(viewJobData.createdAt)}
                  </div>
                </div>
              </div>

              {viewJobData.companyDescription && (
                <div className="mb-[16px]">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[5px]">
                    Company Description
                  </div>
                  <div className="text-[14px] text-[#0f172a] leading-relaxed">
                    {viewJobData.companyDescription}
                  </div>
                </div>
              )}

              <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] m-[0_0_14px] mt-[20px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                Job Description
              </div>
              <div
                className="border border-[#e8ecf1] rounded-[10px] p-[14px_16px] bg-[#f8fafc] text-[13.5px] leading-[1.65] text-[#0f172a] [&_ul]:pl-[20px] [&_ul]:my-[6px] [&_li]:mb-[4px] [&_p]:m-[0_0_8px]"
                dangerouslySetInnerHTML={{
                  __html:
                    viewJobData.description ||
                    "<span style='color:#94a3b8;'>No description provided.</span>",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
