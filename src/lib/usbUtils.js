/* ============================================================
   USB UTILITIES — WebUSB device enumeration helpers
   Pure functions, no React, no DOM. Used by useWebUSBDevice.
   ============================================================

   The "transport intelligence layer" of the scanner. WebUSB
   gives us direct access to descriptors, so we can identify
   every function a Samsung/Android composite device exposes
   (ADB, MTP, CDC modem, etc.) without sending a single AT
   command. AT probing is no longer the source of truth — the
   USB descriptor tree is.

   The structured response shape lives in buildDeviceResponse().
*/

export const USB_CLASS = {
  PER_INTERFACE: 0x00,
  AUDIO: 0x01,
  CDC_CONTROL: 0x02,
  HID: 0x03,
  PHYSICAL: 0x05,
  IMAGE: 0x06,            // MTP / PTP
  PRINTER: 0x07,
  MASS_STORAGE: 0x08,
  HUB: 0x09,
  CDC_DATA: 0x0A,
  SMART_CARD: 0x0B,
  CONTENT_SECURITY: 0x0D,
  VIDEO: 0x0E,
  PERSONAL_HEALTHCARE: 0x0F,
  AUDIO_VIDEO: 0x10,
  BILLBOARD: 0x11,
  DIAGNOSTIC: 0xDC,
  WIRELESS: 0xE0,
  MISCELLANEOUS: 0xEF,
  APPLICATION_SPECIFIC: 0xFE,
  VENDOR_SPECIFIC: 0xFF,
};

/* Endpoint direction bit (bmAttributes). */
const ENDPOINT_DIR_IN = 0x80;
export const ENDPOINT_TYPE = {
  CONTROL: 0,
  ISOCHRONOUS: 1,
  BULK: 2,
  INTERRUPT: 3,
};

/* ---- Vendor IDs ------------------------------------------------- */

export const KNOWN_VENDORS = {
  0x04E8: 'Samsung',
  0x05AC: 'Apple',
  0x18D1: 'Google',
  0x2717: 'Xiaomi',
  0x12D1: 'Huawei',
  0x22D9: 'Oppo',
  0x2A95: 'OnePlus',
  0x2A96: 'OnePlus',
  0x2C7C: 'Vivo',
  0x1EBF: 'Motorola',
  0x0BB4: 'HTC',
  0x1004: 'LG',
  0x0FCE: 'Sony',
  0x2207: 'Realme',
  0x2006: 'Tecno',
  0x2C7F: 'Infinix',
  0x1F53: 'Itel',
  0x0421: 'Nokia',
  0x0B05: 'Asus',
  0x0502: 'Acer',
  0x17EF: 'Lenovo',
  0x19D2: 'ZTE',
  0x1BBB: 'Alcatel',
  0x05C6: 'Qualcomm',
  0x0E8D: 'MediaTek',
  0x1782: 'Unisoc',
  0x1A86: 'Qin',
  0x1949: 'Amazon',
  0x0955: 'NVIDIA',
};

/* ---- Product IDs ------------------------------------------------
   These are the modes a phone exposes based on its current USB
   configuration. Modern Android can switch between them via the
   "USB configuration" notification.
   ----------------------------------------------------------------- */

