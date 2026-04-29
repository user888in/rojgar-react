import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Bookmark,
  Plus,
  Search,
  Pencil,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Image as ImageIcon,
  CloudUpload,
  ChevronDown,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

const AdminBlog = () => {
  const { authFetch, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  const isSubAdmin = user?.role === "SUB_ADMIN";

  // Data State
  const [allBlogs, setAllBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    total: "--",
    published: "--",
    draft: "--",
    cats: "--",
  });

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Modals
  const initialFormState = {
    title: "",
    slug: "",
    categoryId: "",
    status: "DRAFT",
    description: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    schemaMarkup: "",
  };
  const [formModal, setFormModal] = useState({
    open: false,
    isEdit: false,
    id: null,
    activeTab: "content",
    saving: false,
  });
  const [formData, setFormData] = useState({ ...initialFormState });

  const [pendingImages, setPendingImages] = useState([]); // { file, dataUrl }
  const [existingImages, setExistingImages] = useState([]); // { id, imageUrl }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [viewModal, setViewModal] = useState({
    open: false,
    data: null,
    loading: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    title: "",
    deleting: false,
  });

  // Editor modules
  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blogsRes, catsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/public/blogs?size=1000`),
        authFetch(`${API_BASE_URL}/public/blog-categories`),
      ]);

      if (!blogsRes.ok || !catsRes.ok) throw new Error("Failed to load data");

      const blogsData = await blogsRes.json();
      const catsData = await catsRes.json();

      const blogs = blogsData.content || blogsData || [];
      const cats = Array.isArray(catsData) ? catsData : catsData.content || [];

      setAllBlogs(blogs);
      setFilteredBlogs(blogs);
      setCategories(cats);

      setStats({
        total: blogs.length,
        published: blogs.filter((b) => b.status === "PUBLISHED").length,
        draft: blogs.filter((b) => b.status === "DRAFT").length,
        cats: cats.length,
      });
    } catch (err) {
      console.error("Load error:", err);
      setError(
        "Failed to load blogs. Please check your connection and try refreshing.",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply Filters
  useEffect(() => {
    let result = allBlogs;
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    const kw = debouncedSearch.toLowerCase().trim();
    if (kw) {
      result = result.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(kw) ||
          (b.slug || "").toLowerCase().includes(kw) ||
          (b.categoryName || "").toLowerCase().includes(kw),
      );
    }
    setFilteredBlogs(result);
    setPage(1);
  }, [debouncedSearch, statusFilter, allBlogs]);

  // Handlers
  const handleAutoSlug = (title) => {
    if (formModal.isEdit) return;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData((f) => ({ ...f, title, slug, metaTitle: title.slice(0, 60) }));
  };

  const handleImageSelect = (files) => {
    const MAX_BYTES = 10 * 1024 * 1024;
    const rejected = [];
    const validFiles = [];

    Array.from(files).forEach((f) => {
      if (f.size > MAX_BYTES) {
        rejected.push(f.name);
      } else {
        validFiles.push(f);
      }
    });

    if (rejected.length) {
      addToast(
        `${rejected.length} file(s) rejected — max size is 10 MB: ${rejected.join(", ")}`,
        "danger",
      );
    }

    validFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingImages((prev) => [
          ...prev,
          { file: f, dataUrl: e.target.result },
        ]);
      };
      reader.readAsDataURL(f);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImg = (index) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/admin/blog/images/${imageId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
      addToast("Image deleted", "success");
      loadData(); // refresh table thumbs
    } catch {
      addToast("Failed to delete image", "danger");
    }
  };

  const openCreateModal = () => {
    setFormData({ ...initialFormState });
    setPendingImages([]);
    setExistingImages([]);
    setFormModal({
      open: true,
      isEdit: false,
      id: null,
      activeTab: "content",
      saving: false,
    });
  };

  const openEditModal = async (id) => {
    setFormModal({
      open: true,
      isEdit: true,
      id,
      activeTab: "content",
      saving: false,
    });
    setPendingImages([]);
    setExistingImages([]);

    // Using a temp loading state for the form, though we already show it opens immediately
    try {
      const res = await authFetch(`${API_BASE_URL}/public/blogs/${id}`);
      if (!res.ok) throw new Error();
      const b = await res.json();

      setFormData({
        title: b.title || "",
        slug: b.slug || "",
        categoryId: b.categoryId || "",
        status: b.status || "DRAFT",
        description: b.description || "",
        metaTitle: b.metaTitle || "",
        metaDescription: b.metaDescription || "",
        metaKeywords: b.metaKeywords || "",
        canonicalUrl: b.canonicalUrl || "",
        schemaMarkup: b.schemaMarkup || "",
      });
      setExistingImages(b.images || []);
    } catch {
      addToast("Failed to load blog data", "danger");
      setFormModal((prev) => ({ ...prev, open: false }));
    }
  };

  const saveBlog = async () => {
    const {
      title,
      slug,
      categoryId,
      description,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      schemaMarkup,
    } = formData;

    // Description check (Quill empty is '<p><br></p>')
    const cleanDesc = description.replace(/<[^>]*>?/gm, "").trim();

    if (
      !title.trim() ||
      !slug.trim() ||
      !categoryId ||
      !cleanDesc ||
      !metaTitle.trim() ||
      !metaDescription.trim()
    ) {
      addToast(
        "Please fill all required fields (Content + SEO tabs)",
        "warning",
      );
      return;
    }

    setFormModal((prev) => ({ ...prev, saving: true }));

    const payload = {
      title,
      slug,
      categoryId: parseInt(categoryId),
      description,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      schemaMarkup,
    };

    const submitData = new FormData();
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    submitData.append("data", blob);
    pendingImages.forEach((img) => submitData.append("images", img.file));

    try {
      const url = formModal.isEdit
        ? `${API_BASE_URL}/admin/blog/update/${formModal.id}`
        : `${API_BASE_URL}/admin/blog/create`;
      const method = formModal.isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: submitData,
      });

      if (!res.ok) {
        let errMsg = "Failed to save blog";
        try {
          const e = await res.json();
          errMsg = e.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      setFormModal((prev) => ({ ...prev, open: false }));
      addToast(
        formModal.isEdit
          ? "Blog updated successfully"
          : "Blog published successfully",
      );
      loadData();
    } catch (err) {
      addToast(err.message, "danger");
    } finally {
      setFormModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const openViewModal = async (id) => {
    setViewModal({ open: true, data: null, loading: true });
    try {
      const res = await authFetch(`${API_BASE_URL}/public/blogs/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViewModal({ open: true, data, loading: false });
    } catch {
      addToast("Failed to load blog", "danger");
      setViewModal({ open: false, data: null, loading: false });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));
    try {
      const res = await authFetch(
        `${API_BASE_URL}/admin/blog/delete/${deleteModal.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setDeleteModal({ open: false, id: null, title: "", deleting: false });
      addToast("Blog deleted", "warning");
      loadData();
    } catch {
      addToast("Failed to delete blog", "danger");
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Render Helpers
  const formatDate = (d) => {
    return d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  };

  const getStatusPill = (status) => {
    const s = status || "DRAFT";
    if (s === "PUBLISHED")
      return (
        <span className="inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" />
          Published
        </span>
      );
    if (s === "DRAFT")
      return (
        <span className="inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#f8fafc] text-[#64748b]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#94a3b8] shrink-0" />
          Draft
        </span>
      );
    if (s === "ARCHIVED")
      return (
        <span className="inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold bg-[#fef2f2] text-[#dc2626]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#ef4444] shrink-0" />
          Archived
        </span>
      );
    return null;
  };

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, filteredBlogs.length);
  const currentData = filteredBlogs.slice(start, end);

  const renderPaginationBtns = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1))
        pages.push(i);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }

    return (
      <div className="flex gap-[6px]">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] flex items-center justify-center hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`dots-${idx}`}
              className="flex items-center px-[4px] text-[#94a3b8] text-[12.5px]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-[32px] h-[32px] rounded-[8px] border-[1.5px] text-[12.5px] font-semibold flex items-center justify-center transition-all ${p === page ? "bg-[#0d9488] border-[#0d9488] text-white" : "bg-white border-[#e8ecf1] text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488]"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="w-[32px] h-[32px] rounded-[8px] border-[1.5px] border-[#e8ecf1] bg-white text-[#64748b] flex items-center justify-center hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#0f172a] relative min-h-[80vh]">
      {/* Topbar */}
      <div
        className="sticky top-0 z-[100] bg-white px-8 py-4 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-b border-[#e8ecf1]"
        style={{
          marginLeft: "-32px",
          marginRight: "-32px",
          marginTop: "-32px",
          paddingLeft: "32px",
          paddingRight: "32px",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">
              Blog Management
            </p>
            <p className="text-[13px] text-[#64748b] m-0 mt-0.5">
              Create, edit and publish blog articles across the platform
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

      {/* Toast Container */}
      <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[8px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-[10px] p-[12px_18px] rounded-[12px] text-white text-[13.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[240px] max-w-[300px] border-l-[3px] border-white/30 animate-[slideDown_0.25s_ease] ${t.type === "success" ? "bg-[#15803d]" : t.type === "warning" ? "bg-[#b45309]" : "bg-[#b91c1c]"}`}
          >
            {t.type === "success" && <CheckCircle size={18} />}
            {t.type === "warning" && <AlertTriangle size={18} />}
            {t.type === "danger" && <XCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] px-[32px] py-[28px] mb-[24px] text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative z-10 flex items-center gap-2">
          <Pencil size={22} className="fill-current" /> Blog Management
        </h4>
        <p className="text-[13.5px] text-white/55 m-0 relative z-10">
          Create and manage blog articles, SEO metadata, images and publishing
          status
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[24px]">
        {[
          {
            label: "Total Blogs",
            val: stats.total,
            icon: FileText,
            color: "text-[#0d9488]",
            bg: "bg-[rgba(13,148,136,0.1)]",
            grad: "from-[#0d9488] to-[#14b8a6]",
          },
          {
            label: "Published",
            val: stats.published,
            icon: CheckCircle2,
            color: "text-[#22c55e]",
            bg: "bg-[#f0fdf4]",
            grad: "from-[#22c55e] to-[#86efac]",
          },
          {
            label: "Drafts",
            val: stats.draft,
            icon: FileText,
            color: "text-[#0ea5e9]",
            bg: "bg-[#f0f9ff]",
            grad: "from-[#0ea5e9] to-[#7dd3fc]",
          },
          {
            label: "Categories",
            val: stats.cats,
            icon: Bookmark,
            color: "text-[#8b5cf6]",
            bg: "bg-[#f5f3ff]",
            grad: "from-[#8b5cf6] to-[#c4b5fd]",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200"
          >
            <div
              className={`absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r ${s.grad}`}
            />
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] text-[#64748b] mb-[4px]">
                  {s.label}
                </div>
                <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">
                  {s.val}
                </div>
              </div>
              <div
                className={`w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] ${s.bg} ${s.color}`}
              >
                <s.icon size={20} className={i === 1 ? "fill-current" : ""} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isSubAdmin && (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[14px] p-[12px_16px] mb-[18px] text-[13px] text-[#92400e] flex items-center gap-[8px]">
          <Info size={16} className="text-[#d97706] fill-current" />
          <span>
            You have <strong>view-only</strong> access. Contact an Admin to
            create or modify blogs.
          </span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        {/* Header & Filters */}
        <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <Pencil size={16} className="text-[#0d9488]" /> All Blog Posts
          </span>
          <div className="flex items-center gap-[10px] flex-wrap">
            <div className="flex gap-[6px]">
              {[
                { id: "all", label: "All", pill: null },
                { id: "PUBLISHED", label: "Published", pill: "bg-[#22c55e]" },
                { id: "DRAFT", label: "Draft", pill: "bg-[#94a3b8]" },
                { id: "ARCHIVED", label: "Archived", pill: "bg-[#ef4444]" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`inline-flex items-center gap-[5px] px-[14px] py-[5px] rounded-full text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] ${
                    statusFilter === f.id
                      ? f.id === "PUBLISHED"
                        ? "border-[#22c55e] text-[#16a34a] bg-[#f0fdf4]"
                        : f.id === "ARCHIVED"
                          ? "border-[#ef4444] text-[#dc2626] bg-[#fef2f2]"
                          : f.id === "DRAFT"
                            ? "border-[#94a3b8] text-[#64748b] bg-[#f8fafc]"
                            : "border-[#0d9488] text-[#0d9488] bg-[rgba(13,148,136,0.07)]"
                      : "border-[#e8ecf1] bg-[#f8fafc] text-[#64748b] hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.07)]"
                  }`}
                >
                  {f.pill && (
                    <span
                      className={`w-[6px] h-[6px] rounded-full ${f.pill}`}
                    />
                  )}{" "}
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] transition-all focus-within:border-[#0d9488]">
              <Search size={13} className="text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search blogs…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] font-['DM_Sans',sans-serif] text-[#0f172a] placeholder-[#aab] w-[140px]"
              />
            </div>

            {!isSubAdmin && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-[6px] px-[18px] py-[8px] bg-[#0d9488] text-white border-none rounded-[99px] text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)]"
              >
                <Plus size={14} /> New Blog
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                {[
                  "#",
                  "Blog Post",
                  "Category",
                  "Author",
                  "Status",
                  "Date",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] border-b border-[#f1f5f9] whitespace-nowrap ${i === 0 ? "w-[40px]" : ""}`}
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
                    colSpan="7"
                    className="text-center p-[40px] text-[#94a3b8]"
                  >
                    <Loader2
                      size={24}
                      className="animate-spin text-[#0d9488] mx-auto"
                    />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-[32px] text-[#dc2626]"
                  >
                    <AlertTriangle
                      size={28}
                      className="mx-auto mb-2 text-[#ef4444]"
                    />
                    {error}
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-[48px] text-[#94a3b8]"
                  >
                    <FileText
                      size={36}
                      className="mx-auto mb-2 text-[#cbd5e1]"
                    />
                    No blogs found.
                  </td>
                </tr>
              ) : (
                currentData.map((b, i) => {
                  const img = b.images && b.images[0];
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-[#fafbfc] transition-colors border-b border-[#f1f5f9] last:border-0"
                    >
                      <td className="p-[12px_16px] text-[#64748b] align-middle">
                        {start + i + 1}
                      </td>
                      <td className="p-[12px_16px] align-middle">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[52px] h-[42px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#0b2239] to-[#1a3a5c] flex items-center justify-center text-white/30 shrink-0 border border-[#e8ecf1]">
                            {img ? (
                              <img
                                src={img.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={18} />
                            )}
                          </div>
                          <div className="max-w-[240px]">
                            <span className="block text-[13.5px] font-semibold text-[#0f172a] truncate max-w-[220px]">
                              {b.title || "—"}
                            </span>
                            <span className="block text-[11px] text-[#94a3b8] font-mono truncate max-w-[220px]">
                              /blog/{b.slug || ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-[12px_16px] align-middle">
                        <span className="inline-flex items-center gap-[6px] px-[12px] py-[5px] rounded-[20px] text-[13px] font-medium bg-[#eff6ff] text-[#1d4ed8] whitespace-nowrap">
                          <Bookmark size={12} className="fill-current" />
                          {b.categoryName || "—"}
                        </span>
                      </td>
                      <td className="p-[12px_16px] text-[#64748b] text-[12.5px] align-middle">
                        {b.authorName || "—"}
                      </td>
                      <td className="p-[12px_16px] align-middle">
                        {getStatusPill(b.status)}
                      </td>
                      <td className="p-[12px_16px] text-[#94a3b8] text-[12px] align-middle whitespace-nowrap">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="p-[12px_16px] align-middle">
                        {isSubAdmin ? (
                          <button
                            onClick={() => openViewModal(b.id)}
                            className="w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] flex items-center justify-center hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] transition-all"
                          >
                            <Eye size={14} />
                          </button>
                        ) : (
                          <div className="flex gap-[6px] flex-wrap">
                            <button
                              onClick={() => openViewModal(b.id)}
                              className="w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] flex items-center justify-center hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] transition-all"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openEditModal(b.id)}
                              className="inline-flex items-center gap-[5px] px-[12px] py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] border-[#fde68a] bg-[#fffbeb] text-[#d97706] hover:bg-[#d97706] hover:text-white transition-all whitespace-nowrap"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  id: b.id,
                                  title: b.title,
                                  deleting: false,
                                })
                              }
                              className="w-[32px] h-[32px] rounded-[8px] bg-[#f8fafc] text-[#64748b] border-[1.5px] border-[#e8ecf1] flex items-center justify-center hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-[14px_20px] border-t border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <div className="text-[13px] text-[#64748b]">
            {filteredBlogs.length === 0
              ? "No results found"
              : `Showing ${start + 1}–${end} of ${filteredBlogs.length} blogs`}
          </div>
          <nav>{renderPaginationBtns()}</nav>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {formModal.open && (
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-2 sm:p-4"
          onClick={() =>
            !formModal.saving &&
            setFormModal((prev) => ({ ...prev, open: false }))
          }
        >
          <div
            className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] w-full max-w-[820px] flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0b2239] px-[24px] py-[20px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] border-2 border-white/15 shrink-0">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">
                    {formModal.isEdit ? "Edit Blog Post" : "New Blog Post"}
                  </p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">
                    {formModal.isEdit
                      ? `/${formData.slug}`
                      : "Fill in all required fields and publish"}
                  </p>
                </div>
              </div>
              <button
                disabled={formModal.saving}
                onClick={() =>
                  setFormModal((prev) => ({ ...prev, open: false }))
                }
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white relative z-10 disabled:opacity-50 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-[24px] border-b border-[#e8ecf1] bg-[#fafbfc] shrink-0">
              {[
                { id: "content", label: "Content", icon: Pencil },
                { id: "seo", label: "SEO", icon: Search },
                { id: "images", label: "Images", icon: ImageIcon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    setFormModal((prev) => ({ ...prev, activeTab: t.id }))
                  }
                  className={`flex items-center gap-[6px] px-[18px] py-[13px] text-[13px] font-medium cursor-pointer border-none bg-transparent border-b-2 transition-all font-['DM_Sans',sans-serif] ${formModal.activeTab === t.id ? "text-[#0d9488] border-[#0d9488] font-semibold" : "text-[#64748b] border-transparent hover:text-[#0f172a]"}`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-[24px] overflow-y-auto bg-white flex-1">
              {/* CONTENT TAB */}
              <div
                className={
                  formModal.activeTab === "content" ? "block" : "hidden"
                }
              >
                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px] mb-[16px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Basic Info
                  </div>
                  <div className="mb-[16px]">
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Title <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleAutoSlug(e.target.value)}
                      placeholder="e.g. 10 Resume Mistakes That Cost You the Interview"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                    <div className="text-[11px] text-right mt-[4px]">
                      <span
                        className={
                          formData.title.length > 120
                            ? "text-[#dc2626]"
                            : "text-[#94a3b8]"
                        }
                      >
                        {formData.title.length}
                      </span>
                      /120
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                    <div>
                      <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                        Category <span className="text-[#dc2626]">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            categoryId: e.target.value,
                          }))
                        }
                        className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] cursor-pointer"
                      >
                        <option value="">Select category…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, status: e.target.value }))
                        }
                        className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] cursor-pointer"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Content
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Description / Body{" "}
                      <span className="text-[#dc2626]">*</span>
                    </label>
                    <div className="[&_.ql-toolbar]:border-[#e8ecf1] [&_.ql-toolbar]:rounded-t-[10px] [&_.ql-toolbar]:bg-[#f0f4f8] [&_.ql-container]:border-[#e8ecf1] [&_.ql-container]:rounded-b-[10px] [&_.ql-container]:bg-white [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-[#0f172a] [&_.ql-editor]:font-['DM_Sans',sans-serif] [&_.ql-container]:transition-all focus-within:[&_.ql-container]:border-[#0d9488] focus-within:[&_.ql-container]:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]">
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(val) =>
                          setFormData((f) => ({ ...f, description: val }))
                        }
                        modules={quillModules}
                        placeholder="Write the full blog content here…"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO TAB */}
              <div
                className={formModal.activeTab === "seo" ? "block" : "hidden"}
              >
                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px] mb-[16px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    URL & Slug
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Slug <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, slug: e.target.value }))
                      }
                      placeholder="e.g. resume-mistakes-interview"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                    <div className="text-[12px] text-[#64748b] mt-[5px]">
                      URL-friendly identifier. Auto-generated from title but
                      editable.
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px] mb-[16px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Meta Tags
                  </div>
                  <div className="mb-[16px]">
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Meta Title <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          metaTitle: e.target.value,
                        }))
                      }
                      placeholder="SEO page title (50–60 chars recommended)"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                    <div className="text-[11px] text-right mt-[4px]">
                      <span
                        className={
                          formData.metaTitle.length > 60
                            ? "text-[#dc2626]"
                            : "text-[#94a3b8]"
                        }
                      >
                        {formData.metaTitle.length}
                      </span>
                      /60
                    </div>
                  </div>
                  <div className="mb-[16px]">
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Meta Description <span className="text-[#dc2626]">*</span>
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          metaDescription: e.target.value,
                        }))
                      }
                      rows="3"
                      placeholder="Brief summary shown in search results (150–160 chars)"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] resize-y min-h-[90px]"
                    />
                    <div className="text-[11px] text-right mt-[4px]">
                      <span
                        className={
                          formData.metaDescription.length > 160
                            ? "text-[#dc2626]"
                            : "text-[#94a3b8]"
                        }
                      >
                        {formData.metaDescription.length}
                      </span>
                      /160
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          metaKeywords: e.target.value,
                        }))
                      }
                      placeholder="resume tips, interview prep (comma separated)"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Advanced SEO
                  </div>
                  <div className="mb-[16px]">
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      value={formData.canonicalUrl}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          canonicalUrl: e.target.value,
                        }))
                      }
                      placeholder="https://rojgarshine.com/blog/slug"
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                      Schema Markup (JSON-LD)
                    </label>
                    <textarea
                      value={formData.schemaMarkup}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          schemaMarkup: e.target.value,
                        }))
                      }
                      rows="3"
                      placeholder='{"@type": "Article", ...}'
                      className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)] resize-y min-h-[90px]"
                    />
                  </div>
                </div>
              </div>

              {/* IMAGES TAB */}
              <div
                className={
                  formModal.activeTab === "images" ? "block" : "hidden"
                }
              >
                <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px] mb-[16px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                    Upload Images
                  </div>
                  <div
                    className={`border-2 border-dashed rounded-[12px] p-[20px] text-center cursor-pointer transition-all ${dragOver ? "border-[#0d9488] bg-[rgba(13,148,136,0.04)]" : "border-[#e8ecf1] bg-[#f8fafc] hover:border-[#0d9488] hover:bg-[rgba(13,148,136,0.04)]"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleImageSelect(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageSelect(e.target.files)}
                    />
                    <CloudUpload
                      size={28}
                      className="text-[#94a3b8] mx-auto mb-[8px]"
                    />
                    <div className="text-[13px] font-semibold text-[#0f172a]">
                      Drop images here or click to browse
                    </div>
                    <div className="text-[12px] text-[#94a3b8] mt-[4px]">
                      PNG, JPG, WEBP — total Max 10 MB
                    </div>
                  </div>

                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-[8px] mt-[10px]">
                      {pendingImages.map((img, i) => (
                        <div
                          key={i}
                          className="relative w-[72px] h-[60px] rounded-[8px] overflow-hidden border-[1.5px] border-[#e8ecf1]"
                        >
                          <img
                            src={img.dataUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePendingImg(i)}
                            className="absolute top-[2px] right-[2px] bg-black/60 text-white border-none rounded-full w-[18px] h-[18px] text-[10px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#dc2626]"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {existingImages.length > 0 && (
                  <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px_18px]">
                    <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[14px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#e8ecf1]">
                      Existing Images
                    </div>
                    <div className="flex flex-wrap gap-[8px]">
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative w-[72px] h-[60px] rounded-[8px] overflow-hidden border-[1.5px] border-[#e8ecf1]"
                        >
                          <img
                            src={img.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => deleteExistingImage(img.id)}
                            className="absolute top-[2px] right-[2px] bg-black/60 text-white border-none rounded-full w-[18px] h-[18px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#dc2626]"
                            title="Delete"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-[16px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                disabled={formModal.saving}
                onClick={() =>
                  setFormModal((prev) => ({ ...prev, open: false }))
                }
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={formModal.saving}
                onClick={saveBlog}
                className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
              >
                {formModal.saving && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {formModal.saving
                  ? formModal.isEdit
                    ? "Saving…"
                    : "Publishing…"
                  : formModal.isEdit
                    ? "Save Changes"
                    : "Publish Blog"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModal.open && (
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-2 sm:p-4"
          onClick={() =>
            setViewModal({ open: false, data: null, loading: false })
          }
        >
          <div
            className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] w-full max-w-[720px] flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0b2239] px-[24px] py-[20px] flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] border-2 border-white/15 shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">
                    Blog Preview
                  </p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">
                    /blog/{viewModal.data?.slug || "slug"}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setViewModal({ open: false, data: null, loading: false })
                }
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white relative z-10 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-[20px_24px] overflow-y-auto bg-white flex-1">
              {viewModal.loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#64748b]">
                  <Loader2
                    size={30}
                    className="animate-spin text-[#0d9488] mb-2"
                  />{" "}
                  Loading preview…
                </div>
              ) : viewModal.data ? (
                <>
                  {viewModal.data.images?.length > 0 && (
                    <div className="mb-[12px]">
                      {viewModal.data.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.imageUrl}
                          alt=""
                          className="w-full max-h-[220px] object-cover rounded-[10px] mb-[8px] border border-[#e8ecf1]"
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
                    <div>
                      <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[4px]">
                        Category
                      </div>
                      <div className="text-[13.5px] text-[#0f172a]">
                        {viewModal.data.categoryName || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[4px]">
                        Status
                      </div>
                      {getStatusPill(viewModal.data.status)}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[4px]">
                        Author
                      </div>
                      <div className="text-[13.5px] text-[#0f172a]">
                        {viewModal.data.authorName || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[4px]">
                        Published
                      </div>
                      <div className="text-[13.5px] text-[#0f172a]">
                        {formatDate(viewModal.data.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[8px] mt-[14px]">
                    Description
                  </div>
                  <div
                    className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[16px] text-[13.5px] leading-[1.7] text-[#0f172a] max-h-[280px] overflow-y-auto [&_ul]:pl-[20px] [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-md [&_h2]:font-bold"
                    dangerouslySetInnerHTML={{
                      __html: viewModal.data.description || "—",
                    }}
                  />

                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-[8px] mt-[14px]">
                    SEO
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e8ecf1] rounded-[10px] p-[14px] text-[12.5px] text-[#0f172a] flex flex-col gap-[6px]">
                    <div>
                      <b>Meta Title:</b> {viewModal.data.metaTitle || "—"}
                    </div>
                    <div>
                      <b>Meta Description:</b>{" "}
                      {viewModal.data.metaDescription || "—"}
                    </div>
                    {viewModal.data.metaKeywords && (
                      <div>
                        <b>Keywords:</b> {viewModal.data.metaKeywords}
                      </div>
                    )}
                    {viewModal.data.canonicalUrl && (
                      <div className="break-all">
                        <b>Canonical:</b>{" "}
                        <a
                          href={viewModal.data.canonicalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0d9488] hover:underline"
                        >
                          {viewModal.data.canonicalUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-[#ef4444] py-10">
                  Failed to load preview data.
                </div>
              )}
            </div>

            <div className="p-[16px_24px] border-t border-[#e8ecf1] bg-[#fafbfc] flex justify-end gap-[10px] shrink-0">
              <button
                onClick={() =>
                  setViewModal({ open: false, data: null, loading: false })
                }
                className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all"
              >
                Close
              </button>
              {!isSubAdmin && (
                <button
                  onClick={() => {
                    setViewModal({ open: false, data: null, loading: false });
                    setTimeout(() => openEditModal(viewModal.data.id), 200);
                  }}
                  className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all"
                >
                  <Pencil size={14} /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.open && (
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
          onClick={() =>
            !deleteModal.deleting &&
            setDeleteModal((prev) => ({ ...prev, open: false }))
          }
        >
          <div
            className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#b91c1c] p-[20px_24px] flex items-center justify-between">
              <div className="flex items-center gap-[12px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-white/15 flex items-center justify-center text-white text-[18px]">
                  <Trash2 size={20} className="fill-current" />
                </div>
                <div>
                  <p className="text-[15px] font-extrabold text-white m-0">
                    Delete Blog Post
                  </p>
                  <p className="text-[12px] text-white/60 m-0 mt-[1px]">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                disabled={deleteModal.deleting}
                onClick={() =>
                  setDeleteModal((prev) => ({ ...prev, open: false }))
                }
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-[28px_24px] text-center">
              <AlertTriangle
                size={40}
                className="text-[#dc2626] mx-auto mb-[14px]"
              />
              <p className="text-[14px] text-[#0f172a] mb-[4px]">
                Are you sure you want to delete
              </p>
              <p className="text-[15px] font-bold text-[#dc2626] mb-[8px]">
                {deleteModal.title}
              </p>
              <p className="text-[12.5px] text-[#64748b] mb-[20px]">
                All associated images and SEO data will be permanently removed.
              </p>
              <div className="flex justify-center gap-[10px]">
                <button
                  disabled={deleteModal.deleting}
                  onClick={() =>
                    setDeleteModal((prev) => ({ ...prev, open: false }))
                  }
                  className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteModal.deleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#dc2626] text-white hover:bg-[#b91c1c] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(220,38,38,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {deleteModal.deleting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {deleteModal.deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
