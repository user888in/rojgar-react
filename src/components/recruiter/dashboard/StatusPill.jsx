const StatusPill = ({ status, type }) => {
  const raw = (status || '').toUpperCase();

  if (type === 'job') {
    const isOpen = raw === 'OPEN' || raw === 'ACTIVE' || raw === 'PUBLISHED';
    return <span className={`status-pill pill-${isOpen ? 'open' : 'closed'}`}>{status || 'N/A'}</span>;
  }

  const map = {
    APPLIED: 'applied',
    SHORTLISTED: 'shortlisted',
    HIRED: 'hired',
    REJECTED: 'rejected',
  };
  const cls = map[raw] || 'applied';
  const label = status ? `${status.charAt(0)}${status.slice(1).toLowerCase()}` : 'N/A';

  return <span className={`status-pill pill-${cls}`}>{label}</span>;
};

export default StatusPill;