export const KNOWN_PRODUCTS = {
  0x04E8: {
    0x685B: 'Samsung Download (Odin/Galaxy Odin)',
    0x685C: 'Samsung Modem Interface',
    0x685D: 'Samsung Modem Interface',
    0x685E: 'Samsung Modem Interface',
    0x6860: 'Samsung Android (MTP + ADB + UMS)',
    0x6863: 'Samsung Android (MTP)',
    0x6864: 'Samsung Android (ADB)',
    0x6865: 'Samsung Android (MTP + ADB + UMS)',
    0x6866: 'Samsung Android (PTP)',
    0x6877: 'Samsung Android (MTP + ADB)',
    0x68C9: 'Samsung Galaxy (ADB)',
    0x6862: 'Samsung Android (MTP + ADB)',
  },
  0x05AC: {
    0x12A8: 'Apple iPhone (Recovery)',
    0x1281: 'Apple iPhone (DFU)',
    0x12A0: 'Apple iPhone (MTP)',
    0x12A4: 'Apple iPhone (PTP)',
    0x12AB: 'Apple Watch (DFU)',
  },
  0x18D1: {
    0x4EE1: 'Google Fastboot',
    0x4EE2: 'Google Fastboot (Bootloader)',
    0x4EE4: 'Google Pixel (MTP)',
    0x4EE7: 'Google Pixel (MTP + ADB)',
    0x4EE8: 'Google Pixel (ADB only)',
    0x4EE9: 'Google Pixel (PTP)',
    0x4EEA: 'Google Pixel (PTP + ADB)',
  },
  0x2717: {
    0xFF08: 'Xiaomi Fastboot',
    0xFF10: 'Xiaomi Android (MTP)',
    0xFF18: 'Xiaomi Recovery',
    0xFF20: 'Xiaomi Android (MTP + ADB)',
    0xFF28: 'Xiaomi Android (ADB)',
  },
  0x12D1: {
    0x1037: 'Huawei Android (MTP + ADB)',
    0x1038: 'Huawei Android (MTP)',
    0x1039: 'Huawei Android (ADB)',
    0x1050: 'Huawei Android (PTP)',
    0x1057: 'Huawei HiSuite',
    0x3609: 'Huawei Modem',
  },
};

/* ---- Interface kind classifier --------------------------------
   Given an interface descriptor, return a structured "kind".
   This is the key bit — it tells the rest of the app what
   protocols this interface speaks.

   ADB identification rules (from Google's Android USB docs):
   - ADB function: bInterfaceClass=0xFF, bInterfaceSubClass=0x42,
                   bInterfaceProtocol=0x01 ("Android Debug Bridge")
                   (also seen as bInterfaceClass=0xFF, bInterfaceSubClass=0x42,
                    bInterfaceProtocol=0x02 on some Samsung units)
   - Fastboot (bootloader): bInterfaceClass=0xFF, bInterfaceSubClass=0x42,
                            bInterfaceProtocol=0x03
   - MTP:           bInterfaceClass=0x06, bInterfaceSubClass=0x01,
                    bInterfaceProtocol=0x01
   - PTP:           bInterfaceClass=0x06, bInterfaceSubClass=0x01,
                    bInterfaceProtocol=0x02
   - CDC ACM modem: bInterfaceClass=0x02 (control) + 0x0A (data) pair
                    subclass 0x02, protocol 0x01
   - Mass Storage:  0x08
   - ADB V2 (mtp+adb): composite, ADB appears as a separate interface
                       with class 0xFF/0x42/0x01.

   WebUSB cannot *talk* to most of these from the browser
   (claiming is OS-restricted), but it can *identify* them
   purely from descriptors — which is what we need.
   ----------------------------------------------------------------- */

const ADB_PROTOCOL = 0x01;
const ADB_FASTBOOT_PROTOCOL = 0x03;
const ADB_SUBCLASS = 0x42;

