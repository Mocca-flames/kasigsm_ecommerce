/* ============================================================
   CURRENCY — KasiGSM displays all prices in ZAR (R).
   Source price is treated as USD; converted at 1 USD = 16.5 ZAR.
   ============================================================ */

export const USD_TO_ZAR = 16.5;
export const CURRENCY_LABEL = 'R';

export function zar(value, opts = {}) {
  const { fromUsd = true, decimals = 2 } = opts;
  if (value == null) return `${CURRENCY_LABEL}—`;
  const n = Number(value);
  if (Number.isNaN(n)) return `${CURRENCY_LABEL}—`;
  const zarValue = fromUsd ? n * USD_TO_ZAR : n;
  return `${CURRENCY_LABEL}${zarValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function zarPlain(value, opts = {}) {
  return zar(value, opts).replace(/^R/, '');
}
