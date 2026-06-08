/* ============================================================
   CURRENCY — KasiGSM displays all prices in ZAR (R).
   API returns prices already in ZAR (converted server-side).
   Use fromUsd: true only for hardcoded USD values.
   ============================================================ */

export const USD_TO_ZAR = 16.5;
export const CURRENCY_LABEL = 'R';

export function zar(value, opts = {}) {
  const { fromUsd = false, decimals = 2 } = opts;
  if (value == null) return `${CURRENCY_LABEL}—`;
  const n = Number(value);
  if (Number.isNaN(n)) return `${CURRENCY_LABEL}—`;
  const zarValue = fromUsd ? n * USD_TO_ZAR : n;
  return `${CURRENCY_LABEL}${zarValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function zarPlain(value, opts = {}) {
  return zar(value, opts).replace(/^R/, '');
}
