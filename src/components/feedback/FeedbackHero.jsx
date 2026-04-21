import { Building2, MessageSquare, Star, Users } from 'lucide-react';

export default function FeedbackHero({ stats }) {
  const { total = '...', avg = '...', seekers = '...', recruiters = '...' } = stats || {};

  return (
    <section
      className="relative overflow-hidden bg-[#091d33] pt-14 pb-20 max-[600px]:pt-11 max-[600px]:pb-[68px] before:absolute before:-top-[100px] before:-right-[100px] before:h-[420px] before:w-[420px] before:rounded-full before:bg-[radial-gradient(circle,_rgba(24,169,156,0.18)_0%,_transparent_70%)] before:content-[''] after:absolute after:-bottom-[70px] after:-left-[70px] after:h-[300px] after:w-[300px] after:rounded-full after:bg-[radial-gradient(circle,_rgba(24,169,156,0.1)_0%,_transparent_70%)] after:content-['']"
    >
      <div className="container mx-auto px-6 relative z-[1]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(24,169,156,0.3)] bg-[rgba(24,169,156,0.15)] px-4 py-[6px] text-[0.72rem] font-bold uppercase tracking-[1px] text-[#18a99c]">
          <MessageSquare className="h-4 w-4" aria-hidden="true" /> Community Reviews
        </div>
        <h1 className="mb-[10px] text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-1px] text-white">
          What People Say About <span className="text-[#18a99c]">RojgarShine</span>
        </h1>
        <p className="text-base font-light leading-[1.7] text-[rgba(255,255,255,0.52)]">
          Real experiences from job seekers and recruiters who found success on our platform.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] px-[18px] py-2 text-[0.82rem] text-[rgba(255,255,255,0.75)] backdrop-blur-[8px]">
            <MessageSquare className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
            <strong className="font-extrabold text-white">{total}</strong> total reviews
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] px-[18px] py-2 text-[0.82rem] text-[rgba(255,255,255,0.75)] backdrop-blur-[8px]">
            <Star className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
            <strong className="font-extrabold text-white">{avg}</strong> average rating
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] px-[18px] py-2 text-[0.82rem] text-[rgba(255,255,255,0.75)] backdrop-blur-[8px]">
            <Users className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
            <strong className="font-extrabold text-white">{seekers}</strong> job seekers
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] px-[18px] py-2 text-[0.82rem] text-[rgba(255,255,255,0.75)] backdrop-blur-[8px]">
            <Building2 className="h-4 w-4 text-[#18a99c]" aria-hidden="true" />
            <strong className="font-extrabold text-white">{recruiters}</strong> recruiters
          </div>
        </div>
      </div>
    </section>
  );
}
