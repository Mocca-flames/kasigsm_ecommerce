import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

function validateImei(imei) {
  const s = String(imei || '').replace(/\D/g, '');
  if (s.length < 14 || s.length > 16) return false;
  return true;
}

export default function ImeiChecker() {
  const [imei, setImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [upsell, setUpsell] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setUpsell(null);
    if (!validateImei(imei)) {
      setError('Enter a valid 15-digit IMEI');
      return;
    }
    setLoading(true);
    try {
      const data = await api.checkImei(imei);
      const r = data?.result || data;
      setResult(r);
      if (r?.blacklist === 'flagged' || r?.carrier_lock) {
        setUpsell({
          label: r.blacklist === 'flagged'
            ? 'Need to remove this blacklist flag?'
            : 'Need to unlock this device?',
          link: '/services',
        });
      } else if (r?.warranty === 'expired') {
        setUpsell({
          label: 'Out of warranty? See compatible tools',
          link: '/services',
        });
      }
    } catch (e2) {
      setError(e2.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="imei-section" aria-labelledby="imei-heading">
      <div className="imei-section__inner">
        <div>
          <h2 id="imei-heading" className="imei-section__title">🔍 Free IMEI checker</h2>
          <p className="imei-section__desc">
            Check blacklist, carrier lock, and warranty status. No registration needed. Used by 1,200+ workshops daily.
          </p>
          {result ? (
            <div className="imei-section__result" role="status">
              <div className="imei-section__result-row">
                <span className="label">Blacklist</span>
                <span className="val" style={{ color: result.blacklist === 'flagged' ? 'var(--color-warning)' : 'var(--color-accent)' }}>
                  {result.blacklist || 'clean'}
                </span>
              </div>
              <div className="imei-section__result-row">
                <span className="label">Carrier lock</span>
                <span className="val">{result.carrier_lock || 'unlocked'}</span>
              </div>
              <div className="imei-section__result-row">
                <span className="label">Warranty</span>
                <span className="val">{result.warranty || 'unknown'}</span>
              </div>
              {upsell ? (
                <div className="imei-section__upsell">
                  {upsell.label}
                  <Link to={upsell.link}>Find the right tool →</Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <form className="imei-section__form" onSubmit={handle}>
          <div className="imei-section__input-row">
            <input
              type="text"
              inputMode="numeric"
              maxLength={16}
              pattern="[0-9]*"
              placeholder="Enter 15-digit IMEI"
              className="imei-section__input"
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
              aria-label="IMEI"
            />
            <button type="submit" className="imei-section__btn" disabled={loading || imei.length < 14}>
              {loading ? 'Checking…' : 'Check free'}
            </button>
          </div>
          {error ? (
            <div className="imei-section__msg" style={{ color: 'var(--color-warning)' }}>{error}</div>
          ) : (
            <div className="imei-section__msg">Dial *#06# to find your IMEI.</div>
          )}
        </form>
      </div>
    </section>
  );
}
