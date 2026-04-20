import { NotebookText, Search } from 'lucide-react';
import EyebrowBadge from '../ui/EyebrowBadge';

export default function BlogHero({
  searchValue,
  onSearchChange,
  onSearch,
  articleCount,
  categoryCount,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <section className="blog-hero">
      <div className="container mx-auto px-6">
        <div className="blog-hero-inner">
          <EyebrowBadge
            text="RojgarShine Blog"
            icon={<NotebookText size={14} />}
            showPulse={false}
            className="blog-hero-eyebrow"
          />
          <h1>
            Career <span>Insights</span> &amp; Resources
          </h1>
          <p>
            Expert advice on job searching, resume writing, interview prep, and
            career growth — curated for India's workforce.
          </p>
          <div className="blog-search-wrap">
            <input
              type="text"
              id="blogSearchInput"
              placeholder="Search articles, tips, topics..."
              autoComplete="off"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" className="blog-search-btn" onClick={onSearch}>
              <Search size={16} /> Search
            </button>
          </div>
          <div className="blog-hero-stats">
            <div className="blog-hero-stat">
              <strong>{articleCount ?? '...'}</strong>
              <span>Articles</span>
            </div>
            <div className="blog-hero-stat">
              <strong>{categoryCount ?? '...'}</strong>
              <span>Categories</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
