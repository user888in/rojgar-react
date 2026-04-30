import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Tag,
  Search,
  Zap,
  ShieldCheck,
  Building2,
  BarChart3,
  Headphones,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Calendar,
  Clock,
  MessageCircle,
  Sparkles,
  User,
  Info,
  ArrowRight,
  Grid3X3,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";
import rojgar_shine_hero from "../assets/images/hero-index-img.jpg";

import mumbai from "../assets/images/mumbai.png";
import chennai from "../assets/images/chennai.png";
import bengaluru from "../assets/images/bengaluru.png";
import hyderabad from "../assets/images/hyderabad.png";
import kolkata from "../assets/images/kolkata.png";
import delhi from "../assets/images/delhi-ncr.png";
import ahmedabad from "../assets/images/ahmedabad.png";
import banner from "../assets/images/Rojgarshine Website Banner.png";
// Helper functions
const fbDmInitials = (name) => {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const fbDmStars = (n) => {
  let stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= n ? "text-amber-500" : "text-slate-200"}>
        ★
      </span>,
    );
  }
  return stars;
};

const fbDmFormatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fbDmTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const tStars = (rating) => {
  const r = Math.round(rating ?? 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
};

const tInitials = (name) => {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const tTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const formatHeroStat = (value) => {
  const num = Number(value) || 0;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, "")}m+`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1).replace(/\.0$/, "")}K+`;
  }
  return `${num}+`;
};

