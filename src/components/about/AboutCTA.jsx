import { Link } from 'react-router-dom';
import SectionTag from '../ui/SectionTag';
import { BriefcaseBusiness, Search } from 'lucide-react';

export default function AboutCTA() {
  return (
    <section className="bg-white px-4 py-[64px] text-center sm:px-6 sm:py-[90px]">
      <div className="mx-auto max-w-[680px]">
        <SectionTag
          text="Get Started"
          colorClass="text-[#18a99c] before:bg-[#18a99c]"
          className="w-full justify-center"
        />

        <h2 className="mb-[16px] text-[clamp(2rem,4vw,2.8rem)] font-extrabold leading-[1.1] text-[#091d33]">
          Ready to find your <span className="text-[#18a99c]">dream job?</span>
        </h2>

        <p className="mb-[36px] text-base leading-[1.75] text-slate-500">
          Join thousands of professionals who've already taken the next step in their career with RojgarShine.
        </p>

        <div className="flex flex-col items-center gap-[14px] sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            to="/jobs"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#091d33] bg-[#091d33] px-[30px] py-[13px] text-[0.9rem] font-semibold text-white transition-colors duration-150 hover:border-[#18a99c] hover:bg-[#18a99c] sm:w-auto"
          >
            <Search size={16} /> Browse Jobs
          </Link>
          <Link
            to="/recruiter/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[rgba(9,29,51,0.2)] bg-transparent px-[30px] py-[13px] text-[0.9rem] font-semibold text-[#091d33] transition-colors duration-150 hover:border-[#091d33] hover:bg-[#f5f6f8] sm:w-auto"
          >
            <BriefcaseBusiness size={16} /> Post a Job
          </Link>
        </div>
      </div>
    </section>
  );
}