export function classifyInterface(iface) {
  if (!iface) {
    return { kind: 'unknown', label: 'Unknown', adb: false, isComms: false, canClaim: false };
  }
  const cls = iface.interfaceClass;
  const sub = iface.interfaceSubclass;
  const proto = iface.interfaceProtocol;

  if (cls === USB_CLASS.VENDOR_SPECIFIC && sub === ADB_SUBCLASS && proto === ADB_FASTBOOT_PROTOCOL) {
    return {
      kind: 'fastboot',
      label: 'Android Fastboot',
      adb: false,
      isComms: false,
      canClaim: false,
      group: 'android',
    };
  }
  if (cls === USB_CLASS.VENDOR_SPECIFIC && sub === ADB_SUBCLASS && (proto === ADB_PROTOCOL || proto === 0x02)) {
    return {
      kind: 'adb',
      label: proto === 0x02 ? 'Android ADB (Samsung)' : 'Android ADB',
      adb: true,
      isComms: false,
      canClaim: false,
      group: 'android',
    };
  }
  if (cls === USB_CLASS.IMAGE && sub === 0x01 && proto === 0x01) {
    return { kind: 'mtp', label: 'MTP (Media Transfer)', adb: false, isComms: false, canClaim: false, group: 'media' };
  }
  if (cls === USB_CLASS.IMAGE && sub === 0x01 && proto === 0x02) {
    return { kind: 'ptp', label: 'PTP (Picture Transfer)', adb: false, isComms: false, canClaim: false, group: 'media' };
  }
  if (cls === USB_CLASS.CDC_CONTROL && sub === 0x02 && proto === 0x01) {
    return { kind: 'cdc-acm-control', label: 'CDC ACM (Modem Control)', adb: false, isComms: true, canClaim: false, group: 'modem' };
  }
  if (cls === USB_CLASS.CDC_DATA) {
    return { kind: 'cdc-acm-data', label: 'CDC ACM (Modem Data)', adb: false, isComms: true, canClaim: false, group: 'modem' };
  }
  if (cls === USB_CLASS.MASS_STORAGE) {
    return { kind: 'mass-storage', label: 'Mass Storage (UMS)', adb: false, isComms: false, canClaim: false, group: 'media' };
  }
  if (cls === USB_CLASS.AUDIO) {
    return { kind: 'audio', label: 'Audio', adb: false, isComms: false, canClaim: false, group: 'audio', protected: true };
  }
  if (cls === USB_CLASS.HID) {
    return { kind: 'hid', label: 'Human Interface Device', adb: false, isComms: false, canClaim: false, group: 'hid', protected: true };
  }
  if (cls === USB_CLASS.HUB) {
    return { kind: 'hub', label: 'USB Hub', adb: false, isComms: false, canClaim: false, group: 'hub', protected: true };
  }
  if (cls === USB_CLASS.VENDOR_SPECIFIC) {
    return { kind: 'vendor', label: 'Vendor-Specific', adb: false, isComms: false, canClaim: false, group: 'vendor' };
  }
  return { kind: 'other', label: `Class 0x${(cls ?? 0).toString(16).padStart(2, '0')}`, adb: false, isComms: false, canClaim: false, group: 'other' };
}

/* Summary: collapse an interface list into a single "capability" flag set. */
export function summarizeCapabilities(interfaces) {
  const caps = {
    adb: false,
    fastboot: false,
    mtp: false,
    ptp: false,
    modem: false,
    massStorage: false,
    interfaceCount: interfaces.length,
  };
  for (const i of interfaces) {
    if (i.kind === 'adb') caps.adb = true;
    if (i.kind === 'fastboot') caps.fastboot = true;
    if (i.kind === 'mtp') caps.mtp = true;
    if (i.kind === 'ptp') caps.ptp = true;
    if (i.kind === 'cdc-acm-control' || i.kind === 'cdc-acm-data') caps.modem = true;
    if (i.kind === 'mass-storage') caps.massStorage = true;
  }
  return caps;
}

/* ---- Endpoint extraction ------------------------------------- */

export function describeEndpoint(ep) {
  if (!ep) return null;
  const type = ENDPOINT_TYPE[ep.type] || 'unknown';
  const direction = (ep.direction & ENDPOINT_DIR_IN) ? 'in' : 'out';
  return {
    number: ep.endpointNumber,
    address: `0x${ep.endpointNumber.toString(16).toUpperCase().padStart(2, '0')}${direction === 'in' ? 'IN' : 'OUT'}`,
    direction,
    type,
    packetSize: ep.packetSize,
  };
}

export function describeInterface(iface) {
  if (!iface) return null;
  const classification = classifyInterface(iface);
  const endpoints = [];
  if (iface.alternate) {
    for (const ep of iface.alternate.endpoints || []) {
      endpoints.push(describeEndpoint(ep));
    }
  }
  return {
    interfaceNumber: iface.interfaceNumber,
    alternate: iface.alternate?.alternateSetting ?? 0,
    interfaceClass: iface.interfaceClass,
    interfaceSubclass: iface.interfaceSubclass,
    interfaceProtocol: iface.interfaceProtocol,
    className: classification.label,
    kind: classification.kind,
    group: classification.group,
    adb: classification.adb,
    isComms: classification.isComms,
    endpoints,
  };
}

/* ---- Device description (the structured response) ------------
   Shape:
   {
     transport: 'webusb',
     browser: { name, version },
     secureContext: boolean,
     selected: { ... },       // the device the user picked
     interfaces: [ ... ],     // every interface, classified
     capabilities: { ... },   // adb, mtp, modem, etc.
     brand: 'Samsung',
     mode: 'Samsung Android (MTP + ADB)',
     error: null,
   }
   ----------------------------------------------------------- */

