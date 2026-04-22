import { Briefcase, Eye, UsersRound } from 'lucide-react';
import SectionTag from '../ui/SectionTag';
import aboutImg from '../../assets/images/about-2.jpg';
import { motion } from 'framer-motion';

const BLOCKS = [
  {
    icon: <Eye size={16}/>,
    title: 'Our Vision',
    text: 'To become the most reliable and user-friendly job portal that empowers individuals to build meaningful careers while helping companies discover the talent they need to grow.',
    divider: false,
  },
  {
    icon: <UsersRound size={16} />,
    title: 'For Job Seekers',
    text: 'We provide a seamless experience to explore opportunities, showcase skills, and connect with employers who value their potential.',
    divider: true,
  },
  {
    icon: <Briefcase size={16} />,
    title: 'For Recruiters',
    text: 'We simplify hiring with smart tools, verified profiles, and efficient workflows that save time and deliver results.',
    divider: false,
  },
];

export default function VisionMission() {
  return (
    <section className="bg-white py-[64px] sm:py-[100px]">
      <motion.div initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: "easeOut" }} className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── Image ── */}
        <div className="relative reveal">
          <img
            src={aboutImg}
            alt="About RojgarShine"
            className="w-full h-[260px] sm:h-[380px] lg:h-[520px] object-cover rounded-[24px] block"
          />

          {/* Accent card */}
          <div className="absolute -bottom-[14px] -right-[8px] bg-[#091d33] text-white rounded-[16px] px-[18px] py-[14px] min-w-[140px] shadow-[0_20px_40px_rgba(9,29,51,0.25)] sm:-bottom-[18px] sm:-right-[12px] sm:px-6 sm:py-5 sm:min-w-[180px] lg:-bottom-6 lg:-right-6">
            <div className="text-[1.6rem] sm:text-[2.2rem] font-extrabold text-[#18a99c] leading-none">
              3+
            </div>
            <div className="text-[0.72rem] text-white/60 uppercase mt-1">
              Years of Impact
            </div>
          </div>
        </div>

        {/* ── Text ── */}
        <div className="reveal reveal-delay-1">

          {/* Section tag */}
          <SectionTag
            text="Who We Are"
            colorClass="text-[#18a99c] before:bg-[#18a99c]"
          />

          {/* Heading */}
          <h2 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold text-[#091d33] leading-[1.1] mb-8">
            Purpose-driven<br />platform for{' '}
            <span className="text-[#18a99c]">real people</span>
          </h2>

          {/* Blocks */}
          {BLOCKS.map((block) => (
            <div key={block.title}>

              {/* Divider — only before For Job Seekers */}
              {block.divider && (
                <div className="w-10 h-[3px] bg-gradient-to-r from-[#18a99c] to-transparent rounded-sm my-6" />
              )}

              <div className="mb-7">
                {/* Block title */}
                <div className="flex items-center gap-[10px] text-base font-bold text-[#091d33] mb-[10px]">
                  <div className="w-8 h-8 bg-[rgba(24,169,156,0.12)] rounded-lg flex items-center justify-center text-[#18a99c] text-[0.9rem] shrink-0">
                    {block.icon}
                  </div>
                  {block.title}
                </div>

                {/* Block text */}
                <p className="text-[0.95rem] text-slate-500 leading-[1.8] pl-0 sm:pl-[42px]">
                  {block.text}
                </p>
              </div>

            </div>
          ))}

        </div>

      </motion.div>
    </section>
  );
}