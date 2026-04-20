import HeroStats from './HeroStats';
import heroBg from '../../assets/images/about-bg-img.jpg';

const STATS_CONFIG = [
  { key: 'activeJobs',      label: 'Jobs Posted'  },
  { key: 'totalCompanies',  label: 'Companies'    },
  { key: 'totalJobSeekers', label: 'Job Seekers'  },
];

export default function AboutHero() {
  return (
    <section
      className="relative min-h-[88vh] bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${heroBg})` }}
    >

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,29,51,0.88)] to-[rgba(24,169,156,0.45)] z-10" />

      {/* Grid texture overlay — pure Tailwind */}
      <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(24,169,156,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,169,156,0.06)_1px,transparent_1px)] bg-[length:60px_60px]" />

      {/* Content */}
      <div className="relative z-20 text-center px-5 animate-[heroFadeUp_0.9s_cubic-bezier(.4,0,.2,1)_both]">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-[rgba(24,169,156,0.2)] border border-[rgba(24,169,156,0.4)] text-[#5ee8dc] text-[0.72rem] font-bold uppercase px-[18px] py-[7px] rounded-full mb-7 backdrop-blur-sm">
          <span className="w-[6px] h-[6px] rounded-full bg-[#18a99c] animate-pulse" />
          Our Story
        </div>

        {/* Title */}
        <h1 className="text-[clamp(2rem,5vw,5rem)] text-white font-bold leading-none mb-6">
          We're Building<br />the Future of{' '}
          <span className="text-[#18a99c]">Hiring</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(1rem,2.5vw,1.2rem)] text-white/70 max-w-[520px] mx-auto leading-[1.75] font-light">
          Connecting talent with opportunity — making every career journey smoother, smarter, and more human.
        </p>

        {/* Stats */}
        <HeroStats statsConfig={STATS_CONFIG} />

      </div>
    </section>
  );
}