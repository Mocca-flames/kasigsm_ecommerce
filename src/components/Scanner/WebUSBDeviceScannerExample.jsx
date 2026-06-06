import { useEffect, useMemo, useState } from 'react';
import { useWebUSBDevice, USB_STATES } from '../../hooks/useWebUSBDevice';
import { formatHex } from '../../lib/usbUtils';

/* ============================================================
   WebUSBDeviceScannerExample
   ------------------------------------------------------------
   A drop-in React component showing how to use useWebUSBDevice.
   - Shows "Connect device" button (always a user gesture)
   - Renders a live transport/state badge
   - Renders the structured response as a JSON <pre> for dev
   - Lists each classified interface with its endpoints
   - Surfaces connect/disconnect/error transitions
   - Lets the user "Forget" a previously authorised device
   - Works as a standalone demo or you can lift state up and
     pipe `response` into your scanner flow.

   This file is also a living spec — it documents the JSON
   contract that the rest of the app can depend on.
   ============================================================ */

const STATE_LABELS = {
  IDLE: 'No device',
  REQUESTING: 'Choose a device…',
  ENUMERATING: 'Reading USB descriptors…',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected — waiting for reconnect',
  ERROR: 'Error',
};

const STATE_CLASS = {
  IDLE: 'idle',
  REQUESTING: 'pending',
  ENUMERATING: 'pending',
  CONNECTED: 'ok',
  DISCONNECTED: 'warn',
  ERROR: 'error',
};

