import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import RecruiterReveal from './RecruiterReveal';
import RecruiterSkeleton from './RecruiterSkeleton';

const AUTO_SLIDE_MS = 3500;
const GAP = 20;

const buildUrl = (base, path) => (base ? `${base}${path}` : path);

const getPerView = () => {
  if (window.innerWidth < 768) return 1;
  if (window.innerWidth < 992) return 2;
  return 3;
};

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const StarRow = ({ rating = 0, className = '' }) => {
  const count = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      {Array.from({ length: 5 }, (_, idx) => (
        <Star
          key={idx}
          className={`h-4 w-4 ${idx < count ? 'text-[#f59e0b]' : 'text-[#e2e8f0]'}`}
          fill={idx < count ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const Avatar = ({ image, name }) => {
  const [error, setError] = useState(false);

  if (image && !error) {
    return (
      <img
        src={image}
        alt={name || ''}
        className="h-10 w-10 rounded-[10px] object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#091d33] text-[0.78rem] font-bold text-white">
      {initials(name)}
    </div>
  );
};

export default function RecruiterTestimonials() {
  const [items, setItems] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [perView, setPerView] = useState(() => (typeof window === 'undefined' ? 3 : getPerView()));
  const [step, setStep] = useState(0);
  const [slideWidth, setSlideWidth] = useState(300);
  const [outerWidth, setOuterWidth] = useState(0);
  const outerRef = useRef(null);
  const autoTimer = useRef(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    let active = true;
    const apiBase = API_BASE_URL || '';

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const [feedRes, statsRes] = await Promise.all([
          fetch(buildUrl(apiBase, '/public/feedback?role=RECRUITER&size=50&direction=desc')),
          fetch(buildUrl(apiBase, '/public/feedback-stats/ratings')),
        ]);

        if (!feedRes.ok) throw new Error(`HTTP ${feedRes.status}`);
        const data = await feedRes.json();
        const recruiters = (data.content || []).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

        let recruiterAvg = null;
        if (statsRes.ok) {
          const stats = await statsRes.json();
          recruiterAvg = stats.recruiterAvgRating;
        }

        if (!active) return;
        setItems(recruiters);
        setAvgRating(recruiterAvg);
      } catch (err) {
        if (!active) return;
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const slides = useMemo(() => {
    if (!items.length) return [];
    const reviewSlides = items.map((item, idx) => ({ type: 'review', item, featured: idx === 0 }));
    const avg =
      avgRating !== null && avgRating !== undefined
        ? Number(avgRating).toFixed(1)
        : (items.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / items.length).toFixed(1);
    reviewSlides.push({ type: 'summary', avg, count: items.length });
    return reviewSlides;
  }, [items, avgRating]);

  const totalPages = Math.max(1, Math.ceil(slides.length / perView));

  const stopAuto = useCallback(() => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    if (totalPages <= 1) return;
    autoTimer.current = setInterval(() => {
      setStep((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
    }, AUTO_SLIDE_MS);
  }, [stopAuto, totalPages]);

  useEffect(() => {
    startAuto();
    return () => stopAuto();
  }, [startAuto, stopAuto]);

  useEffect(() => {
    const handleResize = () => setPerView(getPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setStep(0);
  }, [perView, slides.length]);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const width = outer.offsetWidth;
    setOuterWidth(width);
    const calc = width ? (width - GAP * (perView - 1)) / perView : 300;
    setSlideWidth(calc);
  }, [perView, slides.length]);

  const clampStep = (next) => Math.max(0, Math.min(next, totalPages - 1));

  const goTo = (next) => {
    setStep(clampStep(next));
  };

  const slideBy = (dir) => {
    stopAuto();
    setStep((prev) => clampStep(prev + dir));
    startAuto();
  };

  const trackWidth = slides.length ? slides.length * slideWidth + GAP * (slides.length - 1) : 0;
  const maxOffset = Math.max(0, trackWidth - outerWidth);
  const offset = Math.min(step * perView * (slideWidth + GAP), maxOffset);

  return (
    <section className="bg-[#f4f6f9] py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <RecruiterReveal className="text-center">
          <SectionLabel />
        </RecruiterReveal>

        <div className="mt-10">
          <RecruiterReveal>
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(24,169,156,0.1)] px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[1px] text-[#18a99c]">
                <Building2 className="h-4 w-4" aria-hidden="true" /> Recruiters
              </div>
              <div className="flex-1 border-t border-[#e2e8f0]" />
              <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[0.75rem] text-[#64748b]">
                {items.length} review{items.length === 1 ? '' : 's'}
              </span>
            </div>
          </RecruiterReveal>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-[#e2e8f0] bg-white p-6"
                >
                  <RecruiterSkeleton variant="light" className="mb-4 h-[14px] w-1/3" />
                  <RecruiterSkeleton variant="light" className="mb-2 h-[12px] w-full" />
                  <RecruiterSkeleton variant="light" className="mb-2 h-[12px] w-4/5" />
                  <RecruiterSkeleton variant="light" className="h-[12px] w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-12 text-center text-[#94a3b8]">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-30" aria-hidden="true" />
              <p className="text-[0.88rem]">Unable to load reviews right now.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-12 text-center text-[#94a3b8]">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-30" aria-hidden="true" />
              <p className="text-[0.88rem]">No recruiter reviews yet.</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={outerRef}
                className="overflow-hidden rounded-[18px]"
                onMouseEnter={stopAuto}
                onMouseLeave={startAuto}
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0].clientX;
                }}
                onTouchEnd={(event) => {
                  const diff = touchStartX.current - event.changedTouches[0].clientX;
                  if (Math.abs(diff) > 40) slideBy(diff > 0 ? 1 : -1);
                }}
              >
                <div
                  className="flex"
                  style={{
                    gap: `${GAP}px`,
                    transform: `translateX(-${offset}px)`,
                    transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)',
                  }}
                >
                  {slides.map((slide, idx) => {
                    if (slide.type === 'summary') {
                      return (
                        <div
                          key={`summary-${idx}`}
                          className="shrink-0"
                          style={{ minWidth: slideWidth, width: slideWidth }}
                        >
                          <div className="flex h-full flex-col items-center justify-center rounded-[16px] border border-white/10 bg-[#091d33] p-6 text-center">
                            <div className="text-[3.2rem] font-extrabold text-white">
                              {slide.avg}
                            </div>
                            <StarRow rating={Math.round(slide.avg)} className="mb-2 mt-2" />
                            <p className="text-[0.8rem] font-semibold text-white/70">Recruiter Rating</p>
                            <p className="text-[0.8rem] text-white/50">
                              from {slide.count} review{slide.count === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const { item, featured } = slide;
                    return (
                      <div
                        key={`review-${idx}`}
                        className="shrink-0"
                        style={{ minWidth: slideWidth, width: slideWidth }}
                      >
                        <div
                          className={`relative flex h-full flex-col rounded-[16px] border border-[#e2e8f0] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[rgba(24,169,156,0.3)] hover:shadow-[0_8px_32px_rgba(9,29,51,0.12)] ${
                            featured ? 'border-[#18a99c]' : ''
                          }`}
                        >
                          <div
                            className={`absolute left-0 right-0 top-0 h-[3px] origin-left rounded-t-[16px] bg-[linear-gradient(90deg,#18a99c,#0fd4c4)] ${
                              featured ? 'scale-x-100' : 'scale-x-0'
                            }`}
                          />
                          {featured ? (
                            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-[rgba(24,169,156,0.1)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.5px] text-[#18a99c]">
                              <Star className="h-3 w-3" aria-hidden="true" /> Top Rated
                            </span>
                          ) : null}
                          <StarRow rating={item.rating} className="mb-3" />
                          <p className="mb-4 line-clamp-4 text-[0.85rem] italic leading-[1.75] text-[#64748b]">
                            "{item.message || item.subject || ''}"
                          </p>
                          <div className="mt-auto flex items-center gap-3 border-t border-[#f0f4f8] pt-4">
                            <Avatar image={item.profileImage} name={item.fullName} />
                            <div>
                              <strong className="block text-[0.82rem] font-bold text-[#0d1b2a]">
                                {item.fullName || 'Anonymous'}
                              </strong>
                              {item.companyName ? (
                                <span className="block text-[0.7rem] font-bold text-[#18a99c]">
                                  {item.companyName}
                                </span>
                              ) : null}
                              <span className="text-[0.72rem] text-[#64748b]">
                                {item.subject ? `${item.subject} - ` : ''}
                                {timeAgo(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#091d33] transition hover:border-[#18a99c] hover:bg-[#18a99c] hover:text-white disabled:opacity-40"
                    onClick={() => slideBy(-1)}
                    disabled={step === 0}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`h-[7px] rounded-full transition ${
                          step === idx ? 'w-5 bg-[#18a99c]' : 'w-[7px] bg-[#e2e8f0]'
                        }`}
                        onClick={() => goTo(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#091d33] transition hover:border-[#18a99c] hover:bg-[#18a99c] hover:text-white disabled:opacity-40"
                    onClick={() => slideBy(1)}
                    disabled={step >= totalPages - 1}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SectionLabel = () => (
  <>
    <span className="mb-3 inline-flex items-center justify-center text-[11px] font-semibold uppercase tracking-[2px] text-[#18a99c]">
      Reviews
    </span>
    <h2 className="text-[clamp(1.7rem,3vw,2.6rem)] font-extrabold leading-[1.1] tracking-[1px] text-[#091d33]">
      What Recruiters Say
    </h2>
    <p className="mx-auto mt-3 max-w-[520px] text-[1rem] leading-[1.7] text-[#666]">
      Real results from real hiring teams using RojgarShine.
    </p>
  </>
);
