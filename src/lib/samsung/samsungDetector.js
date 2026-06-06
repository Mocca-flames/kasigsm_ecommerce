/* ============================================================
   SAMSUNG DETECTOR
   Samsung-first identification orchestrator. Runs Samsung
   proprietary AT commands in priority order, retries on
   timeout, treats CME / PACM errors as non-fatal restrictions,
   and falls back to standard 3GPP commands for any fields the
   Samsung commands did not populate. Returns a partial-success
   result — the caller decides what to do with gaps.

   The port must already be open and configured; this module
   does not manage the port lifecycle.
   ============================================================ */

import { sendAtCommand, isCmeBlocked } from '../serialUtils';
import { getSamsungCommands } from './samsungCommands';
import { parseSimpleResponse } from './samsungParser';
import { createSamsungLogger, normaliseUsbContext } from './samsungLogger';

/**
 * @typedef {import('./samsungParser').DevConInfoResult} DevConInfoResult
 * @typedef {import('./samsungParser').SimpleResponse}    SimpleResponse
 * @typedef {import('./samsungLogger').UsbContext}        UsbContext
 * @typedef {import('./samsungLogger').SamsungLogEntry}   SamsungLogEntry
 * @typedef {import('./samsungLogger').SamsungLogger}     SamsungLogger
 * @typedef {import('./samsungCommands').SamsungCommand}  SamsungCommand
 */

/**
 * @typedef {Object} FallbackCommand
 * @property {string} name
 * @property {string} command
 * @property {keyof DetectionResult} field
 * @property {string} [description]
 */

/** @type {FallbackCommand[]} */
const FALLBACK_COMMANDS = [
  { name: 'CGMM', command: 'AT+CGMM', field: 'model',     description: '3GPP model identification' },
  { name: 'CGMR', command: 'AT+CGMR', field: 'firmware',  description: '3GPP revision identification' },
  { name: 'CGSN', command: 'AT+CGSN', field: 'imei',      description: '3GPP IMEI identification' },
];

/**
 * @typedef {'samsung'|'generic'|'none'} DetectionSource
 */

/**
 * @typedef {Object} DetectionResult
 * @property {string|null}    model
 * @property {string|null}    firmware
 * @property {string|null}    imei
 * @property {string|null}    csc
 * @property {string|null}    uniqueNumber
 * @property {string|null}    mcc
 * @property {string|null}    mnc
 * @property {string|null}    connectionMode
 * @property {string|null}    serial
 * @property {string|null}    carrierLock       from DEVCONINFO LOCK — e.g. "NONE", "SIM", "NETWORK"
 * @property {'LOCKED'|'UNLOCKED'|null} reactivationLock
 * @property {boolean}        blocked   true if any command returned a CME / PACM restriction
 * @property {boolean}        partial   true if some (but not the minimum) fields were populated
 * @property {DetectionSource} source    which command family produced the primary identification
 * @property {SamsungLogEntry[]} log     per-attempt log entries
 */

/**
 * @typedef {Object} DetectorOptions
 * @property {number}        [commandDelayMs=220]   delay before each command
 * @property {number}        [retryBackoffMs=120]   delay between retry attempts
 * @property {SamsungLogger} [logger]               external logger (one is created if omitted)
 * @property {boolean}       [enableLogging=true]   passed to the default logger
 * @property {AbortSignal}   [signal]               cancel between commands
 * @property {boolean}       [skipGenericFallback=false]
 */

/** Fields populated by the parser that should be merged into the result. */
const PARSED_FIELDS = [
  'model', 'firmware', 'imei', 'serial',
  'csc', 'uniqueNumber', 'mcc', 'mnc', 'connectionMode',
  'carrierLock', 'reactivationLock',
];

/**
 * Run a Samsung-first identification sequence against an open serial
 * port. Always returns a DetectionResult — never throws on a
 * non-fatal AT error. The caller is expected to have already opened
 * the port via Web Serial and to close it after this resolves.
 *
 * @param {Object} params
 * @param {SerialPort} params.port
 * @param {UsbContext} [params.usbContext]
 * @param {DetectorOptions} [params.options]
 * @returns {Promise<DetectionResult>}
 */
