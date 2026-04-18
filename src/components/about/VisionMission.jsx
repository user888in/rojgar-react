import aboutImg from '../../assets/images/about-2.jpg';

const BLOCKS = [
  {
    icon: 'bi bi-eye-fill',
    title: 'Our Vision',
    text: 'To become the most reliable and user-friendly job portal that empowers individuals to build meaningful careers while helping companies discover the talent they need to grow.',
  },
  {
    icon: 'bi bi-people-fill',
    title: 'For Job Seekers',
    text: 'We provide a seamless experience to explore opportunities, showcase skills, and connect with employers who value their potential.',
    divider: true,
  },
  {
    icon: 'bi bi-briefcase-fill',
    title: 'For Recruiters',
    text: 'We simplify hiring with smart tools, verified profiles, and efficient workflows that save time and deliver results.',
  },
];

export default function VisionMission() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Image */}
        <div className="relative">
          <img
            src={aboutImg}
            alt="About RojgarShine"
            className="w-full h-[480px] object-cover rounded-2xl shadow-xl"
          />
          <div className="absolute -bottom-6 -right-6 bg-teal-500 text-white rounded-2xl px-6 py-4 shadow-lg">
            <div className="text-3xl font-bold">3+</div>
            <div className="text-sm text-teal-100">Years of Impact</div>
          </div>
        </div>

        {/* Text */}
        <div>
          <div className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Who We Are
          </div>
          <h2 className="text-4xl font-bold text-slate-800 leading-snug mb-10">
            Purpose-driven<br />platform for{' '}
            <span className="text-teal-500">real people</span>
          </h2>

          {BLOCKS.map((block, index) => (
            <div key={block.title}>
              {block.divider && (
                <hr className="my-6 border-slate-200" />
              )}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <i className={block.icon}></i>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-base">
                    {block.title}
                  </h3>
                </div>
                <p className="text-slate-500 leading-relaxed pl-12">
                  {block.text}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}