export function buildDeviceResponse({
  device,
  browser,
  secureContext,
  error = null,
}) {
  if (!device || error) {
    return {
      transport: 'webusb',
      browser,
      secureContext,
      selected: null,
      interfaces: [],
      capabilities: {
        adb: false, fastboot: false, mtp: false, ptp: false,
        modem: false, massStorage: false, interfaceCount: 0,
      },
      brand: 'Unknown',
      mode: null,
      error,
    };
  }

  const vid = device.vendorId;
  const pid = device.productId;
  const brand = KNOWN_VENDORS[vid] || 'Unknown';
  const mode = KNOWN_PRODUCTS[vid]?.[pid] || null;

  const interfaces = (device.configuration?.interfaces || []).map(describeInterface);
  const capabilities = summarizeCapabilities(interfaces);

  return {
    transport: 'webusb',
    browser,
    secureContext,
    selected: {
      vendorId: vid,
      productId: pid,
      vendorHex: formatHex(vid),
      productHex: formatHex(pid),
      manufacturerName: device.manufacturerName || null,
      productName: device.productName || null,
      serialNumber: device.serialNumber || null,
      deviceVersion: device.deviceVersion ?? null,
      usbVersionMajor: device.usbVersionMajor ?? null,
      usbVersionMinor: device.usbVersionMinor ?? null,
      usbVersionSubminor: device.usbVersionSubminor ?? null,
      deviceClass: device.deviceClass ?? null,
      deviceSubclass: device.deviceSubclass ?? null,
      deviceProtocol: device.deviceProtocol ?? null,
      configurationValue: device.configuration?.configurationValue ?? null,
      maxPower: device.configuration?.maxPower ?? null,
      remoteWakeup: device.configuration?.remoteWakeup ?? null,
      selfPowered: device.configuration?.selfPowered ?? null,
    },
    interfaces,
    capabilities,
    brand,
    mode,
    error: null,
  };
}

/* ---- Formatters ---------------------------------------------- */

