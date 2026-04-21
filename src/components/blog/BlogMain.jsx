import { BookOpen, Search } from 'lucide-react';
import BlogCard from './BlogCard';
import BlogFeaturedCard from './BlogFeaturedCard';
import BlogPagination from './BlogPagination';
import BlogSidebar from './BlogSidebar';
import BlogSkeleton from './BlogSkeleton';

export default function BlogMain({
  loading,
  posts,
  articleCount,
  currentPage,
  totalPages,
  showFeatured,
  featuredPost,
  onPageChange,
  trendingPosts,
  categories,
  currentCat,
  onCategoryChange,
}) {
  const hasFeatured = showFeatured && featuredPost;
  const gridPosts = hasFeatured ? posts.slice(1) : posts;
  const latestCount = hasFeatured
    ? Math.max(articleCount - 1, 0)
    : articleCount;

  return (
    <section className="blog-main">
      <div className="container mx-auto px-6">
        <div className="blog-layout">
          <div>
            {loading ? (
              <BlogSkeleton />
            ) : (
              <>
                {hasFeatured && <BlogFeaturedCard key={featuredPost?.id || 'featured'} post={featuredPost} />}
                <div className="blog-grid">
                  {gridPosts.map((post, index) => (
                    <BlogCard key={post.id || post.slug || index} post={post} delay={index * 0.06} />
                  ))}
                </div>
                {!gridPosts.length && !hasFeatured && (
                  <div className="blog-empty">
                    <div className="blog-empty-icon">
                      <Search size={22} />
                    </div>
                    <h5>No articles found</h5>
                    <p>Try a different category or search term.</p>
                  </div>
                )}
                <div
                  className="blog-section-label fade-up"
                  style={{ marginTop: '8px', justifyContent: 'space-between' }}
                >
                  <span className="blog-section-pill">
                    <BookOpen size={14} /> Latest Articles
                  </span>
                  <span className="blog-section-count">
                    {latestCount} article{latestCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </>
            )}
          </div>
          <BlogSidebar
            trendingPosts={trendingPosts}
            categories={categories}
            currentCat={currentCat}
            onCategoryChange={onCategoryChange}
          />
        </div>
      </div>
    </section>
  );
}
