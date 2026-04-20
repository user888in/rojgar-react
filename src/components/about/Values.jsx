import SectionTag from '../ui/SectionTag';

const VALUES = [
  {
    icon: 'bi bi-shield-check',
    name: 'Trust',
    desc: 'We verify every profile and posting so you can connect with confidence.',
  },
  {
    icon: 'bi bi-lightning-charge-fill',
    name: 'Speed',
    desc: 'From application to offer — we eliminate friction at every step.',
  },
  {
    icon: 'bi bi-heart-fill',
    name: 'Empathy',
    desc: 'Job searching is personal. We design with human dignity in mind.',
  },
  {
    icon: 'bi bi-graph-up-arrow',
    name: 'Growth',
    desc: 'We grow alongside our users — constantly improving and innovating.',
  },
];

export default function Values() {
  return (
    <section className="relative overflow-hidden bg-[#091d33] py-[56px] sm:py-[72px]">
      <div className="pointer-events-none absolute -top-[60px] -right-[60px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.12)_0%,transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-[1180px] px-6">
        <div className="mb-12 flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionTag
              text="What Drives Us"
              colorClass="text-[rgba(94,232,220,0.9)] before:bg-[rgba(94,232,220,0.9)]"
            />
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold leading-[1.1] text-white">
              Our Core <span className="text-[#18a99c]">Values</span>
            </h2>
          </div>
          <p className="max-w-[380px] text-[0.9rem] leading-[1.8] text-white/50">
            Every decision we make is guided by these principles — for our users, our team, and the world.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div
              key={value.name}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-[22px] py-[28px] transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(24,169,156,0.3)] hover:bg-[rgba(24,169,156,0.1)]"
            >
              <div className="mb-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-[rgba(24,169,156,0.15)] text-[1.2rem] text-[#18a99c]">
                <i className={value.icon}></i>
              </div>
              <div className="mb-2 text-base font-bold text-white">
                {value.name}
              </div>
              <div className="text-[0.82rem] leading-[1.7] text-white/50">
                {value.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}