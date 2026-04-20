export default function BlogSkeleton() {
  return (
    <div>
      <div className="blog-featured" style={{ marginBottom: '28px' }}>
        <div className="blog-featured-img">
          <div className="b-skel" style={{ height: '260px', margin: 0 }} />
        </div>
        <div className="blog-featured-body">
          <div className="b-skel" style={{ height: '12px', width: '30%', marginBottom: '16px' }} />
          <div className="b-skel" style={{ height: '22px', width: '85%', marginBottom: '10px' }} />
          <div className="b-skel" style={{ height: '22px', width: '60%', marginBottom: '18px' }} />
          <div className="b-skel" style={{ height: '13px' }} />
          <div className="b-skel" style={{ height: '13px', width: '80%' }} />
        </div>
      </div>
      <div className="blog-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="blog-card">
            <div className="blog-card-img">
              <div className="b-skel" style={{ height: '150px', margin: 0, width: '100%' }} />
            </div>
            <div className="blog-card-body">
              <div className="b-skel" style={{ height: '11px', width: '35%', marginBottom: '12px' }} />
              <div className="b-skel" style={{ height: '16px', marginBottom: '8px' }} />
              <div className="b-skel" style={{ height: '13px', width: '75%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
