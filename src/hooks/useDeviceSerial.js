import { useCallback, useEffect, useRef, useState } from 'react';
import {
  openSerialPort,
  closeSerialPort,
  sendAtCommand,
  isWebSerialSupported,
  isCmeBlocked,
  getPortInfo,
  formatHex,
  extractModelHint,
  parseDevConInfo,
  AT_DEVCONINFO,
  SERIAL_BAUD,
  SERIAL_DATA_BITS,
  SERIAL_PARITY,
  SERIAL_STOP_BITS,
} from '../lib/serialUtils';
import { runWebUsbPreScan, getEnrichmentForPort } from '../lib/usbUtils';

/* State machine — USB first, AT second, manual as assisted fallback.
 *
 *   IDLE
 *     ↓ startScan
 *   REQUESTING (port picker open)
 *     ↓
 *   READING (port open, USB identified, AT attempting)
 *     ↓
 *   ┌──────────────┬────────────────┐
 *   ↓              ↓                ↓
 * IDENTIFIED   ASSISTED_ENTRY    ERROR
 * (AT OK)      (USB OK, AT       (port
 *                blocked)         failed)
 *
 * CME-restricted AT responses are NOT failures — the USB layer has
 * already verified the device, so we hand off to manual entry with
 * the brand pre-filled.
 */

export const SCANNER_STATES = {
  IDLE: 'IDLE',
  REQUESTING: 'REQUESTING',
  READING: 'READING',
  IDENTIFIED: 'IDENTIFIED',
  ASSISTED_ENTRY: 'ASSISTED_ENTRY',
  ISSUE_SELECTED: 'ISSUE_SELECTED',
  RESULTS: 'RESULTS',
  ERROR: 'ERROR',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
};

const COMMAND_DELAY_MS = 220;

