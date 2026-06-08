import { useScannerContext } from './ScannerContext';
import DeviceCard from './DeviceCard';
import IssueSelector from './IssueSelector';
import ToolResults from './ToolResults';
import ManualEntry from './ManualEntry';
import RegistrationPrompt from './RegistrationPrompt';
import { SCANNER_STATES } from '../../hooks/useDeviceSerial';

export default function ScannerResults() {
  const {
    serial,
    issues,
    issuesLoading,
    issue,
    toolItems,
    toolsLoading,
    showPrompt,
    promptDismissed,
    currentIssueLabel,
    handleIssueChange,
    handleManualSubmit,
    handleReset,
    setPromptDismissed,
  } = useScannerContext();

  // Don't render if no results to show
  const showResults = serial.state === SCANNER_STATES.IDENTIFIED
    || serial.state === SCANNER_STATES.ISSUE_SELECTED
    || serial.state === SCANNER_STATES.RESULTS
    || serial.state === SCANNER_STATES.ERROR
    || serial.state === SCANNER_STATES.ASSISTED_ENTRY
    || serial.state === SCANNER_STATES.MANUAL_ENTRY;

  if (!showResults) return null;

  return (
    <section className="scanner-results" id="scanner-results">
      <div className="scanner-results__content">
        {serial.state === SCANNER_STATES.ERROR && (
          <ManualEntry
            onSubmit={handleManualSubmit}
            onCancel={handleReset}
          />
        )}

        {serial.state === SCANNER_STATES.ASSISTED_ENTRY && (
          <ManualEntry
            onSubmit={handleManualSubmit}
            onCancel={handleReset}
            defaultBrand={serial.device?.brand || ''}
            usbInfo={serial.usb}
            hint={serial.device?.restricted
              ? 'AT commands were restricted by your device/carrier. The USB connection is verified — just confirm the model.'
              : (serial.usb && serial.usb.brand !== 'Unknown'
                  ? 'No AT response on this USB interface (likely MTP/ADB only). The USB device is verified — confirm the model.'
                  : null)}
          />
        )}

        {serial.state === SCANNER_STATES.MANUAL_ENTRY && (
          <ManualEntry onSubmit={handleManualSubmit} />
        )}

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
