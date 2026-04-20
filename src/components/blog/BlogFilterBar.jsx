import { Bookmark, LayoutGrid } from 'lucide-react';

export default function BlogFilterBar({
  categories,
  currentCat,
  currentSort,
  onCategoryChange,
  onSortChange,
}) {
  return (
    <div className="blog-filter-bar">
      <div className="container mx-auto px-6">
        <div className="blog-filter-inner" id="filterBar">
          <button
            type="button"
            className={`blog-cat-btn ${currentCat === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange('all')}
          >
            <LayoutGrid size={14} /> All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`blog-cat-btn ${
                String(currentCat) === String(cat.id) ? 'active' : ''
              }`}
              onClick={() => onCategoryChange(cat.id)}
            >
              <Bookmark size={14} /> {cat.name}
            </button>
          ))}
          <div className="blog-filter-divider"></div>
          <select
            className="blog-sort-select"
            value={currentSort}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