const useAnimatedHeroStat = (target, duration = 1300) => {
  const [display, setDisplay] = useState("0+");

  useEffect(() => {
    const finalValue = Number(target) || 0;
    if (finalValue <= 0) {
      setDisplay("0+");
      return;
    }

    const steps = 45;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += finalValue / steps;
      if (current >= finalValue) {
        clearInterval(timer);
        setDisplay(formatHeroStat(finalValue));
      } else {
        setDisplay(formatHeroStat(Math.floor(current)));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return display;
};

const HeroStatItem = ({ value, label }) => {
  const displayValue = useAnimatedHeroStat(value);

  return (
    <div className="flex flex-col">
      <strong className="text-2xl font-extrabold text-white">
        {displayValue}
      </strong>
      <span className="text-[0.75rem] text-white/50 mt-px">{label}</span>
    </div>
  );
};
const Home = () => {
  const navigate = useNavigate();

  // State for hero stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    companies: 0,
    jobSeekers: 0,
  });

  // State for companies slider
  const [companies, setCompanies] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const sliderRef = useRef(null);
  const trackRef = useRef(null);
  const CARD_W = 175 + 16;
  const CARDS_PER_STEP = 3;

  // State for search inputs
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  // Autocomplete states
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showTitleDrop, setShowTitleDrop] = useState(false);
  const [showLocationDrop, setShowLocationDrop] = useState(false);
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Testimonials state
  const [seekers, setSeekers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [seekerAvg, setSeekerAvg] = useState(null);
  const [recruiterAvg, setRecruiterAvg] = useState(null);
  const [seekerStep, setSeekerStep] = useState(0);
  const [recruiterStep, setRecruiterStep] = useState(0);
  const [seekerTotal, setSeekerTotal] = useState(0);
  const [recruiterTotal, setRecruiterTotal] = useState(0);
  const [seekerPerView, setSeekerPerView] = useState(3);
  const [recruiterPerView, setRecruiterPerView] = useState(3);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Typing effect state
  const [displayWord, setDisplayWord] = useState("");
  const wordIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  const words = [
    "Confidence.",
    "Passion.",
    "Purpose.",
    "Opportunity.",
    "RojgarShine.",
  ];

  // Typing effect
  useEffect(() => {
    const speed = 120;
    const eraseSpeed = 80;
    const delay = 1500;

    const typeEffect = () => {
      const currentWord = words[wordIndexRef.current];

      if (!isDeletingRef.current) {
        setDisplayWord(currentWord.substring(0, charIndexRef.current + 1));
        charIndexRef.current++;
      } else {
        setDisplayWord(currentWord.substring(0, charIndexRef.current - 1));
        charIndexRef.current--;
      }

      let typingSpeed = isDeletingRef.current ? eraseSpeed : speed;

      if (
        !isDeletingRef.current &&
        charIndexRef.current === currentWord.length
      ) {
        typingSpeed = delay;
        isDeletingRef.current = true;
      } else if (isDeletingRef.current && charIndexRef.current === 0) {
        isDeletingRef.current = false;
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
      }

      setTimeout(typeEffect, typingSpeed);
    };

    typeEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load hero stats
  const loadHeroStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/public/jobcompanyjobseeker`,
        {
          credentials: "include",
        },
      );
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeJobs: Number(data.activeJobs) || 0,
          companies: Number(data.totalCompanies) || 0,
          jobSeekers: Number(data.totalJobSeekers) || 0,
        });
      } else {
        console.error(`Stats API error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  // Load companies
  const loadCompanies = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/public`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.content || []);
        setCompanies(list);
        setTotalSteps(Math.ceil(list.length / CARDS_PER_STEP));
      } else {
        console.error(`Companies API error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  }, []);

  // Load testimonials
  const loadTestimonials = useCallback(async () => {
    setLoadingTestimonials(true);
    try {
      const [feedRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/public/feedback?page=0&size=20&direction=desc`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/public/feedback-stats/ratings`, {
          credentials: "include",
        }),
      ]);

      if (!feedRes.ok) {
        console.error(`Feedback API error: HTTP ${feedRes.status}`);
      }
      if (!statsRes.ok) {
        console.error(`Feedback stats API error: HTTP ${statsRes.status}`);
      }

      if (feedRes.ok) {
        const data = await feedRes.json();
        const all = Array.isArray(data) ? data : data.content || [];

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setSeekerAvg(statsData.jobSeekerAvgRating);
          setRecruiterAvg(statsData.recruiterAvgRating);
        }

        const seekersList = all
          .filter((f) => f.role === "JOB_SEEKER")
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        const recruitersList = all
          .filter((f) => f.role === "RECRUITER")
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

        setSeekers(seekersList);
        setRecruiters(recruitersList);

        // Calculate total slides
        const perView =
          window.innerWidth < 768 ? 1 : window.innerWidth < 992 ? 2 : 3;
        setSeekerPerView(perView);
        setRecruiterPerView(perView);
        setSeekerTotal(Math.ceil((seekersList.length + 1) / perView));
        setRecruiterTotal(Math.ceil((recruitersList.length + 1) / perView));
      }
    } catch (error) {
      console.error("Failed to load testimonials:", error);
    } finally {
      setLoadingTestimonials(false);
    }
  }, []);

  // Fetch suggestions
  const fetchTitleSuggestions = async (query) => {
    const response = await fetch(
      `${API_BASE_URL}/public/suggestions/titles?q=${encodeURIComponent(query)}`,
      { credentials: "include" },
    );
    if (response.ok) return await response.json();
    return [];
  };

  const fetchLocationSuggestions = async (query) => {
    const response = await fetch(
      `${API_BASE_URL}/public/suggestions/locations?q=${encodeURIComponent(query)}`,
      { credentials: "include" },
    );
    if (response.ok) return await response.json();
    return [];
  };

  const fetchCategorySuggestions = async (query) => {
    const response = await fetch(
      `${API_BASE_URL}/public/suggestions/categories?q=${encodeURIComponent(query)}`,
      { credentials: "include" },
    );
    if (response.ok) return await response.json();
    return [];
  };

  // Debounced search for autocomplete
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTitleSearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) {
        setTitleSuggestions([]);
        setShowTitleDrop(false);
        return;
      }
      setLoadingTitle(true);
      try {
        const items = await fetchTitleSuggestions(q);
        setTitleSuggestions(items);
        setShowTitleDrop(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTitle(false);
      }
    }, 300),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleLocationSearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) {
        setLocationSuggestions([]);
        setShowLocationDrop(false);
        return;
      }
      setLoadingLocation(true);
      try {
        const items = await fetchLocationSuggestions(q);
        setLocationSuggestions(items);
        setShowLocationDrop(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingLocation(false);
      }
    }, 300),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCategorySearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) {
        setCategorySuggestions([]);
        setShowCategoryDrop(false);
        return;
      }
      setLoadingCategory(true);
      try {
        const items = await fetchCategorySuggestions(q);
        setCategorySuggestions(items);
        setShowCategoryDrop(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategory(false);
      }
    }, 300),
    [],
  );

  // Go to jobs page with search params
  const goToJobsPage = () => {
    const params = new URLSearchParams();
    if (searchTitle) params.append("title", searchTitle);
    if (searchLocation) params.append("location", searchLocation);
    if (searchCategory) params.append("category", searchCategory);
    navigate(`/jobs?${params.toString()}`);
  };

  // Select city
  const selectCity = (city) => {
    navigate(`/jobs?location=${encodeURIComponent(city)}`);
  };

  // Company slider functions
  const goToStep = (step) => {
    const newStep = Math.max(0, Math.min(step, totalSteps - 1));
    setCurrentStep(newStep);
    if (sliderRef.current && trackRef.current) {
      const offset = newStep * CARDS_PER_STEP * CARD_W;
      const maxOff =
        sliderRef.current.scrollWidth - trackRef.current.offsetWidth;
      sliderRef.current.style.transform = `translateX(-${Math.min(offset, maxOff < 0 ? 0 : maxOff)}px)`;
    }
  };

  const slide = (direction) => goToStep(currentStep + direction);

  // Testimonial carousel functions
  const getPerView = () => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 992) return 2;
    return 3;
  };

  const tGoTo = (type, step) => {
    if (type === "seeker") {
      setSeekerStep(step);
      setTimeout(() => {
        const track = document.querySelector(".seeker-track");
        if (track) {
          const container = track.parentElement;
          if (container) {
            const containerWidth = container.offsetWidth;
            const gap = 20;
            const slideWidth =
              (containerWidth - (seekerPerView - 1) * gap) / seekerPerView;
            const offset = step * seekerPerView * (slideWidth + gap);
            track.style.transform = `translateX(-${offset}px)`;
          }
        }
      }, 50);
    } else {
      setRecruiterStep(step);
      setTimeout(() => {
        const track = document.querySelector(".recruiter-track");
        if (track) {
          const container = track.parentElement;
          if (container) {
            const containerWidth = container.offsetWidth;
            const gap = 20;
            const slideWidth =
              (containerWidth - (recruiterPerView - 1) * gap) /
              recruiterPerView;
            const offset = step * recruiterPerView * (slideWidth + gap);
            track.style.transform = `translateX(-${offset}px)`;
          }
        }
      }, 50);
    }
  };

  const tSlide = (type, dir) => {
    if (type === "seeker") {
      tGoTo("seeker", seekerStep + dir);
    } else {
      tGoTo("recruiter", recruiterStep + dir);
    }
  };

  // Open feedback detail modal
  const openFeedbackDetail = async (id) => {
    setShowFeedbackModal(true);
    setLoadingFeedback(true);
    try {
      const response = await fetch(`${API_BASE_URL}/public/feedback/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedFeedback(data);
      }
    } catch (error) {
      console.error("Failed to load feedback detail:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedFeedback(null);
  };

  // Handle click outside modal
  const handleModalBgClick = (e) => {
    if (e.target === e.currentTarget) closeFeedbackModal();
  };

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeFeedbackModal();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Intersection Observer for fade-up animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Handle resize for carousel
  useEffect(() => {
    const handleResize = () => {
      const perView = getPerView();
      if (perView !== seekerPerView) {
        setSeekerPerView(perView);
        setRecruiterPerView(perView);
        setSeekerTotal(Math.ceil((seekers.length + 1) / perView));
        setRecruiterTotal(Math.ceil((recruiters.length + 1) / perView));
        setSeekerStep(0);
        setRecruiterStep(0);
        // Trigger transform update after resize
        setTimeout(() => {
          const seekerTrack = document.querySelector(".seeker-track");
          const recruiterTrack = document.querySelector(".recruiter-track");
          if (seekerTrack) {
            seekerTrack.style.transform = `translateX(0px)`;
          }
          if (recruiterTrack) {
            recruiterTrack.style.transform = `translateX(0px)`;
          }
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [seekers.length, recruiters.length, seekerPerView, recruiterPerView]);

  // Initial data loading
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadHeroStats();
    loadCompanies();
    loadTestimonials();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadHeroStats, loadCompanies, loadTestimonials]);

  // Build testimonial card
  const buildTestimonialCard = (feedback, idx, isFeatured = idx === 0) => {
    const avatarHtml = feedback.profileImage ? (
      <div className="flex-shrink-0 relative">
        <img
          src={feedback.profileImage}
          alt={feedback.fullName || ""}
          className="w-[38px] h-[38px] rounded-[10px] object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {!feedback.profileImage && (
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#091d33] flex items-center justify-center text-white text-xs font-bold">
            {tInitials(feedback.fullName)}
          </div>
        )}
      </div>
    ) : (
      <div className="w-[38px] h-[38px] rounded-[10px] bg-[#091d33] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {tInitials(feedback.fullName)}
      </div>
    );

    return (
      <div
        className={`bg-white rounded-[16px] p-[26px] border-[1.5px] ${isFeatured ? "border-[#18a99c]" : "border-[#e2e8f0]"} transition-all duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer flex flex-col h-full`}
        onClick={() => openFeedbackDetail(feedback.feedbackId || feedback.id)}
      >
        {isFeatured && (
          <div className="inline-block bg-[#e6f7f6] text-[#18a99c] text-[0.68rem] font-bold tracking-wide uppercase px-[10px] py-[3px] rounded-full mb-3">
            ⭐ Top Rated
          </div>
        )}
        <div className="text-sm mb-3 tracking-wide text-amber-500">
          {tStars(feedback.rating)}
        </div>
        <p className="text-sm text-[#64748b] leading-relaxed mb-[18px] italic flex-1 line-clamp-4">
          "{feedback.message || feedback.subject || ""}"
        </p>
        <div className="flex items-center gap-[10px] pt-4 border-t border-[#f0f4f8] mt-auto">
          {avatarHtml}
          <div>
            <strong className="block text-[0.82rem] font-bold text-[#091d33]">
              {feedback.fullName || "Anonymous"}
            </strong>
            {feedback.companyName && (
              <span className="text-[0.7rem] font-bold text-[#18a99c] block mb-px">
                <Building2 className="inline w-3 h-3 mr-0.5" />{" "}
                {feedback.companyName}
              </span>
            )}
            <span className="text-[0.72rem] text-[#64748b]">
              {feedback.subject || ""} · {tTimeAgo(feedback.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Build rating summary
  const buildRatingSummary = (list, label, avgOverride) => {
    if (!list.length) return null;
    const avg =
      avgOverride !== undefined
        ? avgOverride
        : (list.reduce((s, f) => s + (f.rating ?? 0), 0) / list.length).toFixed(
            1,
          );
    return (
      <div className="bg-[#091d33] rounded-[16px] p-[26px] flex flex-col items-center justify-center text-center border-[1.5px] border-white/10 h-full">
        <div className="text-5xl font-extrabold text-white leading-tight">
          {avg}
        </div>
        <div className="text-base my-2 tracking-wide text-amber-500">
          {tStars(Math.round(avg))}
        </div>
        <p className="text-[0.8rem] text-white/70 font-semibold mt-2 mb-1">
          {label}
        </p>
        <p className="text-[0.8rem] text-white/50">
          from {list.length} review{list.length !== 1 ? "s" : ""}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-[#f1f5f9]">
      {/* HERO SECTION */}
      <section className="bg-[#091d33] relative overflow-hidden py-20 md:py-24">
        <div className="absolute top-[-120px] right-[-120px] w-[520px] h-[520px] rounded-full bg-gradient-radial from-[#18a99c]/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-gradient-radial from-[#18a99c]/10 to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="lg:w-7/12 animate-[floatUp_0.6s_ease_both]">
              <div className="inline-flex items-center gap-2 bg-[#18a99c]/20 border border-[#18a99c]/30 text-[#18a99c] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                #1 Job Platform in India
              </div>
              <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-3.5">
                Build Your Career
                <br />
                With{" "}
                <span className="text-[#18a99c]" id="changing-word">
                  {displayWord}
                </span>
              </h1>
              <p className="text-white/60 text-base md:text-lg mb-9 leading-relaxed">
                Search smart. Apply faster. Get hired by top companies
                <br />
                that are actively looking for talent like yours.
              </p>

              {/* Search Bar */}
              <div className="bg-white/5 border border-white/10 rounded-[14px] p-1.5 backdrop-blur-sm flex flex-col md:flex-row gap-1 max-w-[680px]">
                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] relative">
                  <Search className="w-3.5 h-3.5 text-[#18a99c] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Job title, skills…"
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/40"
                    value={searchTitle}
                    onChange={(e) => {
                      setSearchTitle(e.target.value);
                      handleTitleSearch(e.target.value);
                    }}
                    onFocus={() =>
                      searchTitle.length >= 2 && setShowTitleDrop(true)
                    }
                  />
                  {showTitleDrop && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-[9999] overflow-hidden">
                      {loadingTitle ? (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] flex items-center gap-2 justify-center">
                          <div className="w-3 h-3 border-2 border-[#e2e8f0] border-t-[#18a99c] rounded-full animate-spin"></div>
                          Searching…
                        </div>
                      ) : titleSuggestions.length > 0 ? (
                        titleSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#091d33] cursor-pointer hover:bg-[#e6f7f6]"
                            onClick={() => {
                              setSearchTitle(item);
                              setShowTitleDrop(false);
                            }}
                          >
                            <Briefcase className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] text-center">
                          No suggestions found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border-t md:border-t-0 md:border-l border-white/10 relative">
                  <MapPin className="w-3.5 h-3.5 text-[#18a99c] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location…"
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/40"
                    value={searchLocation}
                    onChange={(e) => {
                      setSearchLocation(e.target.value);
                      handleLocationSearch(e.target.value);
                    }}
                    onFocus={() =>
                      searchLocation.length >= 2 && setShowLocationDrop(true)
                    }
                  />
                  {showLocationDrop && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-[9999] overflow-hidden">
                      {loadingLocation ? (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] flex items-center gap-2 justify-center">
                          <div className="w-3 h-3 border-2 border-[#e2e8f0] border-t-[#18a99c] rounded-full animate-spin"></div>
                          Searching…
                        </div>
                      ) : locationSuggestions.length > 0 ? (
                        locationSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#091d33] cursor-pointer hover:bg-[#e6f7f6]"
                            onClick={() => {
                              setSearchLocation(item);
                              setShowLocationDrop(false);
                            }}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] text-center">
                          No suggestions found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border-t md:border-t-0 md:border-l border-white/10 relative">
                  <Tag className="w-3.5 h-3.5 text-[#18a99c] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Category…"
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/40"
                    value={searchCategory}
                    onChange={(e) => {
                      setSearchCategory(e.target.value);
                      handleCategorySearch(e.target.value);
                    }}
                    onFocus={() =>
                      searchCategory.length >= 2 && setShowCategoryDrop(true)
                    }
                  />
                  {showCategoryDrop && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-[9999] overflow-hidden">
                      {loadingCategory ? (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] flex items-center gap-2 justify-center">
                          <div className="w-3 h-3 border-2 border-[#e2e8f0] border-t-[#18a99c] rounded-full animate-spin"></div>
                          Searching…
                        </div>
                      ) : categorySuggestions.length > 0 ? (
                        categorySuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#091d33] cursor-pointer hover:bg-[#e6f7f6]"
                            onClick={() => {
                              setSearchCategory(item);
                              setShowCategoryDrop(false);
                            }}
                          >
                            <Tag className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3.5 py-3 text-xs text-[#64748b] text-center">
                          No suggestions found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={goToJobsPage}
                  className="bg-[#18a99c] border-none rounded-[10px] text-white px-7 py-2.5 text-sm font-bold cursor-pointer whitespace-nowrap transition-all hover:bg-[#14968a] hover:-translate-y-px hover:shadow-lg flex-shrink-0"
                >
                  <Search className="inline w-3.5 h-3.5 mr-1" /> Search
                </button>
              </div>

              <div className="flex flex-wrap gap-7 mt-8">
                <HeroStatItem value={stats.activeJobs} label="Active Jobs" />
                <HeroStatItem value={stats.companies} label="Companies" />
                <HeroStatItem value={stats.jobSeekers} label="Job Seekers" />
              </div>
            </div>

            <div className="lg:w-5/12">
              <div className="relative animate-[floatUp_0.8s_ease_both]">
                <div className="absolute inset-[-12px] rounded-[28px] bg-gradient-to-br from-[#18a99c]/25 to-transparent z-0"></div>
                <img
                  src={rojgar_shine_hero}
                  alt="RojgarShine Hero"
                  className="relative z-10 rounded-2xl w-full shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-5 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center mb-12 fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="inline-flex items-center gap-1.5 bg-[#e6f7f6] text-[#18a99c] px-3.5 py-1 rounded-full text-[0.72rem] font-bold tracking-wide uppercase mb-3">
              <Info className="w-3.5 h-3.5" /> How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#091d33] tracking-tight mb-1.5">
              Three Steps to Your Dream Job
            </h2>
            <p className="text-base text-[#64748b]">
              Simple, fast and built for job seekers like you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 bg-[#091d33] rounded-[16px] overflow-hidden fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="p-9 border-b md:border-b-0 md:border-r border-white/10 transition-colors hover:bg-white/5">
              <div className="text-5xl font-extrabold text-white/5 leading-none mb-4 select-none">
                01
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-4">
                <User className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-2">
                Create Your Profile
              </h5>
              <p className="text-sm text-white/55 leading-relaxed">
                Sign up in seconds and build a professional profile that stands
                out to top employers.
              </p>
            </div>
            <div className="p-9 border-b md:border-b-0 md:border-r border-white/10 transition-colors hover:bg-white/5">
              <div className="text-5xl font-extrabold text-white/5 leading-none mb-4 select-none">
                02
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-2">
                Search Smart
              </h5>
              <p className="text-sm text-white/55 leading-relaxed">
                Explore thousands of verified job openings filtered by role,
                location, and salary.
              </p>
            </div>
            <div className="p-9 transition-colors hover:bg-white/5">
              <div className="text-5xl font-extrabold text-white/5 leading-none mb-4 select-none">
                03
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-2">Get Hired</h5>
              <p className="text-sm text-white/55 leading-relaxed">
                Apply with one click and track your applications — from applied
                to hired.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOP HIRING COMPANIES */}
      <section className="py-16 bg-[#f1f5f9]" id="companies">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 bg-[#e6f7f6] text-[#18a99c] px-3.5 py-1 rounded-full text-[0.72rem] font-bold tracking-wide uppercase mb-3">
              <Building2 className="w-3.5 h-3.5" /> Top Companies
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#091d33] tracking-tight mb-1.5">
              Companies Actively Hiring
            </h2>
            <p className="text-base text-[#64748b]">
              Join thousands of professionals hired through our platform
            </p>
          </div>

          <div className="relative px-12">
            <button
              onClick={() => slide(-1)}
              className={`absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-[#e2e8f0] rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-10 shadow-sm transition-all hover:bg-[#18a99c] hover:text-white hover:border-[#18a99c] ${currentStep === 0 ? "opacity-35 pointer-events-none" : ""}`}
              aria-label="Previous companies"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="overflow-hidden rounded">
              <div ref={trackRef} className="overflow-hidden">
                <div
                  ref={sliderRef}
                  className="flex gap-4 transition-transform duration-300 will-change-transform py-2"
                  style={{
                    transform: `translateX(-${currentStep * CARDS_PER_STEP * CARD_W}px)`,
                  }}
                >
                  {Array.isArray(companies) && companies.map((company) => {
                    const initials = company.companyName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={company.companyId || company.id}
                        className="flex-none w-[175px] bg-white rounded-[16px] p-5 text-center shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#18a99c] border-[1.5px] border-transparent"
                        onClick={() =>
                          navigate(`/companies/${company.companyId || company.id}`)
                        }
                      >
                        <div className="w-full h-20 rounded-xl flex items-center justify-center overflow-hidden">
                          {company.companyLogo ? (
                            <img
                              src={company.companyLogo}
                              alt={company.companyName}
                              className="w-full h-full object-contain bg-white p-1.5 rounded-xl"
                            />
                          ) : (
                            <div className="text-xl font-extrabold text-[#091d33]">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="text-[0.84rem] font-bold text-[#091d33] mt-2 mb-0.5">
                          {company.companyName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => slide(1)}
              className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-[#e2e8f0] rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-10 shadow-sm transition-all hover:bg-[#18a99c] hover:text-white hover:border-[#18a99c] ${currentStep >= totalSteps - 1 ? "opacity-35 pointer-events-none" : ""}`}
              aria-label="Next companies"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === currentStep ? "bg-[#18a99c] w-5 rounded" : "bg-[#e2e8f0]"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-[#091d33]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="inline-flex items-center gap-1.5 bg-[#18a99c]/20 text-[#18a99c] px-3.5 py-1 rounded-full text-[0.72rem] font-bold tracking-wide uppercase mb-3">
              <Star className="w-3.5 h-3.5" /> Why Us
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1.5">
              Why Choose Rojgar<span className="text-[#18a99c]">Shine</span>
            </h2>
            <p className="text-base text-white/50">
              Your trusted partner in career growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-7 transition-all hover:bg-white/10 hover:-translate-y-1">
              <div className="w-[50px] h-[50px] rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-[18px]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-white mb-2">
                Verified Employers
              </h5>
              <p className="text-[0.84rem] text-white/50 leading-relaxed">
                Every company is verified. Apply only to trusted and genuine
                employers.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-7 transition-all hover:bg-white/10 hover:-translate-y-1">
              <div className="w-[50px] h-[50px] rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-[18px]">
                <Zap className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-white mb-2">Easy Apply</h5>
              <p className="text-[0.84rem] text-white/50 leading-relaxed">
                Apply to any job with a single click. No endless forms, just
                results.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-7 transition-all hover:bg-white/10 hover:-translate-y-1">
              <div className="w-[50px] h-[50px] rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-[18px]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-white mb-2">
                Career Growth
              </h5>
              <p className="text-[0.84rem] text-white/50 leading-relaxed">
                Curated opportunities that match your skills and ambitions.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-7 transition-all hover:bg-white/10 hover:-translate-y-1">
              <div className="w-[50px] h-[50px] rounded-xl bg-[#18a99c]/20 flex items-center justify-center text-[#18a99c] text-xl mb-[18px]">
                <Headphones className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-white mb-2">
                24/7 Support
              </h5>
              <p className="text-[0.84rem] text-white/50 leading-relaxed">
                Our team is always here whenever you need guidance or help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOP CITIES */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="inline-flex items-center gap-1.5 bg-[#e6f7f6] text-[#18a99c] px-3.5 py-1 rounded-full text-[0.72rem] font-bold tracking-wide uppercase mb-3">
              <MapPin className="w-3.5 h-3.5" /> Browse by City
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#091d33] tracking-tight mb-1.5">
              Top Job Markets Near You
            </h2>
            <p className="text-base text-[#64748b]">
              Explore thousands of openings in India's biggest cities
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 py-2 mt-8">
            {[
              { name: "Mumbai", img: mumbai },
              { name: "Chennai", img: chennai },
              { name: "Bangalore", img: bengaluru },
              { name: "Hyderabad", img: hyderabad },
              { name: "Kolkata", img: kolkata },
              { name: "Delhi", img: delhi },
              { name: "Ahmedabad", img: ahmedabad },
            ].map((city) => (
              <div
                key={city.name}
                className="border border-transparent rounded-[16px] px-6 py-8 text-center cursor-pointer transition-all transform-gpu hover:shadow-md hover:border-[#57dfd3] hover:bg-[#f2fcfb] min-w-[110px]"
                onClick={() => selectCity(city.name)}
              >
                <img
                  src={city.img}
                  alt={city.name}
                  className="w-[90px] h-[52px] rounded-[10px] mb-2.5 mx-auto"
                />
                <p className="text-[0.82rem] font-bold text-[#091d33]">
                  {city.name}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-2 bg-[#091d33] text-white border-none rounded-xl px-8 py-3 text-sm font-bold cursor-pointer mt-9 transition-all hover:bg-[#0d2a4a] hover:-translate-y-px"
          >
            View All Cities <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-[#f1f5f9]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="inline-flex items-center gap-1.5 bg-[#e6f7f6] text-[#18a99c] px-3.5 py-1 rounded-full text-[0.72rem] font-bold tracking-wide uppercase mb-3">
              <MessageCircle className="w-3.5 h-3.5" /> Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#091d33] tracking-tight mb-1.5">
              What People Say About Us
            </h2>
            <p className="text-base text-[#64748b]">
              Real stories from job seekers and recruiters on our platform
            </p>
          </div>

          {/* Job Seeker Testimonials */}
          <div className="fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="flex items-center gap-3.5 mb-7">
              <span className="inline-flex items-center gap-1.5 bg-[#e6f7f6] text-[#18a99c] text-[0.72rem] font-bold tracking-wide uppercase px-4 py-1.5 rounded-full whitespace-nowrap">
                <User className="w-3.5 h-3.5" /> Job Seekers
              </span>
              <div className="flex-1 h-px bg-[#e2e8f0]"></div>
              <span className="text-[0.75rem] text-[#64748b] bg-white border border-[#e2e8f0] rounded-full px-3 py-0.5 whitespace-nowrap">
                {seekers.length} review{seekers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingTestimonials ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[16px] p-6 border border-[#e2e8f0] h-[210px]"
                  >
                    <div className="h-3.5 w-2/5 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-3.5 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-2 animate-pulse"></div>
                    <div className="h-3 w-4/5 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-2 animate-pulse"></div>
                    <div className="h-3 w-11/12 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="overflow rounded-[18px]">
                    <div
                      ref={(el) => {
                        if (el && seekers.length > 0) {
                          const updateTransform = () => {
                            const container = el.parentElement;
                            if (!container) return;
                            const containerWidth = container.offsetWidth;
                            const slides = el.children;
                            if (slides.length === 0) return;
                            const gap = 20;
                            const slideWidth =
                              (containerWidth - (seekerPerView - 1) * gap) /
                              seekerPerView;

                            Array.from(slides).forEach((slide) => {
                              slide.style.minWidth = `${slideWidth}px`;
                              slide.style.width = `${slideWidth}px`;
                            });

                            const offset =
                              seekerStep * seekerPerView * (slideWidth + gap);
                            el.style.transform = `translateX(-${offset}px)`;
                          };

                          updateTransform();
                          const resizeObserver = new ResizeObserver(() =>
                            updateTransform(),
                          );
                          resizeObserver.observe(el.parentElement);

                          if (window.__seekerObserver)
                            window.__seekerObserver.disconnect();
                          window.__seekerObserver = resizeObserver;
                        }
                      }}
                      className="flex gap-5 transition-transform duration-300 will-change-transform seeker-track"
                    >
                      {seekers.slice(0, 10).map((feedback, idx) => (
                        <div key={feedback.id || idx} className="flex-none">
                          {buildTestimonialCard(feedback, idx)}
                        </div>
                      ))}
                      {buildRatingSummary(
                        seekers,
                        "Candidate Rating",
                        seekerAvg,
                      ) && (
                        <div className="flex-none">
                          {buildRatingSummary(
                            seekers,
                            "Candidate Rating",
                            seekerAvg,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {seekerTotal > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => tSlide("seeker", -1)}
                      disabled={seekerStep === 0}
                      className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer transition-all hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1.5">
                      {Array.from({ length: seekerTotal }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => tGoTo("seeker", i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === seekerStep ? "bg-[#18a99c] w-5 rounded" : "bg-[#e2e8f0]"}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => tSlide("seeker", 1)}
                      disabled={seekerStep >= seekerTotal - 1}
                      className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer transition-all hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recruiter Testimonials */}
          <div className="mt-14 fade-up opacity-0 translate-y-5 transition-all duration-500">
            <div className="flex items-center gap-3.5 mb-7">
              <span className="inline-flex items-center gap-1.5 bg-[#091d33]/10 text-[#091d33] text-[0.72rem] font-bold tracking-wide uppercase px-4 py-1.5 rounded-full whitespace-nowrap">
                <Building2 className="w-3.5 h-3.5" /> Recruiters
              </span>
              <div className="flex-1 h-px bg-[#e2e8f0]"></div>
              <span className="text-[0.75rem] text-[#64748b] bg-white border border-[#e2e8f0] rounded-full px-3 py-0.5 whitespace-nowrap">
                {recruiters.length} review{recruiters.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingTestimonials ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[16px] p-6 border border-[#e2e8f0] h-[210px]"
                  >
                    <div className="h-3.5 w-2/5 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-3.5 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-2 animate-pulse"></div>
                    <div className="h-3 w-4/5 bg-gradient-to-r from-[#f0f4f8] via-[#e8edf3] to-[#f0f4f8] rounded mb-2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="overflow rounded-[18px]">
                    <div
                      ref={(el) => {
                        if (el && recruiters.length > 0) {
                          const updateTransform = () => {
                            const container = el.parentElement;
                            if (!container) return;
                            const containerWidth = container.offsetWidth;
                            const slides = el.children;
                            if (slides.length === 0) return;
                            const gap = 20;
                            const slideWidth =
                              (containerWidth - (recruiterPerView - 1) * gap) /
                              recruiterPerView;

                            Array.from(slides).forEach((slide) => {
                              slide.style.minWidth = `${slideWidth}px`;
                              slide.style.width = `${slideWidth}px`;
                            });

                            const offset =
                              recruiterStep *
                              recruiterPerView *
                              (slideWidth + gap);
                            el.style.transform = `translateX(-${offset}px)`;
                          };

                          updateTransform();
                          const resizeObserver = new ResizeObserver(() =>
                            updateTransform(),
                          );
                          resizeObserver.observe(el.parentElement);

                          if (window.__recruiterObserver)
                            window.__recruiterObserver.disconnect();
                          window.__recruiterObserver = resizeObserver;
                        }
                      }}
                      className="flex gap-5 transition-transform duration-300 will-change-transform recruiter-track"
                    >
                      {recruiters.slice(0, 10).map((feedback, idx) => (
                        <div key={feedback.id || idx} className="flex-none">
                          {buildTestimonialCard(feedback, idx)}
                        </div>
                      ))}
                      {buildRatingSummary(
                        recruiters,
                        "Recruiter Rating",
                        recruiterAvg,
                      ) && (
                        <div className="flex-none">
                          {buildRatingSummary(
                            recruiters,
                            "Recruiter Rating",
                            recruiterAvg,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {recruiterTotal > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => tSlide("recruiter", -1)}
                      disabled={recruiterStep === 0}
                      className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer transition-all hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1.5">
                      {Array.from({ length: recruiterTotal }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => tGoTo("recruiter", i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === recruiterStep ? "bg-[#18a99c] w-5 rounded" : "bg-[#e2e8f0]"}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => tSlide("recruiter", 1)}
                      disabled={recruiterStep >= recruiterTotal - 1}
                      className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer transition-all hover:bg-[#18a99c] hover:border-[#18a99c] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pre-footer */}
      <section className="overflow-hidden">
        <img src={banner} alt="" className="min-h-[300px] w-full block" />
      </section>

      {/* Feedback Detail Modal */}
      {showFeedbackModal && (
        <div
          className="fixed inset-0 bg-[#091d33]/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-5 transition-opacity duration-250"
          onClick={handleModalBgClick}
        >
          <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[88vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
            {loadingFeedback ? (
              <div className="py-14 px-5 text-center text-[#64748b]">
                <div className="w-8 h-8 border-3 border-[#e2e8f0] border-t-[#18a99c] rounded-full animate-spin mx-auto mb-3"></div>
                Loading review…
              </div>
            ) : (
              selectedFeedback && (
                <>
                  <div className="bg-[#091d33] px-6 py-5 rounded-t-2xl sticky top-0 z-10 flex items-center gap-3.5">
                    <button
                      onClick={closeFeedbackModal}
                      className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white/65 flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-[50px] h-[50px] rounded-xl bg-[#18a99c]/20 border-2 border-[#18a99c]/40 flex items-center justify-center text-sm font-extrabold text-[#18a99c] flex-shrink-0 overflow-hidden">
                      {selectedFeedback.profileImage ? (
                        <img
                          src={selectedFeedback.profileImage}
                          alt={selectedFeedback.fullName || ""}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        fbDmInitials(selectedFeedback.fullName)
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white mb-1">
                        {selectedFeedback.fullName || "Anonymous"}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[0.62rem] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${selectedFeedback.role === "JOB_SEEKER" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-300"}`}
                        >
                          {selectedFeedback.role === "JOB_SEEKER" ? (
                            <User className="w-2.5 h-2.5" />
                          ) : (
                            <Building2 className="w-2.5 h-2.5" />
                          )}
                          {selectedFeedback.role === "JOB_SEEKER"
                            ? "Job Seeker"
                            : "Recruiter"}
                        </span>
                        {selectedFeedback.companyName && (
                          <span className="text-[0.72rem] text-white/50">
                            <Building2 className="inline w-2.5 h-2.5" />{" "}
                            {selectedFeedback.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-xl tracking-wide">
                        {fbDmStars(selectedFeedback.rating || 0)}
                      </span>
                      <span className="text-base font-extrabold text-[#091d33]">
                        {selectedFeedback.rating || 0}
                      </span>
                      <span className="text-[0.78rem] text-[#64748b]">/ 5</span>
                    </div>

                    {selectedFeedback.subject && (
                      <div className="mb-4">
                        <div className="text-[0.65rem] font-bold tracking-[1.2px] uppercase text-[#64748b] mb-1.5">
                          <Tag className="inline w-2.5 h-2.5 mr-1" /> Subject
                        </div>
                        <div className="text-sm text-[#091d33] bg-[#f1f5f9] rounded-xl px-3.5 py-3">
                          {selectedFeedback.subject}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="text-[0.65rem] font-bold tracking-[1.2px] uppercase text-[#64748b] mb-1.5">
                        <MessageCircle className="inline w-2.5 h-2.5 mr-1" />{" "}
                        Full Message
                      </div>
                      <div className="text-sm text-[#091d33] bg-[#f1f5f9] rounded-xl px-3.5 py-3 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedFeedback.message || "—"}
                      </div>
                    </div>

                    <div className="h-px bg-[#e2e8f0] my-4"></div>

                    <div className="flex flex-wrap gap-3.5">
                      {selectedFeedback.email && (
                        <span className="flex items-center gap-1.5 text-[0.78rem] text-[#64748b]">
                          <Mail className="w-3 h-3 text-[#18a99c]" />{" "}
                          {selectedFeedback.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#64748b]">
                        <Calendar className="w-3 h-3 text-[#18a99c]" />{" "}
                        {fbDmFormatDate(selectedFeedback.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#64748b]">
                        <Clock className="w-3 h-3 text-[#18a99c]" />{" "}
                        {fbDmTimeAgo(selectedFeedback.createdAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/feedback")}
                      className="inline-flex items-center gap-1.5 text-[0.78rem] font-bold text-[#18a99c] bg-[#e6f7f6] rounded-full px-4 py-2 mt-4 transition-all hover:bg-[#18a99c] hover:text-white"
                    >
                      <Grid3X3 className="w-3 h-3" /> See all reviews
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, rgba(24,169,156,0.22) 0%, transparent 70%);
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;