export default function WebUSBDeviceScannerExample() {
  const usb = useWebUSBDevice({ autoReconnect: true });
  const [jsonView, setJsonView] = useState(false);

  const stateLabel = STATE_LABELS[usb.state] || usb.state;
  const stateClass = STATE_CLASS[usb.state] || 'idle';

  const response = usb.response;
  const isSecure = usb.browser.isSecureContext;

  const supportMessage = useMemo(() => {
    if (usb.isSupported) return null;
    if (usb.browser.name === 'Firefox' || usb.browser.name === 'Safari') {
      return `WebUSB is not supported in ${usb.browser.name}. Use Chrome, Edge, or Opera.`;
    }
    return 'WebUSB is not available in this browser.';
  }, [usb.isSupported, usb.browser.name]);

  useEffect(() => {
    if (usb.state === USB_STATES.DISCONNECTED) {
      console.info('[WebUSB] device disconnected, awaiting reconnect…');
    } else if (usb.state === USB_STATES.CONNECTED && response) {
      console.info('[WebUSB] connected', response);
    } else if (usb.state === USB_STATES.ERROR && usb.error) {
      console.warn('[WebUSB] error', usb.error);
    }
  }, [usb.state, usb.error, response]);

  if (supportMessage) {
    return (
      <div className="usb-scanner">
        <h3>USB Device Scanner</h3>
        <p className="usb-scanner__warn">{supportMessage}</p>
      </div>
    );
  }

  return (
    <div className="usb-scanner">
      <header className="usb-scanner__head">
        <h3>USB Device Scanner</h3>
        <span className={`usb-scanner__pill usb-scanner__pill--${stateClass}`}>
          {stateLabel}
        </span>
      </header>

      {!isSecure && (
        <p className="usb-scanner__warn">
          WebUSB requires a secure context (HTTPS or localhost).
        </p>
      )}

      {usb.error ? (
        <div className="usb-scanner__error" role="alert">
          <strong>{usb.error.name}:</strong> {usb.error.userMessage}
          {usb.error.retryable ? ' (retryable)' : ''}
        </div>
      ) : null}

      {/* Action bar — always wraps a user gesture. */}
      <div className="usb-scanner__actions">
        <button
          type="button"
          className="usb-scanner__btn"
          onClick={() => usb.requestDevice()}
          disabled={
            usb.state === USB_STATES.REQUESTING ||
            usb.state === USB_STATES.ENUMERATING
          }
        >
          {usb.state === USB_STATES.CONNECTED ? 'Connect another' : 'Connect & scan device'}
        </button>
        {usb.state === USB_STATES.CONNECTED ? (
          <button type="button" className="usb-scanner__btn usb-scanner__btn--ghost" onClick={usb.reset}>
            Disconnect
          </button>
        ) : null}
        {usb.state === USB_STATES.DISCONNECTED ? (
          <button type="button" className="usb-scanner__btn" onClick={usb.reconnect}>
            Try reconnect
          </button>
        ) : null}
        <button
          type="button"
          className="usb-scanner__btn usb-scanner__btn--ghost"
          onClick={() => setJsonView((v) => !v)}
          disabled={!response}
        >
          {jsonView ? 'Show tree' : 'Show JSON'}
        </button>
      </div>

      {/* Previously authorised devices — instant reconnect without picker. */}
      {usb.previouslyAuthorised?.length ? (
        <section className="usb-scanner__auth">
          <h4>Previously authorised</h4>
          <ul>
            {usb.previouslyAuthorised.map((d) => (
              <li key={`${d.vendorId}-${d.productId}-${d.serialNumber || 's'}`}>
                <button
                  type="button"
                  className="usb-scanner__link"
                  onClick={() => usb.requestPermissionFor(d.vendorId, d.productId)}
                >
                  {d.productName || d.manufacturerName || 'Unknown device'}
                  {' '}
                  <code>{formatHex(d.vendorId)}/{formatHex(d.productId)}</code>
                </button>
                <button
                  type="button"
                  className="usb-scanner__btn usb-scanner__btn--tiny"
                  onClick={() => usb.forgetDevice(d.vendorId, d.productId, d.serialNumber)}
                >
                  Forget
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Response body — either structured tree or raw JSON. */}
      {response ? (
        jsonView ? (
          <pre className="usb-scanner__json">
            {JSON.stringify(response, null, 2)}
          </pre>
        ) : (
          <DeviceTree response={response} />
        )
      ) : null}
    </div>
  );
}

/* Renders the structured response as a human-readable tree. */
function DeviceTree({ response }) {
  const { selected, interfaces, capabilities, brand, mode, transport, browser } = response;
  if (!selected) return null;

  return (
    <section className="usb-scanner__tree">
      <div className="usb-scanner__row">
        <span className="usb-scanner__label">Transport</span>
        <span className="usb-scanner__value">{transport} · {browser.name} {browser.version}</span>
      </div>
      <div className="usb-scanner__row">
        <span className="usb-scanner__label">Brand</span>
        <span className="usb-scanner__value">{brand} {mode ? `· ${mode}` : ''}</span>
      </div>
      <div className="usb-scanner__row">
        <span className="usb-scanner__label">USB IDs</span>
        <span className="usb-scanner__value">
          <code>{selected.vendorHex}</code> / <code>{selected.productHex}</code>
        </span>
      </div>
      {selected.manufacturerName ? (
        <div className="usb-scanner__row">
          <span className="usb-scanner__label">Manufacturer</span>
          <span className="usb-scanner__value">{selected.manufacturerName}</span>
        </div>
      ) : null}
      {selected.productName ? (
        <div className="usb-scanner__row">
          <span className="usb-scanner__label">Product</span>
          <span className="usb-scanner__value">{selected.productName}</span>
        </div>
      ) : null}
      {selected.serialNumber ? (
        <div className="usb-scanner__row">
          <span className="usb-scanner__label">Serial</span>
          <span className="usb-scanner__value"><code>{selected.serialNumber}</code></span>
        </div>
      ) : null}

      <h4 className="usb-scanner__sub">Capabilities</h4>
      <ul className="usb-scanner__caps">
        <Cap label="ADB" on={capabilities.adb} />
        <Cap label="Fastboot" on={capabilities.fastboot} />
        <Cap label="MTP" on={capabilities.mtp} />
        <Cap label="PTP" on={capabilities.ptp} />
        <Cap label="Modem (CDC)" on={capabilities.modem} />
        <Cap label="Mass storage" on={capabilities.massStorage} />
      </ul>

      <h4 className="usb-scanner__sub">Interfaces ({interfaces.length})</h4>
      <ul className="usb-scanner__ifaces">
        {interfaces.map((i) => (
          <li key={`${i.interfaceNumber}-${i.alternate}`} className={`iface iface--${i.kind}`}>
            <div className="iface__head">
              <strong>#{i.interfaceNumber}.{i.alternate}</strong>
              <span className="iface__label">{i.className}</span>
              {i.adb ? <span className="iface__badge iface__badge--adb">ADB</span> : null}
            </div>
            <div className="iface__meta">
              class <code>0x{i.interfaceClass.toString(16).padStart(2, '0')}</code>
              {' '}sub <code>0x{i.interfaceSubclass.toString(16).padStart(2, '0')}</code>
              {' '}proto <code>0x{i.interfaceProtocol.toString(16).padStart(2, '0')}</code>
            </div>
            {i.endpoints.length ? (
              <ul className="iface__eps">
                {i.endpoints.map((ep) => (
                  <li key={ep.address}>
                    <code>{ep.address}</code> · {ep.type} · {ep.packetSize}B
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cap({ label, on }) {
  return (
    <li className={`cap ${on ? 'cap--on' : 'cap--off'}`}>
      <span className="cap__dot" aria-hidden="true" />
      {label}
    </li>
  );
}
