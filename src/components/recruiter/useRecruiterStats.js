import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const buildUrl = (base, path) => (base ? `${base}${path}` : path);

export default function useRecruiterStats() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const apiBase = API_BASE_URL || '';
    const apiOne = buildUrl(apiBase, '/public/alljobsrecruiterusers');
    const apiTwo = buildUrl(apiBase, '/public/jobcompanyjobseeker');

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch(apiOne).then((res) => (res.ok ? res.json() : Promise.reject(res.status))),
          fetch(apiTwo).then((res) => (res.ok ? res.json() : Promise.reject(res.status))),
        ]);

        const api1Data = r1.status === 'fulfilled' ? r1.value : null;
        const api2Data = r2.status === 'fulfilled' ? r2.value : null;

        if (!active) return;

        setStats({
          recruiters: api1Data?.recruiters,
          users: api1Data?.users,
          totalJobs: api1Data?.totalJobs,
          totalJobSeekers: api2Data?.totalJobSeekers,
          totalCompanies: api2Data?.totalCompanies,
          activeJobs: api2Data?.activeJobs,
        });
      } catch (err) {
        if (!active) return;
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, error };
}
