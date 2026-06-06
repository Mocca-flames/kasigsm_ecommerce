const LABELS = {
  IDLE: 'READY',
  REQUESTING: 'REQUESTING PORT ACCESS',
  READING: 'READING DEVICE',
  IDENTIFIED: 'DEVICE IDENTIFIED',
  ASSISTED_ENTRY: 'USB VERIFIED — CONFIRM MODEL',
  ISSUE_SELECTED: 'ISSUE SELECTED',
  RESULTS: 'TOOLS READY',
  ERROR: 'ERROR',
  MANUAL_ENTRY: 'MANUAL ENTRY',
};

export default function StatusDot({ state }) {
  const variant = {
    IDLE: 'idle',
    REQUESTING: 'scanning',
    READING: 'scanning',
    IDENTIFIED: 'connected',
    ASSISTED_ENTRY: 'connected',
    ISSUE_SELECTED: 'connected',
    RESULTS: 'connected',
    ERROR: 'error',
    MANUAL_ENTRY: 'idle',
  }[state] || 'idle';

  const label = LABELS[state] || 'UNKNOWN';
  return (
    <div className="scanner-status" aria-live="polite">
      <span className={`status-dot status-dot--${variant}`} />
      <span>● {label}</span>
    </div>
  );
}
