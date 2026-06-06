import { Link } from 'react-router-dom';
import { zar } from '../../lib/currency';

const TOOLS = [
  {
    brand: 'SAMSUNG',
    name: 'UnlockTool Rent',
    turn: '6h turnaround',
    rent: 0.48,
    full: 45.00,
    href: '/browse?category=unlock&brand=samsung',
  },
  {
    brand: 'XIAOMI',
    name: 'Mi Flash + Auth Rent',
    turn: '12h turnaround',
    rent: 1.20,
    full: 89.00,
    href: '/browse?category=unlock&brand=xiaomi',
  },
  {
    brand: 'APPLE',
    name: 'Checkm8 + Signal Rent',
    turn: '24h turnaround',
    rent: 2.40,
    full: 120.00,
    href: '/browse?category=unlock&brand=apple',
  },
];

export default function ToolSpotlight() {
  return (
    <section className="tool-spotlight" aria-labelledby="tool-spotlight-heading">
      <div className="tool-spotlight__inner">
        <div className="tool-spotlight__head">
          <h2 id="tool-spotlight-heading" className="tool-spotlight__title">Most rented this week</h2>
          <Link to="/browse" className="tool-spotlight__link">All tools →</Link>
        </div>
        <div className="tool-grid">
          {TOOLS.map((t) => (
            <Link key={t.name} to={t.href} className="tool-spotlight__card">
              <div className="tool-spotlight__brand">{t.brand}</div>
              <div className="tool-spotlight__name">{t.name}</div>
              <div className="tool-spotlight__turn">{t.turn}</div>
              <div className="tool-spotlight__prices">
                <span className="tool-spotlight__rent">{zar(t.rent)}</span>
                <span className="tool-spotlight__full">{zar(t.full)}</span>
                <span className="tool-spotlight__save">Save {zar(t.full - t.rent)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