export async function trySamsungIdentification(params) {
  const { port } = params || {};
  const options = params?.options || {};
  const usbContext = normaliseUsbContext(params?.usbContext);
  const commandDelayMs = Number.isFinite(options.commandDelayMs) ? options.commandDelayMs : 220;
  const retryBackoffMs = Number.isFinite(options.retryBackoffMs) ? options.retryBackoffMs : 120;
  const signal = options.signal;
  const skipGenericFallback = options.skipGenericFallback === true;
  const logger = options.logger
    || createSamsungLogger({ enabled: options.enableLogging !== false });

  /** @type {DetectionResult} */
  const result = {
    model: null,
    firmware: null,
    imei: null,
    csc: null,
    uniqueNumber: null,
    mcc: null,
    mnc: null,
    connectionMode: null,
    serial: null,
    carrierLock: null,
    reactivationLock: null,
    blocked: false,
    partial: false,
    source: 'none',
    log: [],
  };

  if (!isUsablePort(port)) return result;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const aborted = () => signal?.aborted === true;

  /* ---- Phase 1: Samsung proprietary commands --------------------- */
  for (const cmd of getSamsungCommands()) {
    if (aborted()) return result;
    if (!cmd.parser) continue;
    await sleep(commandDelayMs);
    if (aborted()) return result;

    const entry = await runCommandWithRetry({
      port, command: cmd, usbContext, logger, retryBackoffMs, signal,
    });
    result.log.push(entry);

    if (entry.success && entry.parsed) {
      applyParsed(result, entry.parsed);
      if (result.source === 'none') result.source = 'samsung';
    } else if (entry.error && isBlockedReason(entry.error)) {
      result.blocked = true;
    }

    if (hasMinimumIdentification(result)) break;
  }

  /* ---- Phase 2: 3GPP fallback for missing fields ------------------ */
  if (!skipGenericFallback) {
    for (const fb of FALLBACK_COMMANDS) {
      if (aborted()) return result;
      if (result[fb.field]) continue;
      await sleep(commandDelayMs);
      if (aborted()) return result;

      /** @type {SamsungCommand} */
      const cmdDef = {
        name: fb.name,
        command: fb.command,
        parser: parseSimpleResponse,
        priority: 100,
        timeout: 3000,
        retries: 1,
        expectAny: [],
        description: fb.description,
      };
      const entry = await runCommandWithRetry({
        port, command: cmdDef, usbContext, logger, retryBackoffMs, signal,
      });
      result.log.push(entry);

      if (entry.success && entry.parsed && typeof entry.parsed.value === 'string') {
        result[fb.field] = entry.parsed.value;
        if (result.source === 'none') result.source = 'generic';
      } else if (entry.error && isBlockedReason(entry.error)) {
        result.blocked = true;
      }
    }
  }

  result.partial = hasAnyField(result) && !hasMinimumIdentification(result);
  return result;
}

/**
 * Try a single Samsung command without orchestration. Useful for
 * ad-hoc lookups (e.g. "what's my CSC?") outside the full detection
 * pipeline. Honours the same retry / blocking semantics.
 *
 * @param {Object} params
 * @param {SerialPort} params.port
 * @param {string}     params.commandName  name registered in the Samsung command registry
 * @param {UsbContext} [params.usbContext]
 * @param {DetectorOptions} [params.options]
 * @returns {Promise<SamsungLogEntry|null>}
 */
export async function trySamsungCommand(params) {
  const { port, commandName } = params || {};
  const options = params?.options || {};
  const usbContext = normaliseUsbContext(params?.usbContext);
  const logger = options.logger
    || createSamsungLogger({ enabled: options.enableLogging !== false });
  if (!isUsablePort(port)) return null;
  const cmd = getSamsungCommands().find((c) => c.name === commandName);
  if (!cmd) return null;
  return runCommandWithRetry({
    port,
    command: cmd,
    usbContext,
    logger,
    retryBackoffMs: Number.isFinite(options.retryBackoffMs) ? options.retryBackoffMs : 120,
    signal: options.signal,
  });
}

/* -----------------------------------------------------------------
   Internal helpers
   ----------------------------------------------------------------- */

/**
 * @param {DetectionResult} result
 * @returns {boolean}
 */
function hasAnyField(result) {
  return !!(result.model || result.firmware || result.imei
    || result.csc || result.uniqueNumber || result.serial);
}

/**
 * @param {DetectionResult} result
 * @returns {boolean}
 */
function hasMinimumIdentification(result) {
  return !!(result.model && result.imei);
}

/**
 * Merge a parser result into the detection result. Only null fields
 * are filled so a later command never overwrites a value already
 * captured by an earlier one.
 *
 * @param {DetectionResult} result
 * @param {object|null} parsed
 */
function applyParsed(result, parsed) {
  if (!parsed || typeof parsed !== 'object') return;
  for (const key of PARSED_FIELDS) {
    const value = parsed[key];
    if (value != null && result[key] == null) {
      result[key] = String(value);
    }
  }
}

/**
 * @param {SerialPort|null|undefined} port
 * @returns {boolean}
 */
function isUsablePort(port) {
  if (!port || typeof port !== 'object') return false;
  if (typeof navigator === 'undefined' || !navigator.serial) return false;
  if (typeof port.open !== 'function') return false;
  if (typeof port.close !== 'function') return false;
  return true;
}

