const RecruiterManageJobsStats = ({ stats, onFilter }) => {
  const cards = [
    {
      title: 'Total Jobs',
      value: stats.total,
      subtitle: 'All time postings',
      icon: 'bi-briefcase-fill',
      tone: 'text-teal-700 bg-teal-50',
      filter: '',
      badge: 'Click to show all',
    },
    {
      title: 'Active Jobs',
      value: stats.active,
      subtitle: 'Currently open',
      icon: 'bi-check-circle-fill',
      tone: 'text-emerald-700 bg-emerald-50',
      filter: 'OPEN',
      badge: 'Click to filter active',
    },
    {
      title: 'Closed Jobs',
      value: stats.closed,
      subtitle: 'No longer accepting',
      icon: 'bi-x-circle-fill',
      tone: 'text-rose-700 bg-rose-50',
      filter: 'CLOSED',
      badge: 'Click to filter closed',
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <button
          key={card.title}
          type="button"
          onClick={() => onFilter(card.filter)}
          className="group rounded-3xl border border-slate-200 bg-white px-5.5 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.subtitle}</p>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${card.tone}`}>
              <i className={`bi ${card.icon} text-lg`} />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-600">{card.badge}</p>
        </button>
      ))}
    </div>
  );
};

export default RecruiterManageJobsStats;
