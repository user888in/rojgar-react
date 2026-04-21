import RecruiterSkeleton from './RecruiterSkeleton';
import { useCountUp } from './utils';

const metrics = [
  { key: 'recruiters', label: 'Registered Recruiters' },
  { key: 'totalJobSeekers', label: 'Registered Job Seekers' },
  { key: 'totalJobs', label: 'Total Jobs Posted' },
  { key: 'activeJobs', label: 'Active Listings Now' },
];

const MetricCard = ({ label, value, delay }) => {
  const { value: count, ref } = useCountUp(value);
  const showSkeleton = value === undefined || value === null;

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-[#eef0f3] bg-white p-8 text-center transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(9,29,51,0.07)]"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex min-h-[3.2rem] items-center justify-center text-[2.8rem] font-extrabold text-[#091d33]">
        {showSkeleton ? (
          <RecruiterSkeleton variant="light" className="h-[2.8rem] w-20 rounded" />
        ) : (
          <span className="text-[#18a99c]">{count}</span>
        )}
      </div>
      <div className="mt-2 text-[0.85rem] text-[#888]">{label}</div>
      <div className="absolute bottom-0 left-0 right-0 h-0.75 origin-left scale-x-0 bg-[linear-gradient(90deg,#18a99c,#0fd4c4)] transition duration-300 group-hover:scale-x-100" />
    </div>
  );
};

export default function RecruiterMetrics({ stats }) {
  return (
    <section className="bg-[#f4f6f9] py-20">
      <div className="mx-auto max-w-300 px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((item, index) => (
            <MetricCard
              key={item.key}
              label={item.label}
              value={stats?.[item.key]}
              delay={index * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
