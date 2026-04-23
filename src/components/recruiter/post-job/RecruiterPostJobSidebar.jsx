import React from 'react';

const checklistItems = [
  { key: 'title', label: 'Job title filled' },
  { key: 'category', label: 'Category selected' },
  { key: 'location', label: 'Location specified' },
  { key: 'salary', label: 'Salary provided' },
  { key: 'description', label: 'Description written' },
];

const RecruiterPostJobSidebar = ({ formState }) => {
  const completed = checklistItems.filter((item) => {
    if (item.key === 'description') {
      // For description, strip HTML tags and check for actual text content
      const textContent = formState[item.key]?.replace(/<[^>]*>/g, '').trim();
      return textContent && textContent.length > 0;
    }
    return Boolean(formState[item.key]);
  }).length;
  const percent = Math.round((completed / checklistItems.length) * 100);
  const circumference = 138;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Completion Ring Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-[22px] shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
          <div className="relative h-[52px] w-[52px] flex-shrink-0">
            <svg width="52" height="52" viewBox="0 0 52 52" className="transform -rotate-90">
              <circle cx="26" cy="26" r="22" className="fill-none stroke-slate-200" strokeWidth="5" />
              <circle
                cx="26"
                cy="26"
                r="22"
                className="fill-none stroke-teal-500 transition-all duration-500 ease-out"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-900">
              {percent}%
            </div>
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-slate-900">Post Completion</p>
            <small className="text-[11.5px] text-slate-500">
              {completed === checklistItems.length ? 'Ready to publish!' : `${checklistItems.length - completed} field${checklistItems.length - completed > 1 ? 's' : ''} remaining`}
            </small>
          </div>
        </div>

        <p className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-900">
          <i className="bi bi-ui-checks text-teal-500" />
          Checklist
        </p>
        <div className="space-y-0">
          {checklistItems.map((item, index) => {
            let done = Boolean(formState[item.key]);
            if (item.key === 'description') {
              // For description, strip HTML tags and check for actual text content
              const textContent = formState[item.key]?.replace(/<[^>]*>/g, '').trim();
              done = textContent && textContent.length > 0;
            }
            return (
              <div
                key={item.key}
                className={`flex items-center gap-2.5 py-[9px] text-[13px] ${
                  done ? 'font-medium text-slate-900' : 'text-slate-500'
                } ${index < checklistItems.length - 1 ? 'border-b border-slate-200' : ''}`}
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-250 ${
                    done ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-200'
                  }`}
                >
                  {done && <i className="bi bi-check text-[10px]" />}
                </div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Posting Tips */}
      <div className="rounded-lg border border-transparent bg-slate-900 p-[22px] text-white shadow-sm">
        <p className="mb-4 flex items-center gap-2 text-[13px] font-bold text-white">
          <i className="bi bi-lightbulb-fill text-teal-500" />
          Posting Tips
        </p>
        <div className="space-y-0">
          <div className="flex items-start gap-2.5 border-b border-white/10 py-2.5 text-[12.5px] leading-relaxed text-white/60">
            <i className="bi bi-check2-circle mt-0.5 flex-shrink-0 text-[13px] text-teal-500" />
            <span>A clear, specific title significantly improves search visibility and click-through rates.</span>
          </div>
          <div className="flex items-start gap-2.5 border-b border-white/10 py-2.5 text-[12.5px] leading-relaxed text-white/60">
            <i className="bi bi-currency-rupee mt-0.5 flex-shrink-0 text-[13px] text-teal-500" />
            <span>Mentioning salary attracts 30% more quality applicants on average.</span>
          </div>
          <div className="flex items-start gap-2.5 border-b border-white/10 py-2.5 text-[12.5px] leading-relaxed text-white/60">
            <i className="bi bi-card-text mt-0.5 flex-shrink-0 text-[13px] text-teal-500" />
            <span>List responsibilities and required skills clearly — reduces unqualified applications.</span>
          </div>
          <div className="flex items-start gap-2.5 py-2.5 text-[12.5px] leading-relaxed text-white/60">
            <i className="bi bi-geo-alt mt-0.5 flex-shrink-0 text-[13px] text-teal-500" />
            <span>Specifying city or remote helps candidates self-screen effectively.</span>
          </div>
        </div>
      </div>

      {/* Salary Format Note */}
      <div className="rounded-xl border border-dashed border-teal-300/30 bg-teal-50/40 px-[18px] py-4">
        <strong className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-teal-700">💡 Salary Format</strong>
        <p className="text-[12.5px] leading-relaxed text-slate-600">
          Enter the annual CTC in rupees. Use round numbers like <strong>400000</strong> for ₹4 LPA or <strong>1200000</strong> for ₹12 LPA.
        </p>
      </div>
    </div>
  );
};

export default RecruiterPostJobSidebar;