export function useDeviceSerial() {
  const [state, setState] = useState(SCANNER_STATES.IDLE);
  const [device, setDevice] = useState(null);
  const [usb, setUsb] = useState(null);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]);
  const portRef = useRef(null);
  const cancelledRef = useRef(false);

  const appendLog = useCallback((line, status = 'pending') => {
    setLog((prev) => {
      const next = [...prev, { text: line, status, id: Date.now() + Math.random() }];
      return next.slice(-10);
    });
  }, []);

  const updateLastLog = useCallback((patch) => {
    setLog((prev) => {
      const next = [...prev];
      if (next.length === 0) return prev;
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });
  }, []);

  const markLast = useCallback((status) => {
    setLog((prev) => {
      const next = [...prev];
      if (next.length === 0) return prev;
      next[next.length - 1] = { ...next[next.length - 1], status };
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    if (portRef.current) {
      closeSerialPort(portRef.current);
      portRef.current = null;
    }
    setState(SCANNER_STATES.IDLE);
    setDevice(null);
    setUsb(null);
    setError(null);
    setLog([]);
  }, []);

  /* WebUSB fallback path. Used when WebSerial is unavailable or
     the user cancelled the serial picker. Shows the WebUSB picker,
     classifies the device, and goes straight to assisted entry
     (no AT — no serial port to talk to). */
  const runWebUsbFallback = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.usb) {
      setError('WebUSB not available. Enter your device manually.');
      setState(SCANNER_STATES.ERROR);
      return;
    }
    appendLog('Trying WebUSB enumeration...', 'pending');
    const pre = await runWebUsbPreScan();
    if (cancelledRef.current) return;
    if (!pre.ok) {
      markLast('error');
      if (pre.code === 'cancelled') {
        appendLog('USB selection cancelled.', 'error');
        setState(SCANNER_STATES.IDLE);
        return;
      }
      setError(pre.reason);
      setState(SCANNER_STATES.ERROR);
      return;
    }
    markLast('ok');
    const webusb = pre.response;
    const vid = formatHex(webusb.selected.vendorId);
    const pid = formatHex(webusb.selected.productId);
    appendLog(
      `USB: ${vid} / ${pid} — ${webusb.brand}${webusb.mode ? ` (${webusb.mode})` : ''}`,
      'ok',
    );
    if (webusb.selected.manufacturerName || webusb.selected.productName) {
      const manu = webusb.selected.manufacturerName || '—';
      const prod = webusb.selected.productName || '—';
      appendLog(`Device: ${manu} / ${prod}`, 'ok');
    }
    if (webusb.selected.serialNumber) {
      appendLog(`Serial: ${webusb.selected.serialNumber}`, 'ok');
    }
    if (!webusb.capabilities.modem) {
      appendLog('No CDC interface — AT probing skipped.', 'ok');
    } else {
      appendLog('CDC interface present, but no serial port was picked. AT probing skipped.', 'pending');
      markLast('error');
    }
    const model = extractModelHint({
      serial: webusb.selected.serialNumber,
      productName: webusb.selected.productName,
    }) || 'Unknown';
    if (model !== 'Unknown') {
      appendLog(`Model: ${model} (from USB descriptor)`, 'ok');
    }
    setUsb(webusb);
    setDevice({
      brand: webusb.brand,
      model,
      firmware: '—',
      imei: '—',
      chipset: '—',
      android: '—',
      csc: null,
      uniqueNumber: null,
      source: 'webusb',
      usb: webusb,
      restricted: false,
      manual: false,
      manufacturerName: webusb.selected.manufacturerName || null,
      productName: webusb.selected.productName || null,
      serialNumber: webusb.selected.serialNumber || null,
    });
    setState(SCANNER_STATES.IDENTIFIED);
  }, [appendLog, markLast]);

  const startScan = useCallback(async () => {
    cancelledRef.current = false;
    setState(SCANNER_STATES.REQUESTING);
    setError(null);
    setLog([]);
    setUsb(null);

    /* WebSerial is the primary path (SamFw-style). On most Samsung
       devices exposing a CDC ACM / modem interface, this gives the
       user a single picker and we get VID/PID + AT responses in one
       shot. WebUSB runs in parallel as silent enrichment for
       previously-authorised devices, adding manufacturer / product /
       serial / interface classification without a second picker.
       If WebSerial is unavailable or the user cancels, we fall back
       to a WebUSB picker. */

    if (!isWebSerialSupported()) {
      appendLog('Web Serial not supported. Trying WebUSB...', 'pending');
      return runWebUsbFallback();
    }

    appendLog('Requesting serial port...', 'pending');
    let port;
    try {
      port = await openSerialPort({
        baudRate: SERIAL_BAUD,
        dataBits: SERIAL_DATA_BITS,
        parity: SERIAL_PARITY,
        stopBits: SERIAL_STOP_BITS,
      });
    } catch (e) {
      markLast('error');
      if (e?.name === 'NotFoundError') {
        appendLog('No serial port selected.', 'pending');
      } else {
        appendLog(`Serial error: ${e?.message || 'unknown'}.`, 'error');
      }
      if (cancelledRef.current) return;
      return runWebUsbFallback();
    }
    if (cancelledRef.current) {
      closeSerialPort(port);
      return;
    }
    portRef.current = port;
    markLast('ok');
    appendLog('Port connected', 'ok');

    const portInfo = getPortInfo(port);
    const usbLine = `USB: ${formatHex(portInfo.vendorId)} / ${formatHex(portInfo.productId)} — ${portInfo.brand}${portInfo.mode ? ` (${portInfo.mode})` : ''}`;
    appendLog(usbLine, portInfo.brand === 'Unknown' ? 'pending' : 'ok');

    /* Silent WebUSB enrichment — uses navigator.usb.getDevices()
       (no picker). Only fires if the user has previously authorised
       a device with the same VID/PID. Gives us manufacturer /
       product / serial / interface classification on top of the
       WebSerial data. */
    let webusb = null;
    if (portInfo.vendorId != null) {
      webusb = await getEnrichmentForPort(portInfo.vendorId, portInfo.productId);
      if (webusb) {
        const manu = webusb.selected.manufacturerName || '—';
        const prod = webusb.selected.productName || '—';
        appendLog(`Enriched: ${manu} / ${prod}`, 'ok');
        if (webusb.selected.serialNumber) {
          appendLog(`Serial: ${webusb.selected.serialNumber}`, 'ok');
        }
      }
    }

    if (cancelledRef.current) {
      closeSerialPort(port);
      portRef.current = null;
      return;
    }

    /* Build the unified USB data object — enriched WebUSB response
       if available, otherwise the bare WebSerial getInfo() shape
       with optimistic modem capability. */
    const usbData = webusb || {
      ...portInfo,
      selected: {
        vendorId: portInfo.vendorId,
        productId: portInfo.productId,
      },
      capabilities: { modem: true },
    };
    setUsb(usbData);
    setState(SCANNER_STATES.READING);

    /* AT IDENTIFICATION — best-effort. CME / CMS / PACM responses
       are EXPECTED on modern Samsung and are not treated as
       failures.

       The order matters. We try AT+DEVCONINFO first because it's
       a Samsung-proprietary command that returns model, CSC,
       firmware, IMEI, serial, and unique number in one response.
       Unlike the 3GPP standard commands (AT+CGMM, AT+CGMR,
       AT+CGSN), it isn't part of the carrier-locked 3GPP set, so
       it works on devices where the standard ones return CME
       errors. This is the same command samfw.com's web tool
       uses. If DEVCONINFO yields a model, we skip the standard
       commands entirely. */
    const collected = {
      model: null,
      firmware: null,
      imei: null,
      csc: null,
      uniqueNumber: null,
    };
    let anyResponse = false;
    let blocked = false;

    const runCommand = async (cmd) => {
      if (cancelledRef.current) return null;
      appendLog(cmd, 'pending');
      try {
        const lines = await sendAtCommand(port, cmd);
        if (cancelledRef.current) return null;
        const filtered = lines.filter((l) => l && l.toUpperCase() !== 'OK');
        const response = filtered[filtered.length - 1] || '';
        markLast('ok');
        if (response) {
          updateLastLog({ response });
        }
        return { lines, response };
      } catch (e) {
        updateLastLog({ status: 'error', response: e?.message || 'no response' });
        return null;
      }
    };

    await new Promise((r) => setTimeout(r, COMMAND_DELAY_MS));
    const r0 = await runCommand(AT_DEVCONINFO);
    if (r0) {
      anyResponse = true;
      const info = parseDevConInfo(r0.lines.join('\n'));
      console.log('[debug] DEVCONINFO raw lines:', r0.lines, 'parsed:', info);
      if (info) {
        if (info.MN) collected.model = info.MN;
        if (info.VER) collected.firmware = info.VER;
        if (info.IMEI) collected.imei = info.IMEI;
        if (info.PRD) collected.csc = info.PRD;
        if (info.UN) collected.uniqueNumber = info.UN;
      }
      if (!info && isCmeBlocked(r0.lines)) {
        blocked = true;
        console.log('[debug] DEVCONINFO blocked (no valid parse + CME errors):', r0.lines);
      }
    }

    /* Only run the 3GPP fallbacks if DEVCONINFO didn't give us
       anything useful (older devices, non-Samsung modems). */
    if (!collected.model) {
      await new Promise((r) => setTimeout(r, COMMAND_DELAY_MS));
      const r1 = await runCommand('AT+CGMM');
      if (r1) {
        anyResponse = true;
        if (isCmeBlocked(r1.lines)) { blocked = true; console.log('[debug] CGMM blocked:', r1.lines); }
        else if (r1.response) collected.model = r1.response;
      }
      console.log('[debug] CGMM result:', collected.model);
    }

    if (!collected.firmware) {
      await new Promise((r) => setTimeout(r, COMMAND_DELAY_MS));
      const r2 = await runCommand('AT+CGMR');
      if (r2) {
        anyResponse = true;
        if (isCmeBlocked(r2.lines)) { blocked = true; console.log('[debug] CGMR blocked:', r2.lines); }
        else if (r2.response) collected.firmware = r2.response;
      }
      console.log('[debug] CGMR result:', collected.firmware);
    }

    if (!collected.imei) {
      await new Promise((r) => setTimeout(r, COMMAND_DELAY_MS));
      const r3 = await runCommand('AT+CGSN');
      if (r3) {
        anyResponse = true;
        if (isCmeBlocked(r3.lines)) { blocked = true; console.log('[debug] CGSN blocked:', r3.lines); }
        else if (r3.response) collected.imei = r3.response;
      }
      console.log('[debug] CGSN result:', collected.imei);
    }

    if (cancelledRef.current) {
      closeSerialPort(port);
      portRef.current = null;
      return;
    }

    closeSerialPort(port);
    portRef.current = null;

    const hasUsb = usbData.brand && usbData.brand !== 'Unknown';
    const hasAtData = !!(collected.model || collected.firmware || collected.imei);
    const atCompletelySilent = !anyResponse && !blocked;

    console.log(
      '[debug] DECISION — collected:', collected,
      '| hasUsb:', hasUsb, '(brand:', usbData.brand, ')',
      '| hasAtData:', hasAtData,
      '| anyResponse:', anyResponse,
      '| blocked:', blocked,
    );

    if (hasAtData) {
      const result = {
        brand: collected.model ? extractBrand(collected.model) : (hasUsb ? usbData.brand : 'Unknown'),
        model: collected.model || 'Unknown',
        firmware: collected.firmware || '—',
        imei: collected.imei || '—',
        chipset: '—',
        android: '—',
        csc: collected.csc || null,
        uniqueNumber: collected.uniqueNumber || null,
        source: 'serial',
        usb: usbData,
        restricted: blocked,
        manufacturerName: webusb?.selected?.manufacturerName || null,
        productName: webusb?.selected?.productName || null,
        serialNumber: webusb?.selected?.serialNumber || null,
      };
      setDevice(result);
      setState(SCANNER_STATES.IDENTIFIED);
      return;
    }

    if (hasUsb) {
      console.log('[debug] USB fallback path — usbData.brand:', usbData.brand, 'webusb:', webusb);
      const model = extractModelHint({
        serial: webusb?.selected?.serialNumber,
        productName: webusb?.selected?.productName,
      }) || 'Unknown';
      console.log('[debug] USB fallback — extracted model:', model);

      if (blocked) {
        appendLog('AT commands restricted. Using USB-verified identification.', 'ok');
      } else if (atCompletelySilent) {
        appendLog('No AT response. Using USB-verified identification.', 'ok');
      }
      if (model !== 'Unknown') {
        appendLog(`Model: ${model} (from USB descriptor)`, 'ok');
      }

      setDevice({
        brand: usbData.brand,
        model,
        firmware: '—',
        imei: '—',
        chipset: '—',
        android: '—',
        csc: null,
        uniqueNumber: null,
        source: 'webusb',
        usb: usbData,
        restricted: false,
        manual: false,
        manufacturerName: webusb?.selected?.manufacturerName || null,
        productName: webusb?.selected?.productName || null,
        serialNumber: webusb?.selected?.serialNumber || null,
      });
      setState(SCANNER_STATES.IDENTIFIED);
      return;
    }

    setError('Device not recognised. Enter your model manually.');
    setState(SCANNER_STATES.ERROR);
  }, [appendLog, markLast, runWebUsbFallback, updateLastLog]);

  const selectIssue = useCallback(() => {
    setState(SCANNER_STATES.ISSUE_SELECTED);
  }, []);

  const setResults = useCallback(() => {
    setState(SCANNER_STATES.RESULTS);
  }, []);

  const setManualEntry = useCallback(() => {
    setState(SCANNER_STATES.MANUAL_ENTRY);
  }, []);

  const setManualDevice = useCallback((payload) => {
    setDevice({ ...payload, source: payload.source || 'manual', usb: payload.usb || usb });
    setState(SCANNER_STATES.IDENTIFIED);
  }, [usb]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (portRef.current) {
        closeSerialPort(portRef.current);
        portRef.current = null;
      }
    };
  }, []);

  return {
    state,
    device,
    usb,
    error,
    log,
    startScan,
    reset,
    selectIssue,
    setResults,
    setManualEntry,
    setManualDevice,
    supported: isWebSerialSupported(),
  };
}

function extractBrand(model) {
  if (!model) return 'Unknown';
  const m = String(model).toUpperCase();
  if (m.startsWith('SM-') || m.startsWith('GT-')) return 'Samsung';
  if (m.startsWith('IPH')) return 'Apple';
  if (m.startsWith('REDMI') || m.startsWith('MI ')) return 'Xiaomi';
  if (m.startsWith('TECNO')) return 'Tecno';
  if (m.startsWith('INFINIX')) return 'Infinix';
  if (m.startsWith('ITEL')) return 'Itel';
  if (m.startsWith('NOKIA')) return 'Nokia';
  if (m.startsWith('HUAWEI') || m.startsWith('ANE-')) return 'Huawei';
  if (m.startsWith('OPPO')) return 'Oppo';
  if (m.startsWith('VIVO')) return 'Vivo';
  if (m.startsWith('REALME')) return 'Realme';
  if (m.startsWith('MOTO')) return 'Motorola';
  if (m.startsWith('PIXEL') || m.startsWith('GP4BC')) return 'Google';
  return 'Unknown';
}
