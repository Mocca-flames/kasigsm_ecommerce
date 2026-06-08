import { createContext, useContext, useState, useEffect } from 'react';
import { useDeviceSerial, SCANNER_STATES } from '../../hooks/useDeviceSerial';
import { useIssues, useLocalStorage } from '../../hooks/useHomeData';
import { api } from '../../services/api';

const ScannerContext = createContext(null);

export function useScannerContext() {
  return useContext(ScannerContext);
}

export function ScannerProvider({ children }) {
  const serial = useDeviceSerial();
  const { issues, loading: issuesLoading } = useIssues();
  const [issue, setIssue] = useState(null);
  const [toolItems, setToolItems] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useLocalStorage('home_soft_reg_dismissed', false);

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
    const t = setTimeout(() => setShowPrompt(true), 3000);
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

  const currentIssueLabel = issue
    ? (issues.find((i) => (i.slug || i.value || i.name) === issue)?.label
       || issues.find((i) => (i.slug || i.value || i.name) === issue)?.name
       || issue)
    : null;

  const value = {
    serial,
    issues,
    issuesLoading,
    issue,
    toolItems,
    toolsLoading,
    showPrompt,
    promptDismissed,
    terminalLines,
    activeLineIndex,
    currentIssueLabel,
    handleIssueChange,
    handleManualSubmit,
    handleReset,
    setPromptDismissed,
  };

  return (
    <ScannerContext.Provider value={value}>
      {children}
    </ScannerContext.Provider>
  );
}
