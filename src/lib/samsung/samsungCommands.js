/* ============================================================
   SAMSUNG AT COMMANDS
   Constants and registry for Samsung-proprietary AT commands.
   These commands bypass the 3GPP CME restrictions that block
   standard identification commands (AT+CGMM, AT+CGMR, AT+CGSN)
   on modern Samsung firmware. Each entry is self-describing:
   the detector reads parser / priority / timeout / retries
   from the registry and runs commands in priority order.
   ============================================================ */

import { parseDevConInfo, parseReactiveLock } from './samsungParser';

/** Samsung-proprietary identification command (model + IMEI + serial + UN). */
export const AT_DEVCONINFO = 'AT+DEVCONINFO';

/** Modem reactivation command (advanced — unblocks some PACM restrictions). */
export const AT_REACTIVE = 'AT+REACTIVE=1,0,0';

/**
 * @typedef {Object} UsbContext
 * @property {number|null} vid
 * @property {number|null} pid
 * @property {string|null} serial
 * @property {string|null} productName
 */

/**
 * @typedef {(input: string|string[]) => (object|null)} SamsungParser
 */

/**
 * @typedef {Object} SamsungCommand
 * @property {string}   name         Short identifier, used in logs.
 * @property {string}   command      Full AT command string sent to the modem.
 * @property {SamsungParser|null} parser  Returns parsed object, or null on failure.
 * @property {number}   priority     Execution order (lower runs first).
 * @property {number}   timeout      Per-attempt timeout in milliseconds.
 * @property {number}   retries      Extra attempts on timeout (0 = no retry).
 * @property {string[]} [expectAny]  Substrings whose presence counts as success.
 * @property {string}   [description]
 */

/** @type {SamsungCommand[]} */
const SAMSUNG_COMMANDS = [
  {
    name: 'DEVCONINFO',
    command: AT_DEVCONINFO,
    parser: parseDevConInfo,
    priority: 1,
    timeout: 3000,
    retries: 1,
    expectAny: ['+DEVCONINFO'],
    description: 'Returns model, CSC, firmware, IMEI, serial, UN in one response',
  },
  {
    name: 'REACTIVE',
    command: AT_REACTIVE,
    parser: parseReactiveLock,
    priority: 10,
    timeout: 3000,
    retries: 1,
    expectAny: ['+REACTIVE:'],
    description: 'Returns reactivation lock status (LOCK/UNLOCK) — also reactivates modem interface as a workaround for PACM restrictions',
  },
];

/**
 * @returns {SamsungCommand[]} commands sorted by priority ascending.
 */
export function getSamsungCommands() {
  return SAMSUNG_COMMANDS.slice().sort((a, b) => a.priority - b.priority);
}

/**
 * @param {string} name
 * @returns {SamsungCommand|null}
 */
export function findSamsungCommand(name) {
  if (!name) return null;
  return SAMSUNG_COMMANDS.find((c) => c.name === name) || null;
}

/**
 * Register a new command or replace an existing one with the same name.
 * Throws on invalid input so misconfigurations surface at startup, not
 * during a scan.
 *
 * @param {SamsungCommand} entry
 */
export function registerSamsungCommand(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('registerSamsungCommand: entry must be an object');
  }
  if (!entry.name || typeof entry.name !== 'string') {
    throw new Error('registerSamsungCommand: entry.name is required');
  }
  if (!entry.command || typeof entry.command !== 'string') {
    throw new Error('registerSamsungCommand: entry.command is required');
  }
  if (entry.parser != null && typeof entry.parser !== 'function') {
    throw new Error('registerSamsungCommand: entry.parser must be a function or null');
  }
  const normalised = {
    name: entry.name,
    command: entry.command,
    parser: entry.parser || null,
    priority: Number.isFinite(entry.priority) ? entry.priority : 100,
    timeout: Number.isFinite(entry.timeout) ? entry.timeout : 3000,
    retries: Number.isFinite(entry.retries) ? Math.max(0, entry.retries | 0) : 0,
    expectAny: Array.isArray(entry.expectAny) ? entry.expectAny.slice() : [],
    description: entry.description || '',
  };
  const idx = SAMSUNG_COMMANDS.findIndex((c) => c.name === normalised.name);
  if (idx >= 0) SAMSUNG_COMMANDS[idx] = normalised;
  else SAMSUNG_COMMANDS.push(normalised);
}

/**
 * Remove a previously registered command. Returns true if removed.
 * @param {string} name
 * @returns {boolean}
 */
export function unregisterSamsungCommand(name) {
  const idx = SAMSUNG_COMMANDS.findIndex((c) => c.name === name);
  if (idx < 0) return false;
  SAMSUNG_COMMANDS.splice(idx, 1);
  return true;
}

/** Read-only snapshot of registered command names, in registration order. */
export const SAMSUNG_COMMAND_NAMES = SAMSUNG_COMMANDS.map((c) => c.name);
