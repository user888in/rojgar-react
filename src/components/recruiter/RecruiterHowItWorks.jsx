import { Building2, CirclePlus, Users } from 'lucide-react';
import SectionTag from '../ui/SectionTag';
import RecruiterReveal from './RecruiterReveal';

const steps = [
  {
    number: '01',
    title: 'Create Company Profile',
    description:
      'Register and showcase your organisation - culture, open roles, and what makes you worth joining.',
    icon: Building2,
    iconBg: '#e6f1fb',
    iconColor: '#185FA5',
  },
  {
    number: '02',
    title: 'Post Jobs',
    description:
      'Publish detailed job listings and instantly reach thousands of skill-matched, active candidates.',
    icon: CirclePlus,
    iconBg: '#e1f5ee',
    iconColor: '#0F6E56',
  },
  {
    number: '03',
    title: 'Hire Smarter',
    description:
      'Shortlist applicants, schedule interviews, and extend offers - all from one streamlined dashboard.',
    icon: Users,
    iconBg: '#faeeda',
    iconColor: '#BA7517',
  },
];

export default function RecruiterHowItWorks() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <RecruiterReveal className="text-center">
          <SectionTag text="Process" className="justify-center" />
          <h2 className="text-[clamp(1.7rem,3vw,2.6rem)] font-extrabold leading-[1.1] tracking-[1px] text-[#091d33]">
            How Hiring Works
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[1rem] leading-[1.7] text-[#666]">
            Three steps from posting to placement - designed to get out of your way.
          </p>
        </RecruiterReveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <RecruiterReveal key={step.number} delay={index * 100}>
                <div className="group relative h-full overflow-hidden rounded-[16px] border border-[#eef0f3] bg-white p-8 transition duration-200 hover:-translate-y-1.5 hover:border-[rgba(24,169,156,0.3)] hover:shadow-[0_20px_48px_rgba(9,29,51,0.1)]">
                  <div className="absolute right-[18px] top-[12px] text-[4rem] font-extrabold tracking-[3px] text-[rgba(24,169,156,0.1)] transition group-hover:text-[rgba(24,169,156,0.2)]">
                    {step.number}
                  </div>
                  <div
                    className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] transition group-hover:scale-110"
                    style={{ backgroundColor: step.iconBg, color: step.iconColor }}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h5 className="mb-2 text-[1.05rem] font-bold text-[#0d1b2a]">
                    {step.title}
                  </h5>
                  <p className="text-[0.9rem] leading-[1.65] text-[#777]">
                    {step.description}
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
