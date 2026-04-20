import { Briefcase, Bookmark, Flame, LayoutGrid, Search, Tag } from 'lucide-react';
import { formatDate, postUrl } from './blogUtils';

export default function BlogSidebar({
  trendingPosts,
  categories,
  currentCat,
  onCategoryChange,
}) {
  const chips = [
    { id: 'all', name: 'All Posts', icon: LayoutGrid },
    ...categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: Bookmark,
    })),
  ];

  return (
    <aside className="blog-sidebar">
      <div className="blog-widget fade-up">
        <div className="blog-widget-head">
          <Flame size={14} /> Trending Now
        </div>
        <div className="blog-widget-body">
          <ul className="trending-list">
            {trendingPosts.length ? (
              trendingPosts.slice(0, 5).map((post, index) => (
                <li key={post.id || post.slug || index}>
                  <a className="trending-item" href={postUrl(post.slug)}>
                    <span className="trending-num">0{index + 1}</span>
                    <div>
                      <div className="trending-title">{post.title}</div>
                      <div className="trending-meta">
                        {post.categoryName || 'Blog'} · {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </a>
                </li>
              ))
            ) : (
              <li
                style={{
                  padding: '14px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                No trending articles
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="blog-widget fade-up">
        <div className="blog-widget-head">
          <Tag size={14} /> Browse Topics
        </div>
        <div className="blog-widget-body">
          <div className="cat-chips">
            {chips.map((chip) => {
              const Icon = chip.icon;
              return (
                <div
                  key={chip.id}
                  className={`cat-chip${
                    String(chip.id) === String(currentCat) ? ' active' : ''
                  }`}
                  onClick={() => onCategoryChange(chip.id)}
                >
                  <Icon size={14} /> {chip.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="job-cta-widget fade-up">
        <div className="job-cta-icon">
          <Briefcase size={20} />
        </div>
        <h5>Ready to Find Your Dream Job?</h5>
        <p>Browse thousands of verified openings across India's top companies.</p>
        <a className="job-cta-btn" href="/jobs">
          <Search size={14} /> Browse Jobs Now
        </a>
      </div>
    </aside>
  );
}
