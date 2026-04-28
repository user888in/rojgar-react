import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Tags,
  CalendarPlus,
  Star,
  Info,
  PlusCircle,
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

const AdminJobCategories = () => {
  const { authFetch, user } = useAuth();
  const { onOpenProfile } = useOutletContext() || {};
  
  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const fullName = user?.fullName || user?.username || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Data State
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: '--', month: '--', latest: '--' });

  // Add State
  const [addName, setAddName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Modal States
  const [editModal, setEditModal] = useState({ open: false, id: null, name: '', saving: false });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', deleting: false });

  // Toast State
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Compute Stats
  const computeStats = useCallback((categories) => {
    const total = categories.length;
    const now = new Date();
    const thisMonth = categories.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const latest = categories.length ? categories[categories.length - 1].categoryName : '—';
    setStats({ total, month: thisMonth, latest });
  }, []);

  // Fetch Categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/job-categories`);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setAllCategories(data);
      setFilteredCategories(data);
      computeStats(data);
    } catch (err) {
      console.error('Categories load error:', err);
      setError('Failed to load. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, computeStats]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter Data
  useEffect(() => {
    const kw = debouncedSearch.toLowerCase().trim();
    if (!kw) {
      setFilteredCategories(allCategories);
    } else {
      setFilteredCategories(allCategories.filter((c) => c.categoryName.toLowerCase().includes(kw)));
    }
    setPage(1);
  }, [debouncedSearch, allCategories]);

  // Actions
  const handleAddCategory = async () => {
    const name = addName.trim();
    if (!name) {
      addToast('Please enter a category name', 'warning');
      return;
    }
    setIsAdding(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/job-categories`, {
        method: 'POST',
        body: JSON.stringify({ categoryName: name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to add category');
      }
      setAddName('');
      setSearchInput('');
      addToast(`Category "${name}" added successfully`, 'success');
      await loadCategories();
    } catch (err) {
      addToast(err.message || 'Failed to add category', 'danger');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSave = async () => {
    const name = editModal.name.trim();
    if (!name) {
      addToast('Category name cannot be empty', 'warning');
      return;
    }
    setEditModal((prev) => ({ ...prev, saving: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/job-categories/${editModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ categoryName: name }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setEditModal({ open: false, id: null, name: '', saving: false });
      addToast('Category updated successfully', 'success');
      await loadCategories();
    } catch (err) {
      addToast(err.message || 'Failed to update', 'danger');
      setEditModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/job-categories/${deleteModal.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      setDeleteModal({ open: false, id: null, name: '', deleting: false });
      addToast('Category deleted', 'warning');
      await loadCategories();
    } catch (err) {
      addToast(err.message || 'Failed to delete', 'danger');
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Helpers
  const formatDate = (d) => {
    return d
      ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredCategories.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, filteredCategories.length);
  const currentData = filteredCategories.slice(start, end);

  const renderPaginationBtns = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        pages.push(i);
      }
    }

    const btns = [];
    let prev = null;
    for (const p of pages) {
      if (prev !== null && p - prev > 1) {
        btns.push(
          <li key={`ell-${p}`} className="disabled">
            <span className="flex px-[11px] py-[5px] text-[#cbd5e1] font-['DM_Sans',sans-serif] text-[13px]">…</span>
          </li>
        );
      }
      btns.push(
        <li key={p}>
          <button
            onClick={() => setPage(p)}
            className={`px-[11px] py-[5px] text-[13px] font-['DM_Sans',sans-serif] transition-all rounded-[4px] border border-transparent ${
              p === page
                ? 'bg-[#0b2239] text-white border-[#0b2239]'
                : 'text-[#0b2239] hover:bg-[#f1f5f9] border-[#e8ecf1]'
            }`}
          >
            {p}
          </button>
        </li>
      );
      prev = p;
    }

    return (
      <ul className="flex items-center gap-[2px] m-0 p-0 list-none">
        <li>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-[11px] py-[5px] text-[13px] text-[#0b2239] border border-[#e8ecf1] rounded-[4px] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            <ChevronLeft size={14} />
          </button>
        </li>
        {btns}
        <li>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-[11px] py-[5px] text-[13px] text-[#0b2239] border border-[#e8ecf1] rounded-[4px] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </li>
      </ul>
    );
  };

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#0f172a] relative min-h-[80vh]">
      {/* Topbar */}
      <div className="bg-white px-8 py-4 mb-6 shadow-sm border-b border-[#e8ecf1] sticky top-0 z-[100] -mx-8 -mt-8">
        <div className="flex justify-between items-end gap-4">
          <div>
            <p className="text-[20px] font-extrabold text-[#0f172a] m-0 leading-tight">Job Categories</p>
            <p className="text-[#64748b] text-[13px] mt-1 mb-0">Create and manage job categories used by recruiters</p>
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
                {initials}
              </div>
              <span>{fullName}</span>
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
            className={`flex items-center gap-[10px] p-[12px_18px] rounded-[12px] text-white text-[13.5px] font-['DM_Sans',sans-serif] shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[240px] border-l-[3px] border-white/30 animate-[slideDown_0.3s_ease] ${
              t.type === 'success' ? 'bg-[#15803d]' : t.type === 'warning' ? 'bg-[#b45309]' : 'bg-[#b91c1c]'
            }`}
          >
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'danger' && <XCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] rounded-[14px] px-[32px] py-[28px] mb-[24px] text-white">
        <div className="absolute -top-[60px] -right-[40px] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.25),transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[80px] left-[30%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
        <h4 className="font-extrabold text-[1.3rem] m-0 mb-1 relative z-10 flex items-center gap-2">
          <Tags size={22} className="fill-current" /> Job Categories
        </h4>
        <p className="text-[13.5px] text-white/55 m-0 relative z-10">
          Create and manage job categories used by recruiters across the platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[24px]">
        {/* Total Categories */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Total Categories</div>
              <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.total}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[rgba(13,148,136,0.1)] text-[#0d9488]">
              <Tags size={20} className="fill-current" />
            </div>
          </div>
        </div>

        {/* Added This Month */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#0ea5e9] to-[#7dd3fc]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Added This Month</div>
              <div className="text-[26px] font-extrabold text-[#0f172a] leading-none">{stats.month}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f0f9ff] text-[#0ea5e9]">
              <CalendarPlus size={20} />
            </div>
          </div>
        </div>

        {/* Latest Category */}
        <div className="bg-white rounded-[14px] p-[20px_22px] border border-[#e8ecf1] relative overflow-hidden group hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-200">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd]" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#64748b] mb-[4px]">Latest Category</div>
              <div className="text-[14px] font-extrabold text-[#0f172a] mt-[4px] leading-[1.3] truncate max-w-[120px]">{stats.latest}</div>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[20px] bg-[#f5f3ff] text-[#8b5cf6]">
              <Star size={20} className="fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Admin Notice OR Add Category Form */}
      {isSubAdmin ? (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[14px] p-[12px_16px] mb-[18px] text-[13px] color-[#92400e] flex items-center gap-[8px]">
          <Info size={16} className="text-[#d97706] fill-current" />
          <span>
            You have <strong>view-only</strong> access to categories. Contact an Admin to add, edit or delete categories.
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-[#e8ecf1] p-[20px_22px] mb-[20px] shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <div className="text-[13.5px] font-bold text-[#0f172a] mb-[16px] flex items-center gap-[7px]">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0d9488]">
              <Plus size={10} className="text-white" />
            </span>
            Add New Category
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-[12px] items-end">
            <div>
              <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                Category Name <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="e.g. Information Technology"
                className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
              />
            </div>
            <button
              onClick={handleAddCategory}
              disabled={isAdding}
              className="inline-flex items-center justify-center gap-[6px] px-[20px] py-[10px] bg-[#0d9488] text-white border-none rounded-[99px] text-[13.5px] font-semibold cursor-pointer transition-all hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none w-full md:w-auto h-[44px]"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isAdding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-[14px] border border-[#e8ecf1] overflow-hidden shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
        {/* Header & Filter */}
        <div className="p-[16px_20px] border-b border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <span className="text-[13.5px] font-bold text-[#0f172a] flex items-center gap-[7px]">
            <Tags size={16} className="text-[#0d9488]" /> All Categories
          </span>
          <div className="flex items-center gap-[10px] flex-wrap">
            <div className="flex items-center gap-[8px] bg-[#f8fafc] border-[1.5px] border-[#e8ecf1] rounded-[99px] px-[14px] py-[6px] transition-all focus-within:border-[#0d9488]">
              <Search size={13} className="text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search categories…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] font-['DM_Sans',sans-serif] text-[#0f172a] placeholder-[#aab] w-full min-w-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] w-[50px] border-b border-[#f1f5f9]">#</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] border-b border-[#f1f5f9]">Category Name</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] w-[150px] border-b border-[#f1f5f9]">Created</th>
                <th className="p-[11px_16px] text-[#64748b] text-[11px] font-bold uppercase tracking-[.8px] w-[160px] border-b border-[#f1f5f9]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center p-[40px] text-[#94a3b8]">
                    <div className="flex items-center justify-center gap-[8px]">
                      <Loader2 size={20} className="animate-spin text-[#0d9488]" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="text-center p-[32px] text-[#dc2626]">
                    <AlertTriangle size={28} className="mx-auto mb-[8px] text-[#ef4444]" />
                    Failed to load. Please refresh.
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-[48px] text-[#94a3b8]">
                    <Tags size={36} className="mx-auto mb-[8px] text-[#cbd5e1]" />
                    No categories found.
                  </td>
                </tr>
              ) : (
                currentData.map((cat, i) => (
                  <tr key={cat.categoryId} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="p-[12px_16px] text-[#64748b] align-middle border-b border-[#f1f5f9]">{start + i + 1}</td>
                    <td className="p-[12px_16px] align-middle border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                          {(cat.categoryName || '?')[0].toUpperCase()}
                        </div>
                        <span className="inline-flex items-center gap-[6px] text-[13px] font-medium px-[12px] py-[5px] rounded-[20px] bg-[#eff6ff] text-[#1d4ed8]">
                          <Tag size={12} className="fill-current shrink-0" />
                          {cat.categoryName}
                        </span>
                      </div>
                    </td>
                    <td className="p-[12px_16px] text-[#94a3b8] text-[12.5px] align-middle border-b border-[#f1f5f9]">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="p-[12px_16px] align-middle border-b border-[#f1f5f9]">
                      {isSubAdmin ? (
                        <span className="text-[#94a3b8] text-[12px] italic">View only</span>
                      ) : (
                        <div className="flex gap-[6px] flex-wrap">
                          <button
                            onClick={() => setEditModal({ open: true, id: cat.categoryId, name: cat.categoryName, saving: false })}
                            className="inline-flex items-center gap-[5px] p-[5px_12px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] whitespace-nowrap text-[#d97706] border-[#fde68a] bg-[#fffbeb] hover:bg-[#d97706] hover:text-white hover:border-[#d97706]"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: cat.categoryId, name: cat.categoryName, deleting: false })}
                            className="inline-flex items-center gap-[5px] p-[5px_12px] rounded-[8px] text-[12px] font-semibold cursor-pointer border-[1.5px] transition-all font-['DM_Sans',sans-serif] whitespace-nowrap text-[#dc2626] border-[#fecaca] bg-[#fef2f2] hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626]"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-[14px_20px] border-t border-[#f1f5f9] flex justify-between items-center flex-wrap gap-[10px]">
          <div className="text-[13px] text-[#64748b]">
            {filteredCategories.length === 0
              ? 'No results found'
              : `Showing ${start + 1}–${end} of ${filteredCategories.length} categories`}
          </div>
          <nav>{renderPaginationBtns()}</nav>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editModal.open && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => !editModal.saving && setEditModal({ ...editModal, open: false })}>
          <div className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0b2239] p-[20px_24px] flex items-center justify-between relative overflow-hidden">
              <div className="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.3),transparent_70%)] pointer-events-none" />
              <div className="flex items-center gap-[14px] relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center text-[18px] border-2 border-white/15">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-white m-0">Edit Category</p>
                  <p className="text-[12px] text-white/50 m-0 mt-[2px]">Update the category name</p>
                </div>
              </div>
              <button
                disabled={editModal.saving}
                onClick={() => setEditModal({ ...editModal, open: false })}
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white relative z-10 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-[24px] bg-white">
              <div className="mb-[16px]">
                <label className="block text-[11.5px] font-semibold tracking-[.8px] uppercase text-[#94a3b8] mb-[7px]">
                  Category Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                  placeholder="Enter category name"
                  className="w-full px-[14px] py-[10px] border-[1.5px] border-[#e8ecf1] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f172a] bg-white outline-none transition-all focus:border-[#0d9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                />
              </div>
              <div className="flex justify-end gap-[10px] mt-[20px] pt-[16px] border-t border-[#e8ecf1]">
                <button
                  disabled={editModal.saving}
                  onClick={() => setEditModal({ ...editModal, open: false })}
                  className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={editModal.saving}
                  onClick={handleEditSave}
                  className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(13,148,136,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {editModal.saving && <Loader2 size={16} className="animate-spin" />}
                  {editModal.saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => !deleteModal.deleting && setDeleteModal({ ...deleteModal, open: false })}>
          <div className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(11,34,57,0.18)] max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#b91c1c] p-[20px_24px] flex items-center justify-between">
              <div className="flex items-center gap-[12px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-white/15 flex items-center justify-center text-white text-[18px]">
                  <Trash2 size={20} className="fill-current" />
                </div>
                <div>
                  <p className="text-[15px] font-extrabold text-white m-0">Delete Category</p>
                  <p className="text-[12px] text-white/60 m-0 mt-[1px]">This action cannot be undone</p>
                </div>
              </div>
              <button
                disabled={deleteModal.deleting}
                onClick={() => setDeleteModal({ ...deleteModal, open: false })}
                className="w-[32px] h-[32px] rounded-[8px] bg-white/10 border border-white/10 text-white/70 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-[28px_24px] text-center">
              <AlertTriangle size={40} className="text-[#dc2626] mx-auto mb-[14px]" />
              <p className="text-[14px] color-[#0f172a] mb-[4px]">Are you sure you want to delete</p>
              <p className="text-[15px] font-bold text-[#dc2626] mb-[8px] break-words">{deleteModal.name}</p>
              <p className="text-[12.5px] text-[#64748b] mb-[20px]">This may affect existing jobs using this category.</p>
              <div className="flex justify-center gap-[10px]">
                <button
                  disabled={deleteModal.deleting}
                  onClick={() => setDeleteModal({ ...deleteModal, open: false })}
                  className="px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteModal.deleting}
                  onClick={handleDeleteConfirm}
                  className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-[99px] text-[13.5px] font-semibold cursor-pointer border-none bg-[#dc2626] text-white hover:bg-[#b91c1c] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(220,38,38,0.28)] transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {deleteModal.deleting && <Loader2 size={16} className="animate-spin" />}
                  {deleteModal.deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminJobCategories;
