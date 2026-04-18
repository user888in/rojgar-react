const VALUES = [
  { icon: 'bi bi-shield-check',         name: 'Trust',   desc: 'We verify every profile and posting so you can connect with confidence.'   },
  { icon: 'bi bi-lightning-charge-fill', name: 'Speed',   desc: 'From application to offer — we eliminate friction at every step.'          },
  { icon: 'bi bi-heart-fill',            name: 'Empathy', desc: 'Job searching is personal. We design with human dignity in mind.'           },
  { icon: 'bi bi-graph-up-arrow',        name: 'Growth',  desc: 'We grow alongside our users — constantly improving and innovating.'         },
];

export default function Values() {
  return (
    <section className="bg-slate-900 py-24 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
              What Drives Us
            </div>
            <h2 className="text-4xl font-bold text-white">
              Our Core <span className="text-teal-400">Values</span>
            </h2>
          </div>
          <p className="text-slate-400 max-w-sm leading-relaxed">
            Every decision we make is guided by these principles — for our users, our team, and the world.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(v => (
            <div
              key={v.name}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-750 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 text-xl mb-4">
                <i className={v.icon}></i>
              </div>
              <div className="text-white font-semibold text-lg mb-2">{v.name}</div>
              <div className="text-slate-400 text-sm leading-relaxed">{v.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}