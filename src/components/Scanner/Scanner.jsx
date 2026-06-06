import { useEffect, useState } from 'react';
import StatusDot from './StatusDot';
import Typewriter from './Typewriter';
import DeviceCard from './DeviceCard';
import IssueSelector from './IssueSelector';
import ToolResults from './ToolResults';
import ManualEntry from './ManualEntry';
import RegistrationPrompt from './RegistrationPrompt';
import { useDeviceSerial, SCANNER_STATES } from '../../hooks/useDeviceSerial';
import { useIssues } from '../../hooks/useHomeData';
import { useLocalStorage } from '../../hooks/useHomeData';
import { api } from '../../services/api';

/* The Scanner orchestrates state across all sub-components.
 * - IDLE/REQUESTING/READING/IDENTIFIED: typewriter drives the terminal
 * - IDENTIFIED: device card + issue selector
 * - ISSUE_SELECTED/RESULTS: tool recommendations
 * - ERROR: manual entry fallback
 * - MANUAL_ENTRY: standalone manual form
 */

const SOFT_REG_DELAY_MS = 3000;

export default function Scanner() {
  const serial = useDeviceSerial();
  const { issues, loading: issuesLoading } = useIssues();
  const [issue, setIssue] = useState(null);
  const [toolItems, setToolItems] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useLocalStorage('home_soft_reg_dismissed', false);

  // Decide which terminal lines to render and which is active
  const terminalLines = serial.log;
  const activeLineIndex = serial.state === SCANNER_STATES.READING || serial.state === SCANNER_STATES.REQUESTING
    ? terminalLines.findIndex((l) => l.status === 'pending')
    : -1;

  // When device is identified, auto-advance to issue picker
  useEffect(() => {
    if (serial.state === SCANNER_STATES.IDENTIFIED) {
      setIssue(null);
      setShowPrompt(false);
    }
  }, [serial.state]);

  // Whether the manual form should be shown with USB-verified context
  const assistedHint = serial.device?.restricted
    ? 'AT commands were restricted by your device/carrier. The USB connection is verified — just confirm the model.'
    : (serial.usb && serial.usb.brand !== 'Unknown'
        ? 'No AT response on this USB interface (likely MTP/ADB only). The USB device is verified — confirm the model.'
        : null);

  // When issue selected, fetch tool recommendations
  useEffect(() => {
    if (serial.state !== SCANNER_STATES.ISSUE_SELECTED || !issue || !serial.device) {
      return;
    }
    let cancelled = false;
    setToolsLoading(true);
    setShowPrompt(false);
    (async () => {
      try {
        await api.submitDeviceScan({
          brand: serial.device.brand,
          model: serial.device.model,
          issue_slug: issue,
          source: serial.device.manual ? 'manual' : (serial.device.source || 'serial'),
        }).catch(() => null);

        const items = await api.recommendServices({
          issues: issue ? [issue] : [],
          brand_slug: serial.device.brand,
          chipset_key: serial.device.chipset || '',
          top: 3,
        });
        if (!cancelled) {
          setToolItems(items);
          serial.setResults();
        }
      } catch {
        if (!cancelled) {
          setToolItems([]);
          serial.setResults();
        }
      } finally {
        if (!cancelled) setToolsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [serial.state, issue, serial.device]); // eslint-disable-line react-hooks/exhaustive-deps

  // After results, surface the soft registration prompt after a delay
  useEffect(() => {
    if (serial.state !== SCANNER_STATES.RESULTS || promptDismissed) {
      return undefined;
    }
    const t = setTimeout(() => setShowPrompt(true), SOFT_REG_DELAY_MS);
    return () => clearTimeout(t);
  }, [serial.state, promptDismissed]);

  const handleIssueChange = (slug) => {
    setIssue(slug);
    serial.selectIssue();
  };

  const handleManualSubmit = (payload) => {
    serial.setManualDevice(payload);
  };

  const handleReset = () => {
    setIssue(null);
    setToolItems([]);
    setShowPrompt(false);
    serial.reset();
  };

  const showScannerShell = serial.supported;
  const currentIssueLabel = issue
    ? (issues.find((i) => (i.slug || i.value || i.name) === issue)?.label
       || issues.find((i) => (i.slug || i.value || i.name) === issue)?.name
       || issue)
    : null;

  return (
    <section className="scanner-section" id="scanner" aria-labelledby="scanner-heading">
      <div className="scanner-content">
        <div className="scanner-eyebrow">FREE DEVICE SCANNER</div>
        <h2 id="scanner-heading" className="scanner-heading">Identify your device — get the right tool</h2>
        <p className="scanner-sub">Plug in your phone via USB. No install required.</p>

        <StatusDot state={serial.state} />

        {showScannerShell && serial.state !== SCANNER_STATES.MANUAL_ENTRY ? (
          <Typewriter lines={terminalLines} activeIndex={activeLineIndex} />
        ) : null}

        {serial.error ? (
          <div className="browser-warning" role="alert">
            ⚠ {serial.error}
          </div>
        ) : null}

        {serial.usb ? (
          <div className="usb-info" aria-label="USB device info">
            <span className="usb-info__check">✓</span>
            <span className="usb-info__brand">{serial.usb.brand}</span>
            {serial.usb.mode ? <span className="usb-info__mode">· {serial.usb.mode}</span> : null}
          </div>
        ) : null}

        {/* IDLE — primary scan CTA */}
        {serial.state === SCANNER_STATES.IDLE && (
          <div className="scan-actions">
            <button
              type="button"
              className="scan-btn"
              onClick={serial.startScan}
              disabled={!serial.supported}
            >
              ⚡ Connect &amp; scan device
            </button>
            <button
              type="button"
              className="scan-link"
              onClick={serial.setManualEntry}
            >
              Enter device manually ↓
            </button>
            {!serial.supported && (
              <div className="browser-warning">⚠ Auto-detect requires Chrome or Edge. You can still enter your device manually below.</div>
            )}
          </div>
        )}

        {/* ERROR — fallback to manual entry */}
        {serial.state === SCANNER_STATES.ERROR && (
          <div className="scan-actions" style={{ alignItems: 'flex-start' }}>
            <ManualEntry
              onSubmit={handleManualSubmit}
              onCancel={handleReset}
            />
          </div>
        )}

        {/* ASSISTED ENTRY — USB verified, AT blocked. Brand pre-filled. */}
        {serial.state === SCANNER_STATES.ASSISTED_ENTRY && (
          <div className="scan-actions" style={{ alignItems: 'flex-start' }}>
            <ManualEntry
              onSubmit={handleManualSubmit}
              onCancel={handleReset}
              defaultBrand={serial.device?.brand || ''}
              usbInfo={serial.usb}
              hint={assistedHint}
            />
          </div>
        )}

        {/* MANUAL ENTRY — primary manual form */}
        {serial.state === SCANNER_STATES.MANUAL_ENTRY && (
          <ManualEntry onSubmit={handleManualSubmit} />
        )}

        {/* IDENTIFIED / ISSUE_SELECTED / RESULTS — device card + issues + results */}
        {(serial.state === SCANNER_STATES.IDENTIFIED
          || serial.state === SCANNER_STATES.ISSUE_SELECTED
          || serial.state === SCANNER_STATES.RESULTS) && serial.device && (
          <>
            <DeviceCard device={serial.device} />
            <div className="issue-block">
              <div className="issue-block__title">What do you need to fix?</div>
              <IssueSelector
                issues={issues}
                value={issue}
                onChange={handleIssueChange}
                loading={issuesLoading}
              />
            </div>
          </>
        )}

        {/* RESULTS — tool cards + soft registration */}
        {serial.state === SCANNER_STATES.RESULTS && (
          <>
            <ToolResults
              items={toolItems}
              loading={toolsLoading}
              device={serial.device}
              issueLabel={currentIssueLabel}
            />
            {showPrompt && !promptDismissed && (
              <RegistrationPrompt
                onSaved={() => setPromptDismissed(true)}
              />
            )}
            {promptDismissed && null}
            <div className="scan-actions" style={{ marginTop: 24, alignItems: 'flex-start' }}>
              <button type="button" className="scan-btn scan-btn--ghost" onClick={handleReset}>
                Scan another device
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
