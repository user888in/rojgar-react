import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, CalendarDays, NotebookText } from 'lucide-react';
import { excerpt, formatDate, initials, postUrl } from './blogUtils';

export default function BlogFeaturedCard({ post }) {
  const images = post?.images || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [post]);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!post) return null;

  const media = () => {
    if (images.length > 1) {
      return (
        <div className="fc-carousel" id="fc-feat" data-current={index} data-total={images.length}>
          {images.map((img, idx) => (
            <div key={idx} className={`fc-slide${idx === index ? ' active' : ''}`}>
              <img src={img.imageUrl} alt={post.title} />
            </div>
          ))}
          <div className="fc-dots">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`fc-dot${idx === index ? ' active' : ''}`}
                onClick={(event) => {
                  event.preventDefault();
                  setIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>
          <div className="blog-featured-badge">✦ Featured</div>
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <>
          <img src={images[0].imageUrl} alt={post.title} />
          <div className="blog-featured-badge">✦ Featured</div>
        </>
      );
    }

    return (
      <>
        <div className="blog-featured-img-placeholder">
          <NotebookText size={56} />
          <span>Featured Article</span>
        </div>
        <div className="blog-featured-badge">✦ Featured</div>
      </>
    );
  };

  return (
    <a className="blog-featured fade-up" href={postUrl(post.slug)}>
      <div className="blog-featured-img">{media()}</div>
      <div className="blog-featured-body">
        <div className="blog-featured-cat">
          <Bookmark size={14} /> {post.categoryName || 'Blog'}
        </div>
        <div className="blog-featured-title">{post.title}</div>
        <p className="blog-featured-excerpt">{excerpt(post.description, 200)}</p>
        <div className="blog-featured-meta">
          <div className="blog-author-av">{initials(post.authorName)}</div>
          <div>
            <div className="blog-author-name">{post.authorName || 'Staff Writer'}</div>
          </div>
          <div className="blog-date-tag">
            <CalendarDays size={14} /> {formatDate(post.createdAt)}
          </div>
        </div>
        <span className="blog-featured-cta">
          Read Full Article <ArrowRight size={14} />
        </span>
      </div>
    </a>
  );
}
