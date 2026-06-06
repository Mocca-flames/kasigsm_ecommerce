import { Link } from 'react-router-dom';
import { maskImei } from '../../lib/serialUtils';

export default function DeviceCard({ device }) {
  if (!device) return null;
  return (
    <div className="device-card" role="region" aria-label="Detected device">
      <div className="device-card__head">
        <div className="device-card__title">
          ▸ {device.brand?.toUpperCase() || 'DEVICE'} {device.model && device.model !== 'Unknown' ? device.model : ''}
        </div>
        <span className="device-card__live">LIVE</span>
      </div>

      <div className="device-card__row">
        <span className="device-card__label">Model</span>
        <span className="device-card__value">{device.model || '—'}</span>
      </div>
      <div className="device-card__row">
        <span className="device-card__label">Chipset</span>
        <span className="device-card__value">{device.chipset || '—'}</span>
      </div>
      <div className="device-card__row">
        <span className="device-card__label">Android</span>
        <span className="device-card__value">{device.android || '—'}</span>
      </div>
      <div className="device-card__row">
        <span className="device-card__label">Firmware</span>
        <span className="device-card__value">{device.firmware || '—'}</span>
      </div>
      <div className="device-card__row">
        <span className="device-card__label">IMEI</span>
        <span className="device-card__value device-card__imei">
          <span>{device.imei ? maskImei(device.imei) : '—'}</span>
          <Link to="/imei-checker" className="device-card__check">Check blacklist →</Link>
        </span>
      </div>
    </div>
  );
}
