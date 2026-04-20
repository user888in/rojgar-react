import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BlogPagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      pages.push({ type: 'page', value: i });
    } else if (Math.abs(i - currentPage) === 3) {
      pages.push({ type: 'ellipsis', value: `ellipsis-${i}` });
    }
  }

  return (
    <div className="blog-pagination">
      <button
        type="button"
        className="blog-pg-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((item) =>
        item.type === 'page' ? (
          <button
            key={item.value}
            type="button"
            className={`blog-pg-btn${item.value === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(item.value)}
          >
            {item.value}
          </button>
        ) : (
          <button key={item.value} type="button" className="blog-pg-btn" disabled>
            ...
          </button>
        )
      )}
      <button
        type="button"
        className="blog-pg-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
