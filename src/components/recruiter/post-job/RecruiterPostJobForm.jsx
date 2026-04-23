import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
 
const defaultCategories = [
  'Software Engineering',
  'Product Management',
  'Design',
  'Marketing',
  'Sales',
  'Customer Support',
  'Human Resources',
  'Operations',
];
 
const RecruiterPostJobForm = ({
  formState,
  onFormChange,
  onSubmit,
  categories = [],
  loadingCategories = false,
  submitting = false,
  submitError = '',
  submitSuccess = '',
}) => {
  const [categoryQuery, setCategoryQuery] = useState(formState.category || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationInfo, setLocationInfo] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
 
  useEffect(() => {
    setCategoryQuery(formState.category || '');
  }, [formState.category]);
 
  const normalizedCategories = useMemo(() => {
    if (!categories.length) {
      return defaultCategories.map((name) => ({ id: name, name }));
    }
 
    return categories.map((item) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      return {
        id: item.id || item._id || item.categoryId || item.value || item.name,
        name: item.categoryName || item.name || item.label || item.category || '',
      };
    });
  }, [categories]);
 
  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    return query
      ? normalizedCategories.filter((item) => item.name.toLowerCase().includes(query))
      : normalizedCategories;
  }, [categoryQuery, normalizedCategories]);
 
  const handleCategorySelect = (category) => {
    setCategoryQuery(category.name);
    setDropdownOpen(false);
    onFormChange('category', category.name);
    onFormChange('categoryId', category.id);
  };
 
  const handlePincodeChange = async (value) => {
    onFormChange('locationPin', value);
    onFormChange('location', '');
    setLocationInfo('');
    setLocationStatus('');
 
    if (!/^[0-9]{6}$/.test(value)) {
      if (value.length === 6) {
        setLocationStatus('Enter a valid 6-digit pincode');
      }
      return;
    }
 
    setPinLoading(true);
    setLocationStatus('Looking up pincode…');
 
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = await res.json();
      const record = data?.[0];
      if (record?.Status === 'Success' && record.PostOffice?.length > 0) {
        const office = record.PostOffice[0];
        const locationStr = `${office.District || office.Block || ''}, ${office.State || ''}, ${office.Country || 'India'}`;
        onFormChange('location', locationStr);
        setLocationInfo(locationStr);
        setLocationStatus('✓ Location found');
      } else {
        setLocationStatus('✗ Pincode not found. Try another.');
      }
    } catch (err) {
      setLocationStatus('Lookup failed. Check your connection.');
    } finally {
      setPinLoading(false);
    }
  };
 
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="mb-6 flex items-center gap-3 text-sm font-semibold text-slate-900">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <i className="bi bi-clipboard-data-fill" />
        </span>
        Job Details
      </p>
 
      <form className="space-y-6" onSubmit={onSubmit}>
 
        {/* Job Title */}
        <div>
          <label
            className="block text-[11.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor="jobTitle"
          >
            Job Title
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <i className="bi bi-briefcase-fill" />
            </span>
            <input
              id="jobTitle"
              type="text"
              value={formState.title}
              onChange={(event) => onFormChange('title', event.target.value)}
              placeholder="e.g. Senior Java Backend Developer"
              className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>
        </div>
 
        {/* Category + Location */}
        <div className="grid gap-5 lg:grid-cols-2">
 
          {/* Job Category */}
          <div className="relative">
            <label
              className="block text-[11.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              htmlFor="category"
            >
              Job Category
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="bi bi-tags-fill" />
              </span>
              <input
                id="category"
                type="text"
                value={categoryQuery}
                onChange={(event) => {
                  setCategoryQuery(event.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search categories"
                className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                autoComplete="off"
              />
              {categoryQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryQuery('');
                    onFormChange('category', '');
                    onFormChange('categoryId', '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-2 py-1 text-slate-500 transition hover:bg-slate-200"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>
 
            {dropdownOpen && (
              <div className="absolute left-0 right-0 z-20 mt-2 max-h-52 overflow-y-auto rounded-3xl border border-teal-200 bg-white shadow-2xl">
                <div className="divide-y divide-slate-100">
                  {loadingCategories && !normalizedCategories.length ? (
                    <div className="p-4 text-sm text-slate-500">Loading categories…</div>
                  ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <i className="bi bi-tags-fill text-teal-600" />
                        {category.name}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-slate-500">No categories found</div>
                  )}
                </div>
              </div>
            )}
 
            {formState.category && (
              <div className="mt-3 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                <i className="bi bi-check-circle-fill mr-2" />
                {formState.category}
              </div>
            )}
          </div>
 
          {/* Location / Pincode */}
          <div>
            <label
              className="block text-[11.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              htmlFor="locationPin"
            >
              Location
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="bi bi-geo-alt-fill" />
              </span>
              <input
                id="locationPin"
                type="text"
                value={formState.locationPin}
                onChange={(event) => handlePincodeChange(event.target.value)}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <p className="mt-2 min-h-5 text-xs text-slate-500">{locationStatus}</p>
            {locationInfo && (
              <div className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-slate-900">
                <i className="bi bi-geo-alt-fill mr-2 text-teal-600" />
                {locationInfo}
              </div>
            )}
            <input type="hidden" value={formState.location} />
          </div>
        </div>
 
        {/* Annual Salary */}
        <div>
          <label
            className="block text-[11.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor="salary"
          >
            Annual Salary (₹)
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <i className="bi bi-currency-rupee" />
            </span>
            <input
              id="salary"
              type="number"
              value={formState.salary}
              onChange={(event) => onFormChange('salary', event.target.value)}
              placeholder="e.g. 400000 for ₹4 LPA"
              min="0"
              className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>
        </div>
 
        {/* Job Description */}
        <div>
          <label
            className="block text-[11.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor="description"
          >
            Job Description
          </label>
          <div className="mt-2">
            <ReactQuill
              theme="snow"
              value={formState.description}
              onChange={(value) => onFormChange('description', value)}
              placeholder="Describe the role, responsibilities, and requirements…"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ header: [1, 2, 3, false] }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </div>
        </div>
 
        {/* Submit */}
        <div className="space-y-4">
          {submitError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <i className="bi bi-exclamation-circle-fill mr-2" /> {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <i className="bi bi-check-circle-fill mr-2" /> {submitSuccess}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className="bi bi-check-circle-fill" /> {submitting ? 'Publishing…' : 'Publish Job'}
            </button>
            <span className="text-sm text-slate-500">Your job will be visible to candidates immediately.</span>
          </div>
        </div>
 
      </form>
    </div>
  );
};
 
export default RecruiterPostJobForm;