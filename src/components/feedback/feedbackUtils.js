export const formatCount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '...';
  return num;
};

export const formatAvgRating = (value) => {
  if (value === null || value === undefined || value === '') return '...';
  return value;
};

export const initials = (name) => {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const buildPageRange = (current, total) => {
  const delta = 2;
  const range = [];
  const out = [];
  let last;

  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach((page) => {
    if (last) {
      if (page - last === 2) out.push(last + 1);
      else if (page - last !== 1) out.push('...');
    }
    out.push(page);
    last = page;
  });

  return out;
};
