import { Link } from 'react-router-dom';
import { zar } from '../../lib/currency';

const SUPPORT_WHATSAPP = 'https://wa.me/0000000000';

export default function ToolResults({ items, loading, device, issueLabel }) {
  if (loading) {
    return (
      <div className="tool-results" aria-busy="true">
        <div className="tool-results__title">Finding compatible services…</div>
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="tool-results">
        <div className="tool-results__title">
          Recommended services for {device?.model || 'your device'}{issueLabel ? ` · ${issueLabel}` : ''}
        </div>
        <div className="empty-state">
          No services found for this combination.
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer">Contact support →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-results">
      <div className="tool-results__title">
        Recommended services for <strong>{device?.model || 'your device'}</strong>
        {issueLabel ? <> · <strong>{issueLabel}</strong></> : null}
      </div>
      {items.map((item, idx) => {
        const name = item.name || 'Service';
        const provider = item.provider || item.vendor || item.brand || (item.category || '').toUpperCase() || 'SERVICE';
        const rent = item.rent_price_final;
        const full = item.full_price_final;
        const save = rent != null && full != null && full > rent ? full - rent : null;
        const reason = item.reason;
        const features = [];
        if (reason) features.push(reason);
        if (item.description) features.push(item.description);
        if (features.length === 0) features.push('Instant delivery');

        return (
          <div className="tool-card" key={`${item.slug}-${idx}`}>
            <div className="tool-card__head">
              <div className="tool-card__brand">{provider}</div>
              <div className="tool-card__badge">Recommended</div>
            </div>
            <div className="tool-card__name">{name}</div>
            <ul className="tool-card__features">
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            {(rent != null || full != null) && (
              <div className="tool-card__pricing">
                {rent != null && (
                  <div className="tool-card__price-block">
                    <span className="tool-card__price-label">Rent</span>
                    <span className="tool-card__price-rent">{zar(rent)}</span>
                  </div>
                )}
                {full != null && (
                  <div className="tool-card__price-block">
                    <span className="tool-card__price-label">Full license</span>
                    <span className="tool-card__price-rent" style={{ fontSize: 'var(--text-base)' }}>
                      {zar(full)}
                    </span>
                  </div>
                )}
              </div>
            )}
            {save != null && (
              <div className="tool-card__save">Save {zar(save)} by renting</div>
            )}
            <div className="tool-card__actions">
              <Link
                to="/services"
                className="tool-card__rent"
              >
                View service{rent != null ? ` — ${zar(rent)}` : ''}
              </Link>
              <Link
                to="/services"
                className="tool-card__details"
              >
                See details
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
