import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ScannerTerminal from '../Scanner/ScannerTerminal';
import { useScannerContext } from '../Scanner/ScannerContext';
import { SCANNER_STATES } from '../../hooks/useDeviceSerial';

export default function Hero() {
  const [supported, setSupported] = useState(true);
  const { serial, handleReset } = useScannerContext();

  const showTerminal = serial.state !== SCANNER_STATES.IDLE;

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setSupported(!!navigator.serial);
  }, []);

  const handleScanClick = (e) => {
    e.preventDefault();
    serial.startScan();
  };

  const handleNewScan = (e) => {
    e.preventDefault();
    handleReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-scroll to results when device is identified
  useEffect(() => {
    if (serial.state === SCANNER_STATES.IDENTIFIED) {
      const timer = setTimeout(() => {
        const el = document.getElementById('scanner-results');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [serial.state]);

  const showArrow = serial.state === SCANNER_STATES.IDENTIFIED
    || serial.state === SCANNER_STATES.ISSUE_SELECTED
    || serial.state === SCANNER_STATES.RESULTS;

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <div className="hero__text">
          <div className="hero__eyebrow">FREE · NO INSTALL</div>
          <h1 id="hero-heading" className="hero__headline">
            The <span className="accent">#1 </span>GSM platform for technicians by <span className="accent">Technicians</span>.
          </h1>
          <p className="hero__sub">
            Plug in any phone. We detect it and recommend the right tool to fix it — in under 10 seconds.
          </p>
          <div className="hero__ctas">
            {!showTerminal ? (
              <a href="#scanner" className="hero__btn hero__btn--primary" onClick={handleScanClick}>
                {supported ? 'Scan my device \u2014 free' : 'Enter device manually'}
              </a>
            ) : (
              <a href="#scanner-results" className="hero__btn hero__btn--primary" onClick={handleNewScan}>
                Scan new phone
              </a>
            )}
            <Link to="/services" className="hero__btn hero__btn--secondary">
              Browse all tools
            </Link>
          </div>
          <div className="hero__trust">
            <span className="hero__trust-item">Samsung \Apple \Xiaomi \Tecno \20+ brands</span>
            <span className="hero__trust-item">No install \u00b7 No admin rights</span>
            <span className="hero__trust-item">Chrome / Edge</span>
            {!supported ? (
              <span className="hero__trust-item" style={{ color: 'var(--color-warning)' }}>
                Use Chrome or Edge for auto-detect
              </span>
            ) : null}
          </div>
          {showArrow && (
            <a href="#scanner-results" className="hero__scroll-arrow" onClick={(e) => {
              e.preventDefault();
              document.getElementById('scanner-results')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </a>
          )}
        </div>
        <div className="hero__illu" aria-hidden="true">
          <div className={`hero__view hero__view--svg ${showTerminal ? 'hero__view--hidden' : ''}`}>
            <HeroIllustration />
          </div>
          <div className={`hero__view hero__view--terminal ${showTerminal ? 'hero__view--visible' : ''}`}>
            <ScannerTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
      {/* Laptop body (large, dominant) */}
      <rect x="180" y="20" width="360" height="220" rx="8" fill="#111118" stroke="#1E1E2E" strokeWidth="2" />
      {/* Screen bezel */}
      <rect x="190" y="30" width="340" height="195" rx="4" fill="#0A0A0F" stroke="#1E1E2E" strokeWidth="1" />

      {/* Terminal screen content */}
      <rect x="190" y="30" width="340" height="195" rx="4" fill="#080808" />

      {/* Scanline overlay on screen */}
      <g opacity="0.04">
        <line x1="190" y1="30" x2="530" y2="30" stroke="#00C896" strokeWidth="0.5" />
        <line x1="190" y1="34" x2="530" y2="34" stroke="#00C896" strokeWidth="0.5" />
        <line x1="190" y1="38" x2="530" y2="38" stroke="#00C896" strokeWidth="0.5" />
        <line x1="190" y1="42" x2="530" y2="42" stroke="#00C896" strokeWidth="0.5" />
      </g>

      {/* Terminal header bar */}
      <rect x="190" y="30" width="340" height="18" fill="#131313" />
      <circle cx="202" cy="39" r="3" fill="#FF5F57" />
      <circle cx="212" cy="39" r="3" fill="#FEBC2E" />
      <circle cx="222" cy="39" r="3" fill="#28C840" />
      <text x="360" y="42" fontSize="7" fill="#555" textAnchor="middle" fontFamily="monospace">bash &#8212; 80&#215;24</text>

      {/* Terminal lines */}
      <text x="198" y="64" fontSize="8" fill="#00C896" fontFamily="monospace">
        <tspan fill="#00CC33">kasigsm@terminal</tspan><tspan fill="#555">:</tspan><tspan fill="#3B78FF">~</tspan><tspan fill="#555">$</tspan>
        {' '}./scan_device.sh
      </text>

      <text x="198" y="78" fontSize="7" fill="#888" fontFamily="monospace">Initializing USB subsystem...</text>

      <text x="198" y="92" fontSize="7" fill="#888" fontFamily="monospace">
        <tspan fill="#888">[</tspan><tspan fill="#00C896">OK</tspan><tspan fill="#888">]</tspan> Serial driver loaded
      </text>

      <text x="198" y="106" fontSize="7" fill="#888" fontFamily="monospace">
        <tspan fill="#888">[</tspan><tspan fill="#00C896">OK</tspan><tspan fill="#888">]</tspan> Port scanner ready
      </text>

      {/* Status indicator with pulse */}
      <rect x="198" y="116" width="160" height="14" rx="2" fill="#FFB800" opacity="0.1" />
      <circle cx="206" cy="123" r="3" fill="#FFB800">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x="214" y="127" fontSize="8" fill="#FFB800" fontFamily="monospace" fontWeight="600">
        WAITING FOR DEVICE...
      </text>

      {/* Blinking cursor */}
      <rect x="198" y="138" width="6" height="9" fill="#00C896" opacity="1">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
      </rect>

      {/* Connection hint at bottom */}
      <text x="198" y="212" fontSize="7" fill="#444" fontFamily="monospace">
        Plug in a device via USB to begin scan
      </text>

      {/* Laptop base/keyboard */}
      <rect x="150" y="240" width="420" height="14" rx="3" fill="#1A1A22" stroke="#1E1E2E" strokeWidth="1" />
      {/* Keyboard grid hint */}
      <rect x="220" y="243" width="280" height="6" rx="1" fill="#111118" />

      {/* Phone (smaller, left side) */}
      <rect x="30" y="120" width="75" height="150" rx="12" fill="#111118" stroke="#1E1E2E" strokeWidth="2" />
      <rect x="36" y="128" width="63" height="130" rx="4" fill="#0A0A0F" />
      {/* Phone screen content hint */}
      <line x1="44" y1="148" x2="90" y2="148" stroke="#1E1E2E" strokeWidth="1" />
      <line x1="44" y1="158" x2="80" y2="158" stroke="#00C896" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="168" x2="85" y2="168" stroke="#1E1E2E" strokeWidth="1" />
      <line x1="44" y1="178" x2="70" y2="178" stroke="#1E1E2E" strokeWidth="1" />
      {/* Home button */}
      <circle cx="67" cy="260" r="3" fill="#1E1E2E" />

      {/* USB cable: from phone right side to laptop left side */}
      <path
        id="hero-cable"
        d="M 105 195 Q 140 230 180 215"
        stroke="#00C896"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* USB plug heads */}
      <rect x="100" y="190" width="8" height="10" rx="2" fill="#00C896" />
      <rect x="174" y="210" width="8" height="10" rx="2" fill="#00C896" />

      {/* Travelling pulse along the cable */}
      <circle r="3" fill="#00C896">
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href="#hero-cable" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
