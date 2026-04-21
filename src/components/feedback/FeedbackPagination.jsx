import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeedbackPagination({ page, totalPages, pageRange, onPageChange }) {
  if (totalPages <= 1) return null;

  const baseButton =
    'flex h-[38px] min-w-[38px] items-center justify-center rounded-[10px] border-[1.5px] px-2.5 text-[0.82rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="mt-9 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        className={`${baseButton} border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#091d33] hover:bg-[#f1f5f9] hover:text-[#091d33]`}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="mx-2 text-[0.8rem] text-[#64748b]">
        Page {page} of {totalPages}
      </span>
      {pageRange.map((p, idx) =>
        p === '...' ? (
          <button key={`gap-${idx}`} type="button" className={`${baseButton} border-[#e2e8f0] bg-white text-[#64748b]`} disabled>
            ...
          </button>
        ) : (
          <button
            key={`page-${p}`}
            type="button"
            className={`${baseButton} ${
              p === page
                ? 'border-[#091d33] bg-[#091d33] text-white'
                : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#091d33] hover:bg-[#f1f5f9] hover:text-[#091d33]'
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={`${baseButton} border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#091d33] hover:bg-[#f1f5f9] hover:text-[#091d33]`}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