export function formatHex(n) {
  if (n == null) return '—';
  return `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function formatBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/* ---- Browser detection --------------------------------------- */

export function detectBrowser() {
  if (typeof navigator === 'undefined') {
    return { name: 'unknown', version: null, supportsWebUSB: false, isSecureContext: false };
  }
  const ua = navigator.userAgent || '';
  let name = 'Unknown';
  let version = null;
  if (/Edg\//.test(ua)) { name = 'Edge'; version = ua.match(/Edg\/([\d.]+)/)?.[1] ?? null; }
  else if (/OPR\//.test(ua)) { name = 'Opera'; version = ua.match(/OPR\/([\d.]+)/)?.[1] ?? null; }
  else if (/Chrome\//.test(ua)) { name = 'Chrome'; version = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? null; }
  else if (/Firefox\//.test(ua)) { name = 'Firefox'; version = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? null; }
  else if (/Safari\//.test(ua)) { name = 'Safari'; version = ua.match(/Version\/([\d.]+)/)?.[1] ?? null; }

  const supportsWebUSB = typeof navigator.usb !== 'undefined';
  const isSecureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
  return { name, version, supportsWebUSB, isSecureContext };
}

/* ---- Error normalisation -------------------------------------
   WebUSB errors are DOMException subclasses. We wrap them in
   a small object so React can render them sensibly.
   ----------------------------------------------------------- */

export function normaliseError(e) {
  if (!e) return { code: 'unknown', message: 'Unknown error', retryable: true };
  const name = e.name || 'Error';
  const codeMap = {
    NotFoundError:    { code: 'cancelled',       retryable: true,  userMessage: 'Device picker was closed without a selection.' },
    SecurityError:    { code: 'insecure_origin', retryable: false, userMessage: 'WebUSB requires a secure context (HTTPS or localhost).' },
    NotAllowedError:  { code: 'permission_denied', retryable: true, userMessage: 'Permission to access the USB device was denied.' },
    InvalidStateError:{ code: 'busy',            retryable: true,  userMessage: 'The device is already open in another tab or app.' },
    NetworkError:     { code: 'disconnected',    retryable: true,  userMessage: 'The device disconnected before the operation completed.' },
    TypeError:        { code: 'unsupported',     retryable: false, userMessage: 'This browser does not support WebUSB.' },
    AbortError:       { code: 'aborted',         retryable: true,  userMessage: 'The request was cancelled.' },
  };
  const meta = codeMap[name] || { code: 'unknown', retryable: true, userMessage: e.message || name };
  return { code: meta.code, name, message: e.message || name, retryable: meta.retryable, userMessage: meta.userMessage };
}

/* ---- Build WebUSB filter list --------------------------------
   The scanner should be permissive on first run (show all phones
   + modems + ADB) and let the user choose. Subsequent runs can
   use a saved VID/PID for a tighter filter.
   ----------------------------------------------------------- */

export function defaultFilters() {
  const phoneVids = [
    0x04E8, 0x05AC, 0x18D1, 0x2717, 0x12D1, 0x22D9, 0x2A95,
    0x2A96, 0x2C7C, 0x1EBF, 0x0BB4, 0x1004, 0x0FCE, 0x2207,
    0x2006, 0x2C7F, 0x1F53, 0x0421, 0x0B05, 0x0502, 0x17EF,
    0x19D2, 0x1BBB, 0x0BB4, 0x1949, 0x0955,
  ];
  return phoneVids.map((vid) => ({ vendorId: vid }));
}

export function filterForDevice(vendorId, productId) {
  if (vendorId == null) return [];
  const f = { vendorId };
  if (productId != null) f.productId = productId;
  return [f];
}

/* ---- getEnrichmentForPort -------------------------------------
   Silent WebUSB enrichment for a device the user has already
   authorised via WebSerial. Walks navigator.usb.getDevices()
   (no picker) and, if a matching VID/PID is found, opens it,
   reads the descriptor tree, and returns the structured
   response. The handle is closed before returning. Returns
   null if WebUSB is unavailable, the device isn't in the
   authorised list, or anything throws.

   This is what gives us manufacturer / product / serial /
   interface classification without showing a second picker.
   ----------------------------------------------------------- */

export async function getEnrichmentForPort(vendorId, productId) {
  if (typeof navigator === 'undefined' || !navigator.usb) return null;
  if (vendorId == null || productId == null) return null;

  let device = null;
  try {
    const known = await navigator.usb.getDevices();
    device = known.find((d) => d.vendorId === vendorId && d.productId === productId);
    if (!device) return null;

    if (!device.opened) await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    const browser = detectBrowser();
    const response = buildDeviceResponse({
      device,
      browser,
      secureContext: window.isSecureContext,
    });
    return response;
  } catch {
    return null;
  } finally {
    if (device && device.opened) {
      try { await device.close(); } catch { /* noop */ }
    }
  }
}

/* ---- runWebUsbPreScan ----------------------------------------
   The single integration point the scanner needs. Opens the
   WebUSB picker, reads the descriptor tree (VID/PID/manufacturer/
   product/serial/all interfaces), and returns a structured
   response. The device handle is closed before returning — we
   only needed the descriptors.

   Result shape:
     { ok: true,  response }                     on success
     { ok: false, code, reason, name? }          on cancel/error

   Codes: 'unsupported' | 'insecure_origin' | 'cancelled' |
          'permission_denied' | 'busy' | 'disconnected' |
          'aborted' | 'unknown'

   This is the function the rest of the scanner calls. It
   intentionally returns a plain object (not the long-lived
   `useWebUSBDevice` hook) so it composes cleanly with the
   existing WebSerial flow — the hook just adds lifecycle
   machinery that opportunistic pre-scans don't need.
   ----------------------------------------------------------- */

export async function runWebUsbPreScan(options = {}) {
  if (typeof navigator === 'undefined' || !navigator.usb) {
    return { ok: false, code: 'unsupported', reason: 'WebUSB not available in this browser' };
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return { ok: false, code: 'insecure_origin', reason: 'WebUSB requires a secure context (HTTPS or localhost)' };
  }

  let device = null;
  try {
    device = await navigator.usb.requestDevice({
      filters: options.filters && options.filters.length ? options.filters : defaultFilters(),
    });
    if (!device.opened) await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    const browser = detectBrowser();
    const response = buildDeviceResponse({
      device,
      browser,
      secureContext: window.isSecureContext,
    });
    return { ok: true, response };
  } catch (e) {
    const err = normaliseError(e);
    return { ok: false, code: err.code, reason: err.userMessage, name: err.name };
  } finally {
    if (device) {
      try { if (device.opened) await device.close(); } catch { /* noop */ }
    }
  }
}
