/* ============================================================
   SERIAL UTILITIES
   Helpers for the Web Serial API. Pure functions, no React.
   ============================================================ */

const DEFAULT_TIMEOUT_MS = 3000;
const NEWLINE = '\r\n';

/* USB Vendor IDs — the foundation of browser-side detection.
   These come from the public USB-IF database and are stable. */
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
  0x1A86: 'Qin',
  0x05C6: 'Qualcomm',
  0x0E8D: 'MediaTek',
  0x1782: 'Unisoc',
  0x2C7F: 'Infinix',
  0x1F53: 'Itel',
  0x0421: 'Nokia',
  0x13D3: 'Acer',
  0x0B05: 'Asus',
  0x0955: 'NVIDIA',
  0x1949: 'Amazon',
};

/* USB Product IDs — reveal the USB mode the device is exposing.
   Modern Samsung/Android devices expose different PIDs for each
   USB configuration (MTP, ADB, MTP+ADB, download mode, modem, etc.). */
export const KNOWN_PRODUCTS = {
  0x04E8: {
    0x685B: 'Samsung Download Mode (Odin)',
    0x685C: 'Samsung Modem Interface',
    0x685D: 'Samsung Modem Interface',
    0x685E: 'Samsung Modem Interface',
    0x6860: 'Samsung Android (MTP+ADB composite)',
    0x6863: 'Samsung Android (MTP)',
    0x6864: 'Samsung Android (ADB)',
    0x6866: 'Samsung Android (PTP)',
    0x6877: 'Samsung Android (MTP+ADB)',
    0x68C9: 'Samsung Galaxy (ADB)',
  },
  0x05AC: {
    0x12A8: 'Apple iPhone (Recovery)',
    0x1281: 'Apple iPhone (DFU)',
    0x12A0: 'Apple iPhone (MTP)',
  },
  0x18D1: {
    0x4EE1: 'Google Fastboot',
    0x4EE7: 'Google Pixel (MTP+ADB)',
    0x4EE8: 'Google Pixel (ADB)',
  },
  0x2717: {
    0xFF08: 'Xiaomi Fastboot',
    0xFF18: 'Xiaomi Recovery',
  },
};

export function identifyVendor(vid) {
  if (vid == null) return 'Unknown';
  return KNOWN_VENDORS[vid] || 'Unknown';
}

export function identifyProduct(vid, pid) {
  if (vid == null || pid == null) return null;
  const map = KNOWN_PRODUCTS[vid];
  if (!map) return null;
  return map[pid] || null;
}

export function getPortInfo(port) {
  if (!port || typeof port.getInfo !== 'function') {
    return { vendorId: null, productId: null, brand: 'Unknown', mode: null };
  }
  try {
    const info = port.getInfo();
    const vendorId = info.usbVendorId ?? null;
    const productId = info.usbProductId ?? null;
    return {
      vendorId,
      productId,
      brand: identifyVendor(vendorId),
      mode: identifyProduct(vendorId, productId),
    };
  } catch {
    return { vendorId: null, productId: null, brand: 'Unknown', mode: null };
  }
}

