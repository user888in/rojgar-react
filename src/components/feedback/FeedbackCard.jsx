import { ArrowRight, Clock } from 'lucide-react';
import { FeedbackAvatar, FeedbackRolePill, FeedbackStars } from './FeedbackAtoms';
import { timeAgo } from './feedbackUtils';

export default function FeedbackCard({ item, isTop, onOpen, fallbackId }) {
  const feedbackId = item.feedbackId ?? item.id ?? fallbackId;
  const topBorderClass = isTop
    ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-[16px] before:bg-[linear-gradient(90deg,_#18a99c,_#2dd4bf)] before:content-['']"
    : '';

  return (
    <div
      className={`relative flex cursor-pointer flex-col rounded-[16px] border-[1.5px] border-[#e2e8f0] bg-white p-[22px] transition duration-200 ease-out hover:-translate-y-1 hover:border-[rgba(24,169,156,0.35)] hover:shadow-[0_8px_32px_rgba(9,29,51,0.13)] animate-[fbCardIn_0.32s_ease_both] ${topBorderClass}`.trim()}
      onClick={() => onOpen(feedbackId)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(feedbackId);
      }}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <FeedbackAvatar
          image={item.profileImage}
          name={item.fullName}
          className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[#091d33] text-[0.82rem] font-extrabold text-white"
        />
        <div>
          <strong className="block text-[0.9rem] font-bold text-[#091d33]">
            {item.fullName || 'Anonymous'}
          </strong>
          <span className="text-[0.74rem] text-[#64748b]">
            {item.companyName ||
              (item.role === 'JOB_SEEKER'
                ? 'Job Seeker'
                : item.role === 'RECRUITER'
                ? 'Recruiter'
                : '')}
          </span>
        </div>
        <FeedbackRolePill role={item.role} className="ml-auto shrink-0" />
      </div>
      <FeedbackStars
        rating={item.rating || 0}
        className="mb-2.5 text-base tracking-[1.5px]"
      />
      {item.subject ? (
        <div className="mb-1.5 text-[0.82rem] font-bold text-[#091d33]">{item.subject}</div>
      ) : null}
      <p className="mb-3.5 line-clamp-3 text-[0.82rem] leading-[1.65] text-[#64748b]">
        {item.message || '-'}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-[#f0f4f8] pt-3">
        <span className="flex items-center gap-1 text-[0.72rem] text-[#94a3b8]">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {timeAgo(item.createdAt)}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#e6f7f6] px-3.5 py-1.5 text-[0.78rem] font-bold text-[#18a99c] transition hover:bg-[#18a99c] hover:text-white"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(feedbackId);
          }}
        >
          Read more <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