const BLOCKED_RE = /PACM|NOT[_\s-]?ALLOWED|OPERATION[_\s-]?NOT[_\s-]?ALLOWED|SIM\s+(NOT\s+INSERTED|FAILURE|PIN)/i;
const TIMEOUT_RE = /timeout|no\s+response/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function isBlockedReason(text) {
  if (!text) return false;
  return BLOCKED_RE.test(text);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isTimeoutReason(text) {
  if (!text) return false;
  return TIMEOUT_RE.test(text);
}

/**
 * Run a command once (no retry) and return a fully populated log entry.
 *
 * @param {Object} args
 * @param {SerialPort} args.port
 * @param {SamsungCommand} args.command
 * @param {UsbContext} args.usbContext
 * @param {number} args.attempt
 * @returns {Promise<SamsungLogEntry>}
 */
async function runCommandOnce({ port, command, usbContext, attempt }) {
  const start = Date.now();
  try {
    const lines = await sendAtCommand(port, command.command, { timeoutMs: command.timeout });
    const rawResponse = Array.isArray(lines) ? lines.join('\r\n') : '';
    const blocked = isCmeBlocked(lines);
    const errorToken = lines.find((l) => typeof l === 'string' && /^\s*ERROR\s*$/i.test(l));

    let parsed = null;
    if (command.parser) {
      try { parsed = command.parser(lines); } catch { parsed = null; }
    }

    if (parsed) {
      return buildEntry({ command, usbContext, attempt, start, rawResponse, parsed, success: true, error: null });
    }
    if (blocked) {
      return buildEntry({
        command, usbContext, attempt, start, rawResponse, parsed: null,
        success: false, error: extractBlockedReason(lines),
      });
    }
    if (errorToken) {
      return buildEntry({
        command, usbContext, attempt, start, rawResponse, parsed: null,
        success: false, error: 'command not supported (ERROR)',
      });
    }
    if (!lines || lines.length === 0) {
      return buildEntry({
        command, usbContext, attempt, start, rawResponse, parsed: null,
        success: false, error: 'timeout: no response',
      });
    }
    return buildEntry({
      command, usbContext, attempt, start, rawResponse, parsed: null,
      success: false, error: 'parse failed: unrecognised response',
    });
  } catch (e) {
    return buildEntry({
      command, usbContext, attempt, start, rawResponse: '',
      parsed: null, success: false, error: e?.message || 'serial error',
    });
  }
}

/**
 * @param {Object} args
 * @param {SerialPort} args.port
 * @param {SamsungCommand} args.command
 * @param {UsbContext} args.usbContext
 * @param {SamsungLogger} args.logger
 * @param {number} args.retryBackoffMs
 * @param {AbortSignal} [args.signal]
 * @returns {Promise<SamsungLogEntry>}
 */
async function runCommandWithRetry({ port, command, usbContext, logger, retryBackoffMs, signal }) {
  const maxAttempts = 1 + Math.max(0, command.retries || 0);
  /** @type {SamsungLogEntry|null} */
  let lastEntry = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) break;
    const entry = await runCommandOnce({ port, command, usbContext, attempt });
    logger.log(entry);
    lastEntry = entry;
    if (entry.success) break;
    if (!isTimeoutReason(entry.error)) break;
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, retryBackoffMs));
    }
  }

  return lastEntry || buildEntry({
    command, usbContext, attempt: 0, start: Date.now(), rawResponse: '',
    parsed: null, success: false, error: 'no attempt executed',
  });
}

/**
 * @param {string[]} lines
 * @returns {string}
 */
function extractBlockedReason(lines) {
  for (const line of lines) {
    if (typeof line !== 'string') continue;
    if (BLOCKED_RE.test(line)) return line.trim() || '+CME ERROR';
  }
  return '+CME ERROR';
}

/**
 * @param {Object} args
 * @param {SamsungCommand} args.command
 * @param {UsbContext} args.usbContext
 * @param {number} args.attempt
 * @param {number} args.start
 * @param {string} args.rawResponse
 * @param {object|null} args.parsed
 * @param {boolean} args.success
 * @param {string|null} args.error
 * @returns {SamsungLogEntry}
 */
function buildEntry({ command, usbContext, attempt, start, rawResponse, parsed, success, error }) {
  return {
    timestamp: new Date(),
    command: command?.command || '<unknown>',
    rawResponse: rawResponse || '',
    parsed: parsed || null,
    success: !!success,
    error: error || null,
    attempts: attempt,
    durationMs: Math.max(0, Date.now() - start),
    usbContext: normaliseUsbContext(usbContext),
  };
}
