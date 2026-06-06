import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function scrollToScanner(e) {
  e.preventDefault();
  const el = document.getElementById('scanner');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Hero() {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setSupported(!!navigator.serial);
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <div>
          <div className="hero__eyebrow">FREE · NO INSTALL</div>
          <h1 id="hero-heading" className="hero__headline">
            The <span className="accent">#1</span> GSM tool platform for phone technicians.
          </h1>
          <p className="hero__sub">
            Plug in any phone. We detect it and recommend the right tool to fix it — in under 10 seconds.
          </p>
          <div className="hero__ctas">
            {supported ? (
              <a href="#scanner" className="hero__btn hero__btn--primary" onClick={scrollToScanner}>
                Scan my device — free
              </a>
            ) : (
              <a
                href="#scanner"
                className="hero__btn hero__btn--primary"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('scanner');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Enter device manually
              </a>
            )}
            <Link to="/browse" className="hero__btn hero__btn--secondary">
              Browse all tools
            </Link>
          </div>
          <div className="hero__trust">
            <span className="hero__trust-item">Samsung · Apple · Xiaomi · Tecno · 20+ brands</span>
            <span className="hero__trust-item">No install · No admin rights</span>
            <span className="hero__trust-item">Chrome / Edge</span>
            {!supported ? (
              <span className="hero__trust-item" style={{ color: 'var(--color-warning)' }}>
                ⚠ Use Chrome or Edge for auto-detect
              </span>
            ) : null}
          </div>
        </div>
        <div className="hero__illu" aria-hidden="true">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 500 340" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
      {/* Laptop (bigger, dominant) */}
      <rect x="240" y="30" width="230" height="150" rx="6" fill="#111118" stroke="#1E1E2E" strokeWidth="2" />
      <rect x="250" y="40" width="210" height="120" rx="3" fill="#0A0A0F" stroke="#1E1E2E" strokeWidth="1.5" />
      <rect x="220" y="180" width="270" height="12" rx="3" fill="#1E1E2E" />
      <line x1="255" y1="192" x2="455" y2="192" stroke="#1E1E2E" strokeWidth="1.5" />
      {/* Pulse dot on laptop screen */}
      <circle cx="355" cy="100" r="6" fill="#00C896">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="355" y="130" fontSize="10" fill="#00C896" textAnchor="middle" fontFamily="monospace" letterSpacing="0.1em">LIVE</text>

      {/* Phone (smaller) */}
      <rect x="40" y="90" width="80" height="160" rx="10" fill="#111118" stroke="#1E1E2E" strokeWidth="2" />
      <rect x="46" y="98" width="68" height="140" rx="4" fill="#0A0A0F" />
      <line x1="55" y1="120" x2="105" y2="120" stroke="#1E1E2E" strokeWidth="1" />
      <line x1="55" y1="133" x2="95" y2="133" stroke="#00C896" strokeWidth="1" opacity="0.6" />
      <line x1="55" y1="146" x2="100" y2="146" stroke="#1E1E2E" strokeWidth="1" />
      <line x1="55" y1="159" x2="85" y2="159" stroke="#1E1E2E" strokeWidth="1" />
      <circle cx="80" cy="245" r="3" fill="#1E1E2E" />

      {/* USB cable: from phone right side to laptop left side (plugs in) */}
      <path
        id="hero-cable"
        d="M 120 175 Q 180 195 240 170"
        stroke="#00C896"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* USB plug heads */}
      <rect x="115" y="169" width="10" height="12" rx="2" fill="#00C896" />
      <rect x="234" y="164" width="10" height="12" rx="2" fill="#00C896" />

      {/* Travelling pulse along the cable (phone -> laptop) */}
      <circle r="4" fill="#00C896">
        <animateMotion dur="1.8s" repeatCount="indefinite">
          <mpath href="#hero-cable" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
