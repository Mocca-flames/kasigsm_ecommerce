/* ============================================================
   SAMSUNG PARSER
   Parses Samsung-proprietary AT command responses into typed
   JavaScript objects. Each parser returns null on failure and
   preserves the raw response on the result object so the caller
   can always inspect what came off the wire.
   ============================================================ */

/**
 * @typedef {Object} DevConInfoResult
 * @property {string|null} model          MN   — e.g. "SM-A042F"
 * @property {string|null} firmware       VER  — e.g. "A042FXXS7DXE1/A042FOJM7DXE1/..."
 * @property {string|null} imei           IMEI — 15-digit string
 * @property {string|null} serial         SN   — matches USB iSerial
 * @property {string|null} csc            PRD  — consumer software customisation
 * @property {string|null} uniqueNumber   UN   — mainboard unique number (hex)
 * @property {string|null} mcc            MCC  — mobile country code
 * @property {string|null} mnc            MNC  — mobile network code
 * @property {string|null} connectionMode CON        — e.g. "AT,MTP"
 * @property {string|null} carrierLock    LOCK       — e.g. "NONE", "SIM", "NETWORK"
 * @property {string}      raw            original response text
 */

const TOKEN_TO_FIELD = Object.freeze({
  MN: 'model',
  VER: 'firmware',
  IMEI: 'imei',
  SN: 'serial',
  PRD: 'csc',
  UN: 'uniqueNumber',
  MCC: 'mcc',
  MNC: 'mnc',
  CON: 'connectionMode',
  LOCK: 'carrierLock',
});

const DEVCONINFO_HEADER_RE = /\+?\s*DEVCONINFO\b/i;
const DEVCONINFO_TOKEN_RE = /\b(?<token>MN|VER|IMEI|SN|PRD|UN|MCC|MNC|CON|LOCK)\((?<value>[^)]*)\)/g;

/**
 * Parse an AT+DEVCONINFO response. Accepts either a single string
 * or an array of response lines (as returned by sendAtCommand).
 *
 * Returns null if the input is missing, not a string/array, or does
 * not contain a DEVCONINFO header. Returns a populated result object
 * (with nulls for unfound fields) if at least one recognised token
 * is extracted. The raw input is always preserved on the result.
 *
 * @param {string|string[]} input
 * @returns {DevConInfoResult|null}
 */
export function parseDevConInfo(input) {
  const text = Array.isArray(input) ? input.join('\n') : input;
  if (!text || typeof text !== 'string') return null;
  if (!DEVCONINFO_HEADER_RE.test(text)) return null;

  /** @type {DevConInfoResult} */
  const result = {
    model: null,
    firmware: null,
    imei: null,
    serial: null,
    csc: null,
    uniqueNumber: null,
    mcc: null,
    mnc: null,
    connectionMode: null,
    carrierLock: null,
    raw: text,
  };

  let populated = false;
  for (const match of text.matchAll(DEVCONINFO_TOKEN_RE)) {
    const token = match.groups?.token;
    const rawValue = match.groups?.value;
    if (!token || rawValue == null) continue;
    const field = TOKEN_TO_FIELD[token];
    if (!field || result[field] != null) continue;
    const trimmed = rawValue.trim();
    if (!trimmed) continue;
    result[field] = trimmed;
    populated = true;
  }

  return populated ? result : null;
}

/**
 * @typedef {Object} ReactiveLockResult
 * @property {'LOCKED'|'UNLOCKED'} reactivationLock
 * @property {string}              raw
 */

const ERROR_LINE_RE = /^\s*(ERROR)\s*$/i;
const CME_LINE_RE = /^\+?\s*(CME|CMS)\s*ERROR\b/i;
const PACM_LINE_RE = /PACM|NOT[_\s-]?ALLOWED|OPERATION[_\s-]?NOT[_\s-]?ALLOWED/i;

const REACTIVE_HEADER_RE = /\+?\s*REACTIVE\b/i;
const REACTIVE_LOCK_RE = /\+REACTIVE:\d+,(LOCK|UNLOCK)\b/i;

/**
 * Parse an AT+REACTIVE=1,0,0 response. Accepts either a single string
 * or an array of response lines.
 *
 * Response confirmed on SM-A042F:
 *   +REACTIVE:1,LOCK   → reactivationLock: 'LOCKED'
 *   +REACTIVE:1,UNLOCK → reactivationLock: 'UNLOCKED'
 *
 * Returns null if the input is missing, not a string/array, or does
 * not contain a REACTIVE header with a recognised lock status.
 *
 * @param {string|string[]} input
 * @returns {ReactiveLockResult|null}
 */
export function parseReactiveLock(input) {
  const text = Array.isArray(input) ? input.join('\n') : input;
  if (!text || typeof text !== 'string') return null;
  if (!REACTIVE_HEADER_RE.test(text)) return null;

  const match = text.match(REACTIVE_LOCK_RE);
  if (!match) return null;

  return {
    reactivationLock: match[1] === 'LOCK' ? 'LOCKED' : 'UNLOCKED',
    raw: text,
  };
}

/**
 * @typedef {Object} SimpleResponse
 * @property {string} value
 * @property {string} raw
 */

/**
 * Parse a single-value AT response (AT+CGMM, AT+CGMR, AT+CGSN, etc.).
 * Returns the first non-error, non-empty line as `value`, or null if
 * the response is empty / blocked / unparseable.
 *
 * @param {string|string[]} input
 * @returns {SimpleResponse|null}
 */
export function parseSimpleResponse(input) {
  const text = Array.isArray(input) ? input.join('\n') : input;
  if (!text || typeof text !== 'string') return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let blocked = false;
  let unsupported = false;
  for (const line of lines) {
    if (PACM_LINE_RE.test(line)) blocked = true;
    if (CME_LINE_RE.test(line)) blocked = true;
    if (ERROR_LINE_RE.test(line)) unsupported = true;
  }
  if (blocked || unsupported) return null;

  for (const line of lines) {
    if (ERROR_LINE_RE.test(line)) continue;
    if (CME_LINE_RE.test(line)) continue;
    if (/^\s*OK\s*$/i.test(line)) continue;
    return { value: line, raw: text };
  }
  return null;
}
