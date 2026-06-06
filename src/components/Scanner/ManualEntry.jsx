import { useState } from 'react';
import { useBrands, useChipsets } from '../../hooks/useHomeData';
import { formatHex } from '../../lib/serialUtils';

const FALLBACK_BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Tecno', 'Infinix', 'Itel', 'Huawei', 'Oppo', 'Vivo', 'Realme', 'Motorola', 'Google', 'Nokia'];
const FALLBACK_CHIPSETS = ['Exynos', 'Snapdragon', 'MediaTek', 'Unisoc', 'Apple A-series', 'Tensor'];

export default function ManualEntry({ onSubmit, onCancel, defaultBrand = '', usbInfo = null, hint = null }) {
  const { brands } = useBrands();
  const { chipsets } = useChipsets();
  const [brand, setBrand] = useState(defaultBrand);
  const [model, setModel] = useState('');
  const [chipset, setChipset] = useState('');
  const [error, setError] = useState(null);

  const brandOptions = (brands.length ? brands : FALLBACK_BRANDS).map((b) =>
    typeof b === 'string' ? b : (b.name || b.slug || '')
  );
  const chipOptions = (chipsets.length ? chipsets : FALLBACK_CHIPSETS).map((c) =>
    typeof c === 'string' ? c : (c.name || c.slug || '')
  );

  const handle = (e) => {
    e.preventDefault();
    if (!brand || !model.trim()) {
      setError('Brand and model are required');
      return;
    }
    onSubmit({
      brand,
      model: model.trim(),
      chipset: chipset || '—',
      android: '—',
      firmware: '—',
      imei: '—',
      manual: true,
      usb: usbInfo || undefined,
    });
  };

  return (
    <form className="manual-entry" onSubmit={handle} aria-label="Manual device entry">
      {usbInfo ? (
        <div className="manual-entry__usb-banner" role="status">
          <span className="manual-entry__usb-check">✓</span>
          <div className="manual-entry__usb-text">
            <strong>USB device verified</strong> — {usbInfo.brand}
            {usbInfo.mode ? ` · ${usbInfo.mode}` : ''}
            <span className="manual-entry__usb-ids">
              {formatHex(usbInfo.vendorId)} / {formatHex(usbInfo.productId)}
            </span>
          </div>
        </div>
      ) : null}
      {hint ? <div className="manual-entry__hint">{hint}</div> : null}

      <div className="manual-entry__title">Confirm your model</div>
      <div className="manual-entry__row">
        <div className="manual-entry__field">
          <label htmlFor="me-brand">Brand</label>
          <select id="me-brand" value={brand} onChange={(e) => setBrand(e.target.value)} required>
            <option value="">Select brand</option>
            {brandOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="manual-entry__field">
          <label htmlFor="me-model">Model</label>
          <input
            id="me-model"
            type="text"
            placeholder="e.g. SM-A546B"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
        </div>
        <div className="manual-entry__field">
          <label htmlFor="me-chip">Chipset (optional)</label>
          <select id="me-chip" value={chipset} onChange={(e) => setChipset(e.target.value)}>
            <option value="">Select chipset</option>
            {chipOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      {error ? <div className="imei-section__msg" style={{ color: 'var(--color-warning)' }}>{error}</div> : null}
      <div className="scan-actions" style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 8 }}>
        <button type="submit" className="scan-btn">Find tools</button>
        {onCancel ? (
          <button type="button" className="scan-btn scan-btn--ghost" onClick={onCancel}>Cancel</button>
        ) : null}
      </div>
    </form>
  );
}