export function formatHex(n) {
  if (n == null) return '—';
  return `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
}

/* CME / CMS error detection.
   Modern Samsung firmware blocks AT commands with errors like:
     +CME ERROR: PACM(AP),NOT_ALLOWED_CARRIER
     +CMS ERROR: 515
   These are NOT failures — they just mean the modem interface
   is locked down. USB identification still succeeded. */
export function isCMERestricted(text) {
  if (!text) return false;
  const t = String(text).toUpperCase();
  return (
    t.includes('PACM') ||
    t.includes('NOT_ALLOWED') ||
    t.includes('OPERATION_NOT_ALLOWED') ||
    t.includes('+CME ERROR') ||
    t.includes('+CMS ERROR') ||
    t === 'ERROR' ||
    t.includes('SIM NOT INSERTED') ||
    t.includes('SIM PIN REQUIRED') ||
    t.includes('SIM FAILURE')
  );
}

export function isCmeBlocked(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return false;
  return lines.some(isCMERestricted);
}

const stripPrompt = (line) =>
  line
    .replace(/^OK[\r\n]+/i, '')
    .replace(/^ERROR[\r\n]+/i, '')
    .replace(/[\r\n]+$/g, '')
    .trim();

export async function openSerialPort(options = {}) {
  if (typeof navigator === 'undefined' || !navigator.serial) {
    throw new Error('Web Serial API not available in this browser');
  }
  const port = await navigator.serial.requestPort();
  await port.open({
    baudRate: options.baudRate ?? 115200,
    dataBits: options.dataBits ?? 8,
    parity: options.parity ?? 'none',
    stopBits: options.stopBits ?? 1,
    flowControl: options.flowControl ?? 'none',
  });
  return port;
}

export async function closeSerialPort(port) {
  if (!port) return;
  try {
    if (port.readable && !port.readable.locked) {
      try { port.readable.cancel?.(); } catch { /* noop */ }
    }
    await port.close();
  } catch (e) {
    console.warn('closeSerialPort: error closing port', e);
  }
}

async function readUntilIdle(reader, idleMs = 80, maxMs = DEFAULT_TIMEOUT_MS) {
  const decoder = new TextDecoder();
  let buffer = '';
  const start = Date.now();
  let lastData = Date.now();
  while (Date.now() - start < maxMs) {
    const remaining = maxMs - (Date.now() - start);
    const slice = Math.min(idleMs, Math.max(20, remaining));
    const race = new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ done: false, value: undefined, timeout: true }), slice);
      reader.read().then(
        (r) => { clearTimeout(timer); resolve({ ...r, timeout: false }); },
        (err) => { clearTimeout(timer); resolve({ done: true, value: undefined, error: err }); }
      );
    });
    const { value, done, timeout, error } = await race;
    if (error) throw error;
    if (done) break;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      lastData = Date.now();
    } else if (timeout) {
      if (Date.now() - lastData > idleMs * 2) break;
    }
  }
  buffer += decoder.decode();
  return buffer.split(NEWLINE).map(stripPrompt).filter(Boolean);
}

async function writeCommand(writer, command) {
  const data = new TextEncoder().encode(`${command}\r\n`);
  await writer.write(data);
  await writer.ready.catch(() => {});
}

export async function sendAtCommand(port, command, options = {}) {
  if (!port || !port.writable) {
    throw new Error('Port not open for writing');
  }
  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();
  try {
    await writeCommand(writer, command);
    const lines = await readUntilIdle(reader, options.idleMs, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    return lines;
  } finally {
    try { writer.releaseLock(); } catch { /* noop */ }
    try { reader.releaseLock(); } catch { /* noop */ }
  }
}

export function maskImei(imei) {
  if (!imei) return '';
  const s = String(imei).replace(/\D/g, '');
  if (s.length < 8) return s;
  return `${s.slice(0, 4)}••••••${s.slice(-4)}`;
}

/* ---- parseDevConInfo -----------------------------------------
   Samsung-proprietary AT+DEVCONINFO response parser.

   Response format (one line, semicolon-delimited key/value pairs):
     +DEVCONINFO: MN(SM-A042F);BASE(UNKNOWN);
                  VER(A042FXXS7DXE1/A042FOJM7DXE1/...);
                  HIDVER(...);MNC(000);MCC(000);PRD(XFA);
                  OMCCODE();SN(R8YX40LFPLF);
                  IMEI(350031345841796);
                  UN(H153458300831907633B);
                  PN();CON(AT,MTP);LOCK(NONE);
                  LIMIT(FALSE);SDP(RUNTIME);HVID(...)

   Token map (matches samfw.com device-info dump exactly):
     MN    → model          (e.g. "SM-A042F")
     PRD   → CSC            (e.g. "XFA")
     VER   → firmware       (e.g. "A042FXXS7DXE1/A042FOJM7DXE1/...")
     IMEI  → IMEI           (e.g. "350031345841796")
     SN    → serial         (matches the USB iSerial)
     UN    → unique number  (mainboard serial, hex)
     MCC   → mobile country code
     MNC   → mobile network code

   Returns a plain object keyed by token, or null if the input
   doesn't look like a DEVCONINFO response.
   ----------------------------------------------------------- */

const DEVCONINFO_RE = /\b([A-Z]+)\(([^)]*)\)/g;

export function parseDevConInfo(text) {
  if (!text || typeof text !== 'string') return null;
  if (!text.includes('+DEVCONINFO') && !text.includes('DEVCONINFO')) return null;

  const out = {};
  for (const m of text.matchAll(DEVCONINFO_RE)) {
    const key = m[1];
    const val = m[2];
    if (key && out[key] === undefined) out[key] = val;
  }
  return Object.keys(out).length ? out : null;
}

/* Samsung-proprietary AT commands. Not part of the 3GPP AT command
   set, so they aren't blocked by the standard CME restrictions on
   modern Samsung. */
export const AT_DEVCONINFO = 'AT+DEVCONINFO';
export const AT_REACTIVE = 'AT+REACTIVE=1,0,0';

/* ---- extractModelHint ----------------------------------------
   On many Samsung devices the iProduct string is something
   like "SAMSUNG SM-A546B" — the model number is right there in
   the USB descriptor. On others (generic "SAMSUNG_Android") it
   isn't, in which case we return null and the caller falls back
   to "Unknown". Also looks in the serial number, in case a
   vendor embeds the model there.

   Returns the canonical uppercase model string (e.g. "SM-A546B")
   or null.
   ----------------------------------------------------------- */

export function extractModelHint({ serial, productName } = {}) {
  const sources = [productName, serial];
  for (const s of sources) {
    if (!s) continue;
    const sm = String(s).match(/\bSM-[A-Z0-9]+\b/i);
    if (sm) return sm[0].toUpperCase();
    const gt = String(s).match(/\bGT-[A-Z0-9]+\b/i);
    if (gt) return gt[0].toUpperCase();
  }
  return null;
}

export function isWebSerialSupported() {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

export const SERIAL_BAUD = 115200;
export const SERIAL_DATA_BITS = 8;
export const SERIAL_PARITY = 'none';
export const SERIAL_STOP_BITS = 1;
