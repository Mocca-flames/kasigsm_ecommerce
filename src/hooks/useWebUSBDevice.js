import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDeviceResponse,
  defaultFilters,
  detectBrowser,
  filterForDevice,
  normaliseError,
} from '../lib/usbUtils';

/* ============================================================
   useWebUSBDevice
   ------------------------------------------------------------
   React hook wrapping the WebUSB device enumeration pipeline.
   The state machine is intentionally separate from
   useDeviceSerial — this hook is the *transport* layer, the
   serial hook is the *legacy AT* layer. Consumers can compose
   them.

   State machine:
     IDLE          — nothing connected, no permission
     REQUESTING    — picker is open (user gesture required)
     ENUMERATING   — device open, descriptors being read
     CONNECTED     — structured response available
     DISCONNECTED  — device unplugged, awaiting reconnect
     ERROR         — non-retryable failure (e.g. insecure origin)

   Public surface:
     { state, response, error, browser, isSupported,
       previouslyAuthorised, requestDevice, forgetDevice,
       requestPermissionFor, reset, reconnect }
   ============================================================ */

export const USB_STATES = {
  IDLE: 'IDLE',
  REQUESTING: 'REQUESTING',
  ENUMERATING: 'ENUMERATING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
};

export function useWebUSBDevice(options = {}) {
  const { autoReconnect = true, requestOnMount = false } = options;

  const [state, setState] = useState(USB_STATES.IDLE);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [previouslyAuthorised, setPreviouslyAuthorised] = useState([]);

  /* Refs to the live USB device and any claimed interfaces.
     They survive re-renders and are read by the cleanup effect. */
  const deviceRef = useRef(null);
  const claimedInterfacesRef = useRef([]);
  const cancelledRef = useRef(false);
  const isSupported = typeof navigator !== 'undefined' && !!navigator.usb;
  const browser = useMemo(
    () => (typeof navigator !== 'undefined'
      ? detectBrowser()
      : { name: 'unknown', supportsWebUSB: false, isSecureContext: false }),
    []
  );

  /* ---- internal helpers ------------------------------------- */

  const setSafeState = useCallback((next) => {
    if (!cancelledRef.current) setState(next);
  }, []);

  const clearDevice = useCallback(async () => {
    /* Release any claimed interfaces, then close the device. */
    const dev = deviceRef.current;
    const claimed = claimedInterfacesRef.current;
    if (dev) {
      for (const n of claimed) {
        try { await dev.releaseInterface(n); } catch { /* device may already be gone */ }
      }
      claimedInterfacesRef.current = [];
      try {
        if (dev.opened) await dev.close();
      } catch { /* noop */ }
    }
    deviceRef.current = null;
  }, []);

  const handleDisconnect = useCallback(async (event) => {
    if (deviceRef.current && event?.device && event.device === deviceRef.current) {
      await clearDevice();
      setSafeState(USB_STATES.DISCONNECTED);
      setError({ code: 'disconnected', name: 'DisconnectEvent', message: 'USB device disconnected', retryable: true, userMessage: 'The device was unplugged.' });
    }
  }, [clearDevice, setSafeState]);

  const attachDeviceListeners = useCallback((dev) => {
    if (!dev || typeof dev.addEventListener !== 'function') return;
    dev.addEventListener('disconnect', handleDisconnect);
  }, [handleDisconnect]);

  const detachDeviceListeners = useCallback((dev) => {
    if (!dev || typeof dev.removeEventListener !== 'function') return;
    dev.removeEventListener('disconnect', handleDisconnect);
  }, [handleDisconnect]);

  /* ---- public API ------------------------------------------- */

  const refreshAuthorised = useCallback(async () => {
    if (!isSupported) return [];
    try {
      const list = await navigator.usb.getDevices();
      const mapped = list.map((d) => ({
        vendorId: d.vendorId,
        productId: d.productId,
        productName: d.productName || null,
        manufacturerName: d.manufacturerName || null,
        serialNumber: d.serialNumber || null,
      }));
      setPreviouslyAuthorised(mapped);
      return mapped;
    } catch {
      return [];
    }
  }, [isSupported]);

  const enumerate = useCallback(async (device) => {
    if (!device) return null;
    setSafeState(USB_STATES.ENUMERATING);
    try {
      if (!device.opened) await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
    } catch (e) {
      const err = normaliseError(e);
      setError(err);
      setSafeState(USB_STATES.ERROR);
      return null;
    }

    deviceRef.current = device;
    attachDeviceListeners(device);

    const built = buildDeviceResponse({
      device,
      browser,
      secureContext: browser.isSecureContext,
    });
    setResponse(built);
    setSafeState(USB_STATES.CONNECTED);
    refreshAuthorised();
    return built;
  }, [attachDeviceListeners, browser, refreshAuthorised, setSafeState]);

  const requestDevice = useCallback(async (filters) => {
    if (!isSupported) {
      const synthetic = { name: 'TypeError', message: 'WebUSB not available' };
      const err = normaliseError(synthetic);
      setError(err);
      setSafeState(USB_STATES.ERROR);
      return null;
    }
    if (!browser.isSecureContext) {
      const err = normaliseError({ name: 'SecurityError', message: 'Insecure origin' });
      setError(err);
      setSafeState(USB_STATES.ERROR);
      return null;
    }

    cancelledRef.current = false;
    setError(null);
    setResponse(null);
    setSafeState(USB_STATES.REQUESTING);

    let device;
    try {
      device = await navigator.usb.requestDevice({
        filters: filters && filters.length ? filters : defaultFilters(),
      });
    } catch (e) {
      const err = normaliseError(e);
      setError(err);
      setSafeState(err.code === 'cancelled' ? USB_STATES.IDLE : USB_STATES.ERROR);
      return null;
    }
    if (cancelledRef.current || !device) {
      return null;
    }

    return enumerate(device);
  }, [browser.isSecureContext, enumerate, isSupported, setSafeState]);

  const requestPermissionFor = useCallback(async (vendorId, productId) => {
    if (!isSupported) return false;
    const filters = filterForDevice(vendorId, productId);
    try {
      const device = await navigator.usb.requestDevice({ filters });
      if (device) {
        await enumerate(device);
        return true;
      }
      return false;
    } catch (e) {
      const err = normaliseError(e);
      setError(err);
      setSafeState(err.code === 'cancelled' ? USB_STATES.IDLE : USB_STATES.ERROR);
      return false;
    }
  }, [enumerate, isSupported, setSafeState]);

  const forgetDevice = useCallback(async (vendorId, productId, serialNumber) => {
    if (!isSupported) return;
    try {
      const list = await navigator.usb.getDevices();
      for (const d of list) {
        if (
          d.vendorId === vendorId &&
          d.productId === productId &&
          (!serialNumber || d.serialNumber === serialNumber)
        ) {
          try { await d.forget(); } catch { /* some browsers don't implement forget() */ }
        }
      }
    } catch { /* noop */ }
    refreshAuthorised();
  }, [isSupported, refreshAuthorised]);

  const reset = useCallback(async () => {
    cancelledRef.current = true;
    await clearDevice();
    setResponse(null);
    setError(null);
    setSafeState(USB_STATES.IDLE);
  }, [clearDevice, setSafeState]);

  /* Reconnect: try to re-open the last device object if it was
     just unplugged. We can call open() again — WebUSB throws
     NetworkError if it isn't physically attached, which we map
     to the DISCONNECTED state. */
  const reconnect = useCallback(async () => {
    if (!isSupported) return null;
    const list = await navigator.usb.getDevices();
    if (!list.length) return null;
    return enumerate(list[0]);
  }, [enumerate, isSupported]);

  /* ---- side effects ----------------------------------------- */

  /* Initial authorised-device inventory. The setState inside
     refreshAuthorised happens after the async getDevices() resolves,
     which is the recommended pattern for syncing with the external
     USB bus. */
  useEffect(() => {
    if (!isSupported) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAuthorised();
    const onConnect = () => refreshAuthorised();
    navigator.usb.addEventListener?.('connect', onConnect);
    navigator.usb.addEventListener?.('disconnect', onConnect);
    return () => {
      navigator.usb.removeEventListener?.('connect', onConnect);
      navigator.usb.removeEventListener?.('disconnect', onConnect);
    };
  }, [isSupported, refreshAuthorised]);

  /* Optional auto-pick on mount. Must still be a user gesture to
     pass most browsers, so this is opt-in. */
  useEffect(() => {
    if (requestOnMount && isSupported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestDevice();
    }
  }, [isSupported, requestOnMount, requestDevice]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (deviceRef.current) {
        detachDeviceListeners(deviceRef.current);
      }
      clearDevice();
    };
  }, [clearDevice, detachDeviceListeners]);

  /* While DISCONNECTED, retry open() periodically. We only do
     this for the most recently seen device — we can't enumerate
     the bus without a user gesture in WebUSB. */
  useEffect(() => {
    if (!autoReconnect) return undefined;
    if (state !== USB_STATES.DISCONNECTED) return undefined;
    let cancelled = false;
    let delay = 1500;
    const tick = async () => {
      if (cancelled) return;
      const list = await navigator.usb.getDevices();
      const target = list[0];
      if (!target) {
        const t = setTimeout(tick, delay);
        delay = Math.min(delay * 1.4, 10000);
        return () => clearTimeout(t);
      }
      try {
        if (!target.opened) await target.open();
        if (target.configuration === null) await target.selectConfiguration(1);
        deviceRef.current = target;
        attachDeviceListeners(target);
        const built = buildDeviceResponse({
          device: target,
          rawDevice: target,
          browser,
          secureContext: browser.isSecureContext,
        });
        setResponse(built);
        setError(null);
        setSafeState(USB_STATES.CONNECTED);
      } catch {
        const t = setTimeout(tick, delay);
        delay = Math.min(delay * 1.4, 10000);
        return () => clearTimeout(t);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [autoReconnect, state, attachDeviceListeners, browser, setSafeState]);

  return {
    state,
    response,
    error,
    browser,
    isSupported,
    previouslyAuthorised,
    requestDevice,
    requestPermissionFor,
    forgetDevice,
    refreshAuthorised,
    reconnect,
    reset,
  };
}
