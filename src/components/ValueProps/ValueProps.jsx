const PROPS = [
  {
    icon: 'wallet',
    title: 'Rent, don\'t buy',
    desc: 'A full Samsung FRP tool costs ~R742.50 to own. Rent the same tool for R7.92. Most repair shops use a tool for 2-4 hours per job — paying once is dead capital.',
  },
  {
    icon: 'bolt',
    title: 'Instant delivery',
    desc: 'Credentials hit your inbox in under 60 seconds, any time of day. No courier. No waiting until business hours. Start the repair while the customer is still at the counter.',
  },
  {
    icon: 'devices',
    title: 'Every brand, one platform',
    desc: 'Samsung, Apple, Xiaomi, Tecno, Infinix, Huawei, Oppo, Vivo, Realme, Motorola, Google, Nokia — 20+ brands and 8,000+ models covered. One login, every tool.',
  },
  {
    icon: 'support',
    title: '24/7 technician support',
    desc: 'Stuck at 2am on a Vodacom-locked SM-A546B? WhatsApp our engineering team. Real human reply, not a chatbot. Average response under 9 minutes.',
  },
];

function Icon({ name }) {
  const common = { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'wallet':
      return (
        <svg className="value-card__icon" {...common} aria-hidden="true">
          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h12" />
          <circle cx="17" cy="14" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'bolt':
      return (
        <svg className="value-card__icon" {...common} aria-hidden="true">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      );
    case 'devices':
      return (
        <svg className="value-card__icon" {...common} aria-hidden="true">
          <rect x="2" y="6" width="13" height="10" rx="1.5" />
          <rect x="15" y="9" width="7" height="11" rx="1.5" />
          <line x1="5" y1="20" x2="12" y2="20" />
        </svg>
      );
    case 'support':
      return (
        <svg className="value-card__icon" {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
          <line x1="12" y1="17" x2="12" y2="17.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ValueProps() {
  return (
    <section className="value-props" aria-labelledby="value-props-heading">
      <div className="value-props__inner">
        <h2 id="value-props-heading" className="value-props__heading">
          Why rent, not buy
        </h2>
        <p className="value-props__sub">
          Real numbers. Real objections answered.
        </p>
        <div className="value-grid">
          {PROPS.map((p) => (
            <article className="value-card" key={p.title}>
              <Icon name={p.icon} />
              <h3 className="value-card__title">{p.title}</h3>
              <p className="value-card__desc">{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
