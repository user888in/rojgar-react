import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const EditJobModal = ({
  open,
  onClose,
  formState = {},
  onFormChange = () => {},
  onSave = () => {},
  saving = false,
  error = '',
  categories = [],
  loadingCategories = false,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Prevent background scrolling while allowing modal content scrolling.
    const blockScroll = (e) => {
      // If the event originated inside the modal, allow it (so modal can scroll)
      if (modalRef.current && modalRef.current.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const blockKey = (e) => {
      // Allow keyboard interaction when focus is inside modal
      if (modalRef.current && modalRef.current.contains(document.activeElement)) return;
      const blockedKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', blockScroll, { passive: false });
    window.addEventListener('touchmove', blockScroll, { passive: false });
    window.addEventListener('keydown', blockKey, { passive: false });

    return () => {
      window.removeEventListener('wheel', blockScroll);
      window.removeEventListener('touchmove', blockScroll);
      window.removeEventListener('keydown', blockKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} style={{ zIndex: 99998 }} onWheel={(e) => e.preventDefault()} onTouchMove={(e) => e.preventDefault()} />

      <div
        ref={modalRef}
        className="relative mx-4 w-full max-w-2xl rounded-[20px] bg-white shadow-2xl"
        style={{ zIndex: 99999, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="flex items-center justify-between bg-[#0b2239] px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-400 text-white text-xl">
              <i className="bi bi-pencil-square" />
            </div>
            <div>
              <p className="font-extrabold">Edit Job</p>
              <p className="text-sm text-white/70">Update your job posting details</p>
            </div>
          </div>
          <button className="text-white" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="p-6"
          style={{ overflowY: 'auto', flex: 1 }}
        >
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
              {error}
            </div>
          )}

          <input type="hidden" value={formState.id || ''} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11.5px] font-semibold uppercase text-slate-500 mb-2">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                value={formState.title || ''}
                onChange={(e) => onFormChange('title', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold uppercase text-slate-500 mb-2">
                Location
              </label>
              <input
                value={formState.location || ''}
                onChange={(e) => onFormChange('location', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-[11.5px] font-semibold uppercase text-slate-500 mb-2">
                Category
              </label>
              <select
                value={formState.categoryId ?? ''}
                onChange={(e) => onFormChange('categoryId', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{loadingCategories ? 'Loading…' : 'Select category'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold uppercase text-slate-500 mb-2">
                Annual Salary (₹)
              </label>
              <input
                type="number"
                value={formState.salary ?? ''}
                onChange={(e) => onFormChange('salary', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[11.5px] font-semibold uppercase text-slate-500 mb-2">
              Job Description
            </label>
            <ReactQuill
              theme="snow"
              value={formState.description || ''}
              onChange={(val) => onFormChange('description', val)}
              placeholder="Write job description…"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ header: [1, 2, 3, false] }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean'],
                ],
              }}
            />
          </div>

        </form>

        <div className="p-4 border-t bg-white flex-shrink-0 flex justify-end gap-3" style={{ borderTop: '1px solid #e8ecf1' }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;
