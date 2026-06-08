import { useScannerContext } from './ScannerContext';
import StatusDot from './StatusDot';
import Typewriter from './Typewriter';
import { SCANNER_STATES } from '../../hooks/useDeviceSerial';

export default function ScannerTerminal() {
  const { serial, terminalLines, activeLineIndex } = useScannerContext();

  return (
    <div className="scanner-terminal">
      <StatusDot state={serial.state} />

      <Typewriter lines={terminalLines} activeIndex={activeLineIndex} />

      {serial.error ? (
        <div className="browser-warning" role="alert">
          {serial.error}
        </div>
      ) : null}

      {serial.usb ? (
        <div className="usb-info" aria-label="USB device info">
          <span className="usb-info__check">&#10003;</span>
          <span className="usb-info__brand">{serial.usb.brand}</span>
          {serial.usb.mode ? <span className="usb-info__mode"> {serial.usb.mode}</span> : null}
        </div>
      ) : null}

      {serial.state === SCANNER_STATES.IDLE && (
        <div className="scan-actions">
          <button
            type="button"
            className="scan-btn"
            onClick={serial.startScan}
            disabled={!serial.supported}
          >
            Connect &amp; scan device
          </button>
          <button
            type="button"
            className="scan-link"
            onClick={serial.setManualEntry}
          >
            Enter device manually
          </button>
          {!serial.supported && (
            <div className="browser-warning">Auto-detect requires Chrome or Edge. You can still enter your device manually below.</div>
          )}
        </div>
      )}

      {serial.state === SCANNER_STATES.ERROR && (
        <div className="scan-actions" style={{ alignItems: 'flex-start' }}>
          <div className="scan-link" onClick={serial.reset}>
            Try again
          </div>
        </div>
      )}

      {serial.state === SCANNER_STATES.ASSISTED_ENTRY && (
        <div className="scan-actions" style={{ alignItems: 'flex-start' }}>
          <div className="scan-link" onClick={serial.reset}>
            Cancel
          </div>
        </div>
      )}

      {serial.state === SCANNER_STATES.MANUAL_ENTRY && (
        <div className="scan-actions" style={{ alignItems: 'flex-start' }}>
          <div className="scan-link" onClick={serial.reset}>
            Cancel
          </div>
        </div>
      )}
    </div>
  );
}
