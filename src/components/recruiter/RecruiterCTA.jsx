import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionTag from '../ui/SectionTag';
import RecruiterReveal from './RecruiterReveal';
import RecruiterSkeleton from './RecruiterSkeleton';
import { formatNumber } from './utils';

export default function RecruiterCTA({ stats }) {
  const hasRecruiters = stats?.recruiters !== undefined && stats?.recruiters !== null;

  return (
    <section className="relative overflow-hidden bg-[#091d33] py-24 text-center">
      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <RecruiterReveal>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(24,169,156,0.25)] bg-[rgba(24,169,156,0.12)] px-4 py-2 text-[13px] text-[#18a99c]">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            {hasRecruiters ? (
              `${formatNumber(stats.recruiters)} recruiters are already hiring`
            ) : (
              <RecruiterSkeleton className="h-[14px] w-[160px] rounded" />
            )}
          </div>
        </RecruiterReveal>
        <RecruiterReveal delay={100}>
          <SectionTag text="Get Started" className="mt-6 justify-center" />
        </RecruiterReveal>
        <RecruiterReveal delay={150}>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[1.5px] text-white">
            Ready to Hire Smarter?
          </h2>
        </RecruiterReveal>
        <RecruiterReveal delay={200}>
          <p className="mx-auto mt-3 max-w-[640px] text-[1.05rem] text-white/55">
            {hasRecruiters && stats?.users && stats?.totalJobs
              ? `Join ${formatNumber(stats.recruiters)}+ recruiters reaching ${formatNumber(
                  stats.users
                )} job seekers across ${formatNumber(stats.totalJobs)} listings.`
              : "Join thousands of recruiters who've transformed their hiring on RojgarShine."}
          </p>
        </RecruiterReveal>
        <RecruiterReveal delay={250}>
          <Link
            to="/recruiter/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#18a99c] px-9 py-4 text-[16px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0fd4c4]"
          >
            Start Hiring Today <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </RecruiterReveal>
      </div>
    </section>
  );
}
