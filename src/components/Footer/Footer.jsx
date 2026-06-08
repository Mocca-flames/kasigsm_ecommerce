import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Store',
    links: [
      { label: 'All services', to: '/services' },
      { label: 'Remote services', to: '/services' },
      { label: 'Tool rental', to: '/services/rental' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Free IMEI check', to: '/imei-checker' },
      { label: 'Device scanner', to: '/#scanner' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Register', to: '/register' },
      { label: 'Orders', to: '/orders' },
      { label: 'Wallet', to: '/wallet' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">KasiGSM</div>
            <p className="footer__tagline">
              The tool platform trusted by 12,000+ phone technicians in the townships and beyond.
              Rent instead of buy. Detect before you commit. Fix without leaving the counter.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div className="footer__col" key={col.title}>
              <div className="footer__col-title">{col.title}</div>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} KasiGSM. All rights reserved.</span>
          <span>Built for workshops that ship fast.</span>
        </div>
      </div>
    </footer>
  );
}
