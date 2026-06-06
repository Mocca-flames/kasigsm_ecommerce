const STATS = [
  { number: '50,000+', label: 'Devices fixed' },
  { number: '12,000+', label: 'Technicians' },
  { number: 'R7.92', label: 'Lowest rent' },
  { number: '24/7', label: 'Instant delivery' },
];

export default function TrustBar() {
  return (
    <section className="trust-bar" aria-label="Trust metrics">
      <div className="trust-bar__inner">
        {STATS.map((s) => (
          <div className="trust-stat" key={s.label}>
            <div className="trust-stat__number">{s.number}</div>
            <div className="trust-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
