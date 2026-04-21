import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import FeedbackHero from '../components/feedback/FeedbackHero';
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackCard from '../components/feedback/FeedbackCard';
import FeedbackSkeleton from '../components/feedback/FeedbackSkeleton';
import FeedbackEmpty from '../components/feedback/FeedbackEmpty';
import FeedbackPagination from '../components/feedback/FeedbackPagination';
import FeedbackModal from '../components/feedback/FeedbackModal';
import {
  buildPageRange,
  formatAvgRating,
  formatCount,
} from '../components/feedback/feedbackUtils';

const PAGE_SIZE = 9;

const Feedback = () => {
  const [filters, setFilters] = useState({ role: '', rating: '', search: '' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef(null);
  const bodyRef = useRef(null);

  const [heroStats, setHeroStats] = useState({
    total: '...',
    avg: '...',
    seekers: '...',
    recruiters: '...',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailData, setDetailData] = useState(null);

  const pageRange = useMemo(
    () => buildPageRange(page, totalPages),
    [page, totalPages]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setDetailLoading(false);
    setDetailError('');
    setDetailData(null);
  }, []);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.rating) params.set('rating', filters.rating);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(page - 1));
      params.set('size', String(PAGE_SIZE));

      const res = await fetch(`${API_BASE_URL}/public/feedback?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let list = [];
      let total = 0;
      let pages = 1;

      if (Array.isArray(data)) {
        list = data;
        total = data.length;
        pages = 1;
      } else {
        list = data.content || [];
        total = data.totalElements ?? list.length;
        pages = data.totalPages ?? 1;
      }

      setItems(list);
      setTotalElements(total);
      setTotalPages(pages);
    } catch (err) {
      setItems([]);
      setTotalElements(0);
      setTotalPages(1);
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadHeroStats = useCallback(async () => {
    try {
      const [statsRes, feedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/public/feedback-stats/ratings`),
        fetch(`${API_BASE_URL}/public/feedback?page=0&size=1`),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setHeroStats((prev) => ({
          ...prev,
          avg: formatAvgRating(stats.overallAvgRating),
        }));
      }

      if (feedRes.ok) {
        const data = await feedRes.json();
        setHeroStats((prev) => ({
          ...prev,
          total: formatCount(data.totalElements),
        }));
      }

      const [seekerRes, recruiterRes] = await Promise.all([
        fetch(`${API_BASE_URL}/public/feedback?role=JOB_SEEKER&page=0&size=1`),
        fetch(`${API_BASE_URL}/public/feedback?role=RECRUITER&page=0&size=1`),
      ]);

      if (seekerRes.ok) {
        const data = await seekerRes.json();
        setHeroStats((prev) => ({
          ...prev,
          seekers: formatCount(data.totalElements),
        }));
      }

      if (recruiterRes.ok) {
        const data = await recruiterRes.json();
        setHeroStats((prev) => ({
          ...prev,
          recruiters: formatCount(data.totalElements),
        }));
      }
    } catch (err) {
      console.error('Hero stats error:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHeroStats();
  }, [loadHeroStats]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      const trimmed = searchInput.trim();
      setPage(1);
      setFilters((prev) => {
        if (prev.search === trimmed) return prev;
        return { ...prev, search: trimmed };
      });
    }, 300);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchInput]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const handler = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, closeModal]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const handleRoleChange = (role) => {
    setFilters((prev) => ({ ...prev, role }));
    setPage(1);
  };

  const handleRatingChange = (value) => {
    setFilters((prev) => ({ ...prev, rating: value }));
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    if (bodyRef.current) {
      window.scrollTo({
        top: bodyRef.current.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  const openDetail = async (id) => {
    setModalOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetailData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/public/feedback/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDetailData(data);
    } catch (err) {
      setDetailError(err?.message || 'Failed to load review');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <FeedbackHero stats={heroStats} />
      <FeedbackFilters
        role={filters.role}
        rating={filters.rating}
        searchInput={searchInput}
        totalElements={totalElements}
        onRoleChange={handleRoleChange}
        onRatingChange={handleRatingChange}
        onSearchChange={setSearchInput}
      />
      <section ref={bodyRef} className="min-h-[60vh] bg-[#f1f5f9] py-9 pb-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[600px]:grid-cols-1">
            {loading && <FeedbackSkeleton count={PAGE_SIZE} />}
            {!loading && error && (
              <FeedbackEmpty icon="" title="Failed to load reviews">
                <p className="text-[0.875rem] text-[#64748b]">
                  Please try refreshing.
                  <br />
                  <small className="text-[#ef4444]">{error}</small>
                </p>
              </FeedbackEmpty>
            )}
            {!loading && !error && items.length === 0 && (
              <FeedbackEmpty
                icon=''
                title="No reviews found"
                message="Try changing the filters or search term."
              />
            )}
            {!loading &&
              !error &&
              items.map((item, idx) => {
                const feedbackId = item.feedbackId ?? item.id ?? idx;
                const isTop =
                  idx === 0 &&
                  page === 1 &&
                  !filters.role &&
                  !filters.rating &&
                  !filters.search;

                return (
                  <FeedbackCard
                    key={`fb-${feedbackId}`}
                    item={item}
                    fallbackId={feedbackId}
                    isTop={isTop}
                    onOpen={openDetail}
                  />
                );
              })}
          </div>
          <FeedbackPagination
            page={page}
            totalPages={totalPages}
            pageRange={pageRange}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
      <FeedbackModal
        open={modalOpen}
        loading={detailLoading}
        error={detailError}
        data={detailData}
        onClose={closeModal}
      />
    </div>
  );
};

export default Feedback;
