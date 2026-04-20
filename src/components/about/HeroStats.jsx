import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function animateCount(setter, target, duration = 1500) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(Math.floor(eased * target));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/**
 * Reusable HeroStats component.
 *
 * Props:
 * - statsConfig: array of { key, label }
 *   key must match the API response field name
 *
 * Example usage:
 * <HeroStats
 *   statsConfig={[
 *     { key: 'activeJobs',      label: 'Jobs Posted'  },
 *     { key: 'totalCompanies',  label: 'Companies'    },
 *     { key: 'totalJobSeekers', label: 'Job Seekers'  },
 *   ]}
 * />
 */
export default function HeroStats({ statsConfig }) {
  const [counts, setCounts]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/public/jobcompanyjobseeker`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setLoading(false);

        statsConfig.forEach(({ key }) => {
          animateCount(
            (val) => setCounts(prev => ({ ...prev, [key]: val })),
            data[key] ?? 0
          );
        });

      } catch (err) {
        console.warn('[HeroStats] fetch failed:', err);
        const fallback = {};
        statsConfig.forEach(({ key }) => (fallback[key] = 0));
        setCounts(fallback);
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-0">
      {statsConfig.map(({ key, label }, index) => {
        const total = statsConfig.length;
        const isLast = index === total - 1;
        const isLeftColumn = index % 2 === 0;
        const isInLastRow =
          Math.floor(index / 2) === Math.floor((total - 1) / 2);
        const baseBorders = `${isInLastRow ? '' : 'border-b'} ${
          isLeftColumn ? 'border-r' : ''
        }`;
        const desktopBorders = isLast ? 'sm:border-r-0' : 'sm:border-r';

        return (
          <div
            key={key}
            className={`w-1/2 px-[18px] py-[10px] text-center border-white/10 ${baseBorders} sm:w-auto sm:px-8 sm:py-2 sm:border-b-0 sm:border-white/15 ${desktopBorders}`.trim()}
          >
            <div
              className={`text-3xl font-extrabold text-white leading-none transition-opacity duration-500 ${
                loading ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {counts[key] !== undefined
                ? counts[key].toLocaleString()
                : '—'}
            </div>
            <div className="text-[0.72rem] text-white/50 uppercase tracking-wider mt-1">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}