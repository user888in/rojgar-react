import { FeedbackAvatar, FeedbackRolePill, FeedbackStars } from './FeedbackAtoms';
import { formatDate, timeAgo } from './feedbackUtils';

export default function FeedbackModal({ open, loading, error, data, onClose }) {
  const backdropClass = `fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(9,29,51,0.6)] px-5 backdrop-blur-[6px] transition-opacity ${
    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`;

  const modalClass = `relative w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white shadow-[0_24px_64px_rgba(9,29,51,0.22)] transition-transform max-[600px]:rounded-[18px] ${
    open ? 'translate-y-0 scale-100' : 'translate-y-5 scale-[0.97]'
  }`;

  return (
    <div
      className={backdropClass}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={modalClass} role="dialog" aria-modal="true">
        {loading && (
          <div className="py-[60px] text-center text-[#64748b]">
            <div className="mx-auto mb-3.5 h-9 w-9 animate-[spin_0.7s_linear_infinite] rounded-full border-[3px] border-[#e2e8f0] border-t-[#18a99c]"></div>
            Loading review...
          </div>
        )}

        {!loading && error && (
          <>
            <div className="sticky top-0 z-10 rounded-t-[24px] bg-[#091d33] px-7 pb-5 pt-6 max-[600px]:px-[22px] max-[600px]:pb-[18px] max-[600px]:pt-5">
              <button
                type="button"
                className="absolute right-[18px] top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.1)] text-[1.1rem] text-[rgba(255,255,255,0.7)] transition hover:bg-[rgba(255,255,255,0.2)] hover:text-white"
                onClick={onClose}
              >
                <i className="bi bi-x"></i>
              </button>
              <div className="flex items-center gap-3.5">
                <div className="text-[1.05rem] font-extrabold text-white">Error</div>
              </div>
            </div>
            <div className="p-7 max-[600px]:p-5">
              <div className="text-center">
                <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#e6f7f6] text-[1.8rem] text-[#18a99c]">
                  <i className="bi bi-exclamation-circle"></i>
                </div>
                <p className="text-[0.875rem] text-[#64748b]">
                  Failed to load review.
                  <br />
                  <small className="text-[#ef4444]">{error}</small>
                </p>
              </div>
            </div>
          </>
        )}

        {!loading && !error && data && (
          <>
            <div className="sticky top-0 z-10 rounded-t-[24px] bg-[#091d33] px-7 pb-5 pt-6 max-[600px]:px-[22px] max-[600px]:pb-[18px] max-[600px]:pt-5">
              <button
                type="button"
                className="absolute right-[18px] top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.1)] text-[1.1rem] text-[rgba(255,255,255,0.7)] transition hover:bg-[rgba(255,255,255,0.2)] hover:text-white"
                onClick={onClose}
              >
                <i className="bi bi-x"></i>
              </button>
              <div className="flex items-center gap-3.5">
                <FeedbackAvatar
                  image={data.profileImage}
                  name={data.fullName}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border-2 border-[rgba(24,169,156,0.4)] bg-[rgba(24,169,156,0.2)] text-base font-extrabold text-[#18a99c]"
                />
                <div>
                  <div className="mb-1 text-[1.05rem] font-extrabold text-white">
                    {data.fullName || 'Anonymous'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <FeedbackRolePill role={data.role} />
                    {data.companyName ? (
                      <span className="text-[0.72rem] text-[rgba(255,255,255,0.5)]">
                        <i className="bi bi-building mr-1"></i>
                        {data.companyName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-7 max-[600px]:p-5">
              <div className="mb-[22px] flex items-center gap-2.5">
                <FeedbackStars
                  rating={data.rating || 0}
                  className="text-[1.4rem] tracking-[2px]"
                />
                <span className="text-[1.1rem] font-extrabold text-[#091d33]">
                  {data.rating || 0}
                </span>
                <span className="text-[0.8rem] text-[#64748b]">/ 5</span>
              </div>
              {data.subject ? (
                <div className="mb-[22px]">
                  <div className="mb-2 text-[0.68rem] font-bold uppercase tracking-[1.2px] text-[#64748b]">
                    <i className="bi bi-tag-fill mr-1"></i>Subject
                  </div>
                  <div className="rounded-[10px] bg-[#f1f5f9] px-4 py-3 text-[0.92rem] leading-[1.7] text-[#091d33]">
                    {data.subject}
                  </div>
                </div>
              ) : null}
              <div className="mb-[22px]">
                <div className="mb-2 text-[0.68rem] font-bold uppercase tracking-[1.2px] text-[#64748b]">
                  <i className="bi bi-chat-text-fill mr-1"></i>Message
                </div>
                <div className="max-h-[260px] whitespace-pre-wrap rounded-[10px] bg-[#f1f5f9] px-4 py-3 text-[0.92rem] leading-[1.7] text-[#091d33]">
                  {data.message || '-'}
                </div>
              </div>
              <div className="my-5 h-px bg-[#e2e8f0]"></div>
              <div className="flex flex-wrap gap-4 text-[0.8rem] text-[#64748b]">
                {data.email ? (
                  <div className="flex items-center gap-2">
                    <i className="bi bi-envelope-fill text-[#18a99c]"></i>
                    {data.email}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <i className="bi bi-calendar-fill text-[#18a99c]"></i>
                  {formatDate(data.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock-fill text-[#18a99c]"></i>
                  {timeAgo(data.createdAt)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
