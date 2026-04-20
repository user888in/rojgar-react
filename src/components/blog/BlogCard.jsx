import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, Clock, NotebookText } from 'lucide-react';
import { excerpt, initials, postUrl, timeAgo } from './blogUtils';

export default function BlogCard({ post, delay = 0 }) {
  const images = post?.images || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [post]);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [images.length]);

  const renderMedia = () => {
    if (images.length > 1) {
      return (
        <div className="cc-carousel" data-current={index} data-total={images.length}>
          {images.map((img, idx) => (
            <div key={idx} className={`cc-slide${idx === index ? ' active' : ''}`}>
              <img src={img.imageUrl} alt={post.title} />
            </div>
          ))}
          <div className="cc-dots">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`cc-dot${idx === index ? ' active' : ''}`}
                onClick={(event) => {
                  event.preventDefault();
                  setIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>
          <div className="blog-card-cat-badge">{post.categoryName || 'Blog'}</div>
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <>
          <img src={images[0].imageUrl} alt={post.title} />
          <div className="blog-card-cat-badge">{post.categoryName || 'Blog'}</div>
        </>
      );
    }

    return (
      <>
        <div className="blog-card-img-placeholder">
          <NotebookText size={36} />
          <small>{post.categoryName || 'Blog'}</small>
        </div>
        <div className="blog-card-cat-badge">{post.categoryName || 'Blog'}</div>
      </>
    );
  };

  return (
    <a
      className="blog-card fade-up"
      style={{ animationDelay: `${delay}s` }}
      href={postUrl(post.slug)}
    >
      <div className="blog-card-img">{renderMedia()}</div>
      <div className="blog-card-body">
        <div className="blog-card-cat">
          <Bookmark size={14} /> {post.categoryName || 'Blog'}
        </div>
        <div className="blog-card-title">{post.title}</div>
        <p className="blog-card-excerpt">{excerpt(post.description)}</p>
        <div className="blog-card-footer">
          <div className="blog-card-author">
            <div className="blog-card-av">{initials(post.authorName)}</div>
            <div>
              <div className="blog-card-author-name">{post.authorName || 'Author'}</div>
              <div className="blog-card-author-date">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div className="blog-card-read-time">
            <Clock size={14} /> 5 min
          </div>
        </div>
      </div>
      <span className="blog-card-link">
        Read Article <ArrowRight size={14} />
      </span>
    </a>
  );
}
