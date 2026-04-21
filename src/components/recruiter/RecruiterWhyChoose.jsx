import {
  Briefcase,
  Building2,
  Clock,
  Filter,
  Headset,
  UserCheck,
  Users,
} from 'lucide-react';
import SectionTag from '../ui/SectionTag';
import RecruiterReveal from './RecruiterReveal';
import RecruiterSkeleton from './RecruiterSkeleton';

const reasons = [
  {
    title: 'Verified Candidates',
    description:
      'Every profile is reviewed for accuracy. Zero ghost applications, zero wasted time.',
    icon: UserCheck,
  },
  {
    title: 'Faster Hiring Cycles',
    description: 'Automated screening and smart ranking cut your average hire time by 4x.',
    icon: Clock,
  },
  {
    title: 'Precision Filters',
    description:
      'Filter by skill, experience, location, notice period - surface the exact fit.',
    icon: Filter,
  },
  {
    title: 'Dedicated Support',
    description:
      'A real human answers within hours. Your hiring goals matter to us, not just your ticket number.',
    icon: Headset,
  },
];

const liveStats = [
  { key: 'totalJobs', label: 'Total Jobs', icon: Briefcase },
  { key: 'totalCompanies', label: 'Companies', icon: Building2 },
  { key: 'totalJobSeekers', label: 'Job Seekers', icon: Users },
  { key: 'recruiters', label: 'Recruiters', icon: UserCheck },
];

export default function RecruiterWhyChoose({ stats }) {
  return (
    <section className="relative overflow-hidden bg-[#091d33] py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(24,169,156,0.07)_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <RecruiterReveal className="text-center">
          <SectionTag text="Advantages" className="justify-center text-[#18a99c]" />
          <h2 className="text-[clamp(1.7rem,3vw,2.6rem)] font-extrabold leading-[1.1] tracking-[1px] text-white">
            Why Recruiters Choose Rojgar<span className="text-[#18a99c]">Shine</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[1rem] leading-[1.7] text-white/55">
            Built by people who understand hiring - not just software.
          </p>
        </RecruiterReveal>

        <RecruiterReveal className="mt-12" delay={100}>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[rgba(24,169,156,0.2)] bg-[linear-gradient(90deg,rgba(24,169,156,0.08),rgba(24,169,156,0.02))] px-8 py-5">
            <div className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[1.5px] text-[#18a99c]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#18a99c]" /> Live Platform Stats
            </div>
            <div className="flex flex-wrap gap-8">
              {liveStats.map((stat) => {
                const Icon = stat.icon;
                const value = stats?.[stat.key];
                return (
                  <div key={stat.key} className="flex items-center gap-2 text-[0.88rem] text-white/55">
                    <Icon className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
                    <span>
                      <strong className="text-[1rem] font-bold text-white">
                        {value === undefined || value === null ? (
                          <RecruiterSkeleton className="h-[14px] w-[28px] rounded" />
                        ) : (
                          value
                        )}
                      </strong>{' '}
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </RecruiterReveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <RecruiterReveal key={reason.title} delay={index * 120}>
                <div className="group h-full rounded-[16px] border border-white/10 bg-white/5 px-6 py-8 transition duration-200 hover:-translate-y-1 hover:border-[rgba(24,169,156,0.25)] hover:bg-white/10">
                  <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[rgba(24,169,156,0.12)] text-[#18a99c] transition group-hover:scale-110 group-hover:bg-[rgba(24,169,156,0.2)]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h6 className="mb-2 text-[0.95rem] font-bold text-white">
                    {reason.title}
                  </h6>
                  <p className="text-[0.85rem] leading-[1.65] text-white/55">
                    {reason.description}
                  </p>
                </div>
              </RecruiterReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
