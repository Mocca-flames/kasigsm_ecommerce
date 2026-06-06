/* ============================================================
   SAMSUNG LOGGER
   Logs every AT command attempt. Pure, framework-agnostic, no
   React. Use createSamsungLogger() to instantiate a logger; the
   returned object is a stateful sink that retains entries in
   memory and (optionally) writes a one-line summary to the
   console. The `enabled` flag toggles the console sink; entries
   are still retained so the caller can inspect them later.
   ============================================================ */

/**
 * @typedef {Object} UsbContext
 * @property {number|null} vid
 * @property {number|null} pid
 * @property {string|null} serial
 * @property {string|null} productName
 */

/**
 * @typedef {Object} SamsungLogEntry
 * @property {Date}        timestamp
 * @property {string}      command
 * @property {string}      rawResponse
 * @property {object|null} parsed
 * @property {boolean}     success
 * @property {string|null} error
 * @property {number}      attempts
 * @property {number}      durationMs
 * @property {UsbContext}  usbContext
 */

/**
 * @typedef {Object} SamsungLogger
 * @property {boolean}                       enabled
 * @property {SamsungLogEntry[]}             entries
 * @property {(entry: SamsungLogEntry) => void} log
 * @property {() => SamsungLogEntry[]}       snapshot
 * @property {() => void}                    clear
 */

/** @type {Readonly<UsbContext>} */
const DEFAULT_USB_CONTEXT = Object.freeze({
  vid: null,
  pid: null,
  serial: null,
  productName: null,
});

/**
 * Normalise and freeze a USB context object so the same shape is
 * stored on every log entry regardless of what the caller passes.
 *
 * @param {Partial<UsbContext>|null|undefined} ctx
 * @returns {UsbContext}
 */
export function normaliseUsbContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return { ...DEFAULT_USB_CONTEXT };
  return {
    vid: ctx.vid ?? null,
    pid: ctx.pid ?? null,
    serial: ctx.serial ?? null,
    productName: ctx.productName ?? null,
  };
}

/**
 * Build a logger instance. The returned object exposes a `log`
 * method, a growing `entries` array, and helpers for snapshot /
 * clear. The default sink writes to `console.debug` and is gated
 * by `enabled`.
 *
 * @param {{ enabled?: boolean, sink?: (entry: SamsungLogEntry) => void }} [options]
 * @returns {SamsungLogger}
 */
export function createSamsungLogger(options = {}) {
  const enabled = options.enabled !== false;
  const sink = typeof options.sink === 'function' ? options.sink : defaultSink;
  /** @type {SamsungLogEntry[]} */
  const entries = [];

  return {
    enabled,
    entries,
    log(entry) {
      if (!entry || typeof entry !== 'object') return;
      const normalised = {
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(),
        usbContext: normaliseUsbContext(entry.usbContext),
      };
      entries.push(normalised);
      if (enabled) {
        try { sink(normalised); } catch { /* sink errors must not break the detector */ }
      }
    },
    snapshot() {
      return entries.slice();
    },
    clear() {
      entries.length = 0;
    },
  };
}

/**
 * Default log sink — one-line summary + full entry on console.debug.
 * Falls back to console.log where console.debug is unavailable.
 *
 * @param {SamsungLogEntry} entry
 */
function defaultSink(entry) {
  const sink = (typeof console !== 'undefined' && console.debug) ? console.debug : console?.log;
  if (!sink) return;
  const ctx = entry.usbContext || {};
  const vid = ctx.vid != null
    ? `0x${ctx.vid.toString(16).toUpperCase().padStart(4, '0')}`
    : '—';
  const pid = ctx.pid != null
    ? `0x${ctx.pid.toString(16).toUpperCase().padStart(4, '0')}`
    : '—';
  const status = entry.success ? 'OK' : (entry.error ? 'ERR' : '—');
  const ms = Number.isFinite(entry.durationMs) ? `${entry.durationMs}ms` : '?ms';
  const attempts = Number.isFinite(entry.attempts) ? `x${entry.attempts}` : 'x?';
  const summary = `[samsung] ${entry.command} → ${status} ${ms} ${attempts} usb=${vid}/${pid}`;
  if (typeof sink === 'function') {
    sink.call(console, summary, entry);
  }
}
