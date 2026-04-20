export const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const timeAgo = (value) => {
  if (!value) return '';
  const days = Math.floor((Date.now() - new Date(value)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export const initials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const excerpt = (value, length = 130) => {
  if (!value) return '';
  const plain = value.replace(/<[^>]*>/g, '');
  return plain.length > length ? `${plain.slice(0, length)}...` : plain;
};

export const postUrl = (slug) =>
  `/blogDetail.html?slug=${encodeURIComponent(slug ?? '')}`;
