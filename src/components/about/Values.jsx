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
    <section className="values-section">
      <div className="values-inner">
        <div className="values-header reveal">
          <div>
            <SectionTag text="What Drives Us" color="rgba(94,232,220,0.9)" />
            <h2 className="values-title">
              Our Core <span>Values</span>
            </h2>
          </div>
          <p className="values-desc">
            Every decision we make is guided by these principles — for our users, our team, and the world.
          </p>
        </div>

        <div className="values-grid">
          {VALUES.map((value, index) => {
            const delayClass = index ? `reveal-delay-${index}` : '';
            return (
              <div
                key={value.name}
                className={`value-card reveal ${delayClass}`.trim()}
              >
                <div className="value-icon">
                  <i className={value.icon}></i>
                </div>
                <div className="value-name">{value.name}</div>
                <div className="value-desc">{value.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}