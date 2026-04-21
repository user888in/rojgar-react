import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CirclePlus,
  Grid3x3,
  ShieldCheck,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EyebrowBadge from '../ui/EyebrowBadge';
import heroImage from '../../assets/images/recruiter-index-hero.jpg';
import RecruiterSkeleton from './RecruiterSkeleton';
import { formatNumber } from './utils';

const HeroReveal = ({ delay = 0, className = '', children }) => (
  <div
    className={`opacity-0 translate-y-7 animate-[recruiter-reveal-up_0.7s_ease_forwards] ${className}`.trim()}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export default function RecruiterHero({ stats }) {
  const [imageError, setImageError] = useState(false);
  const hasRecruiters = stats?.recruiters !== undefined && stats?.recruiters !== null;
  const hasUsers = stats?.users !== undefined && stats?.users !== null;
  const hasJobs = stats?.totalJobs !== undefined && stats?.totalJobs !== null;

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#091d33]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(24,169,156,0.18)_1px,transparent_1px)] bg-[length:36px_36px] animate-[recruiter-grid-drift_20s_linear_infinite]" />
      <div className="pointer-events-none absolute -top-[120px] -right-[80px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#18a99c,transparent_70%)] opacity-35 blur-[80px] animate-[recruiter-orb-float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-[60px] left-[5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,#185FA5,transparent_70%)] opacity-35 blur-[80px] animate-[recruiter-orb-float_11s_ease-in-out_infinite_reverse]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-24 max-[900px]:text-center lg:grid-cols-2">
        <div>
          <HeroReveal delay={50}>
            <EyebrowBadge text="Recruiter Platform" className="mb-6" />
          </HeroReveal>
          <HeroReveal delay={200}>
            <h1 className="mb-5 text-[clamp(2.2rem,3.8vw,3.6rem)] font-extrabold leading-[1.08] tracking-[1.5px] text-white">
              Hire the<br />
              <span className="text-[#18a99c]">Right Talent,</span>
              <br />
              Faster.
            </h1>
          </HeroReveal>
          <HeroReveal delay={350}>
            <p className="mb-9 max-w-[480px] text-[1.05rem] leading-[1.7] text-white/55 max-[900px]:mx-auto">
              Post jobs, discover verified candidates, and close positions in record time. RojgarShine puts your next great hire just a click away.
            </p>
          </HeroReveal>
          <HeroReveal delay={500}>
            <div className="flex flex-wrap gap-3 max-[560px]:flex-col max-[560px]:items-center max-[900px]:justify-center">
              <Link
                to="/recruiter/job-post"
                className="inline-flex items-center gap-2 rounded-full bg-[#18a99c] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_0_0_rgba(24,169,156,0.5)] transition hover:-translate-y-0.5 hover:bg-[#0fd4c4] hover:shadow-[0_8px_24px_rgba(24,169,156,0.3)] max-[560px]:w-full max-[560px]:justify-center"
              >
                <CirclePlus className="h-4 w-4" aria-hidden="true" /> Post a Job
              </Link>
              <Link
                to="/recruiter/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-medium text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white max-[560px]:w-full max-[560px]:justify-center"
              >
                Register Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </HeroReveal>
          <HeroReveal delay={500}>
            <div className="mt-10 flex flex-wrap gap-5 max-[900px]:justify-center">
              <span className="flex items-center gap-2 text-[13px] text-white/55">
                <ShieldCheck className="h-4 w-4 text-[#18a99c]" aria-hidden="true" /> Verified Candidates
              </span>
              <span className="flex items-center gap-2 text-[13px] text-white/55">
                <Zap className="h-4 w-4 text-[#18a99c]" aria-hidden="true" /> Fast Onboarding
              </span>
              <span className="flex items-center gap-2 text-[13px] text-white/55">
                <Users className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
                {hasRecruiters ? (
                  `${formatNumber(stats.recruiters)}+ Recruiters`
                ) : (
                  <RecruiterSkeleton className="h-[14px] w-[90px] rounded" />
                )}
              </span>
            </div>
          </HeroReveal>
        </div>

        <HeroReveal delay={350} className="relative max-[900px]:hidden">
          <div className="relative min-h-[380px] overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,#0d2640_0%,#0f3a50_50%,#18a99c22_100%)] shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
            {!imageError ? (
              <img
                src={heroImage}
                alt="Recruiter dashboard preview"
                className="h-full w-full object-cover brightness-90"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/15">
                <Grid3x3 className="mb-3 h-14 w-14" aria-hidden="true" />
                <p className="text-[0.85rem]">Dashboard Preview</p>
              </div>
            )}
          </div>

          <div className="absolute -bottom-5 -left-8 flex items-center gap-3 rounded-[14px] bg-white/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur animate-[recruiter-float_5s_ease-in-out_infinite]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e1f5ee]">
              <UserCheck className="h-5 w-5 text-[#0F6E56]" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold leading-none text-[#091d33]">
                {hasUsers ? formatNumber(stats.users) : (
                  <RecruiterSkeleton
                    variant="light"
                    className="h-[18px] w-[50px] rounded"
                  />
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-[#888]">Total Users</div>
            </div>
          </div>

          <div className="absolute right-[-28px] top-5 flex items-center gap-3 rounded-[14px] bg-white/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur animate-[recruiter-float_5s_ease-in-out_infinite] [animation-delay:2s]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e6f1fb]">
              <Briefcase className="h-5 w-5 text-[#185FA5]" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold leading-none text-[#091d33]">
                {hasJobs ? formatNumber(stats.totalJobs) : (
                  <RecruiterSkeleton
                    variant="light"
                    className="h-[18px] w-[40px] rounded"
                  />
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-[#888]">Jobs Posted</div>
            </div>
          </div>
        </HeroReveal>
      </div>
    </section>
  );
}
