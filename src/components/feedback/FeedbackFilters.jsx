import { Building2, LayoutGrid, Search, User } from 'lucide-react';

const STAR = '\u2605';
const EMPTY_STAR = '\u2606';

const ROLE_OPTIONS = [
  { label: 'All', value: '', Icon: LayoutGrid },
  { label: 'Job Seekers', value: 'JOB_SEEKER', Icon: User },
  { label: 'Recruiters', value: 'RECRUITER', Icon: Building2 },
];

const RATING_OPTIONS = [
  { label: 'Any Rating', value: '' },
  { label: `${STAR.repeat(5)} 5 stars`, value: '5' },
  { label: `${STAR.repeat(4)}${EMPTY_STAR} 4+ stars`, value: '4' },
  { label: `${STAR.repeat(3)}${EMPTY_STAR.repeat(2)} 3+ stars`, value: '3' },
  { label: `${STAR.repeat(2)}${EMPTY_STAR.repeat(3)} 2+ stars`, value: '2' },
];

export default function FeedbackFilters({
  role,
  rating,
  searchInput,
  totalElements,
  onRoleChange,
  onRatingChange,
  onSearchChange,
}) {
  return (
    <div className="container mx-auto px-6">
      <div className="relative z-10 -mt-10 rounded-[20px] bg-white px-7 py-[22px] shadow-[0_16px_48px_rgba(9,29,51,0.15)] max-[600px]:-mt-7 max-[600px]:px-4 max-[600px]:py-4">
        <div className="flex flex-wrap items-center gap-3 max-[600px]:gap-2">
          <span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[1px] text-[#64748b]">
            Filter by
          </span>
          <div className="flex flex-1 flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-[18px] py-2 text-[0.82rem] font-semibold transition ${
                  role === option.value
                    ? 'border-[#18a99c] bg-[#18a99c] text-white'
                    : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:border-[#18a99c] hover:bg-[#e6f7f6] hover:text-[#18a99c]'
                }`}
                onClick={() => onRoleChange(option.value)}
              >
                <option.Icon className="h-4 w-4" aria-hidden="true" /> {option.label}
              </button>
            ))}
          </div>
          <div className="h-8 w-px shrink-0 bg-[#e2e8f0] max-[600px]:hidden"></div>
          <select
            className="cursor-pointer rounded-full border-[1.5px] border-[#e2e8f0] bg-[#f1f5f9] px-4 py-[9px] text-[0.82rem] font-medium text-[#64748b] outline-none transition focus:border-[#18a99c]"
            value={rating}
            onChange={(event) => onRatingChange(event.target.value)}
          >
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="h-8 w-px shrink-0 bg-[#e2e8f0] max-[600px]:hidden"></div>
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="pointer-events-none absolute left-[14px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
            <input
              type="text"
              className="w-full rounded-full border-[1.5px] border-[#e2e8f0] bg-[#f1f5f9] py-[9px] pl-9 pr-[14px] text-[0.82rem] text-[#091d33] outline-none transition focus:border-[#18a99c]"
              placeholder="Search name, subject or message..."
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <span className="ml-auto shrink-0 whitespace-nowrap text-[0.82rem] text-[#64748b] max-[600px]:hidden">
            Showing <strong className="font-bold text-[#091d33]">{totalElements}</strong> reviews
          </span>
        </div>
      </div>
    </div>
  );
}
