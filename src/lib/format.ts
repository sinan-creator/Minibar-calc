const LOCALE = "en";

type Formatter = { format: (n: number) => string };
const moneyCache = new Map<string, Formatter>();

function moneyFormatter(currency: string, maximumFractionDigits: number, compact: boolean): Formatter {
  const key = `${currency}|${maximumFractionDigits}|${compact}`;
  let fmt = moneyCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 0,
        maximumFractionDigits,
        ...(compact ? { notation: "compact", compactDisplay: "short" } : {}),
      });
    } catch {
      // Malformed currency code: plain number with the code appended.
      const plain = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits });
      fmt = { format: (n) => `${plain.format(n)} ${currency}` };
    }
    moneyCache.set(key, fmt);
  }
  return fmt;
}

export function formatMoney(value: number, currency: string, opts: { digits?: number; compact?: boolean } = {}) {
  if (!Number.isFinite(value)) return "—";
  return moneyFormatter(currency, opts.digits ?? 0, opts.compact ?? false).format(value);
}

/** Always two decimals, for the ticking live counter. */
export function formatMoneyExact(value: number, currency: string) {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Up to 4 decimals, used for tariffs and exchange rates. */
export function formatRate(value: number, currency: string) {
  if (!Number.isFinite(value)) return "—";
  return moneyFormatter(currency, 4, false).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

export function formatKwh(value: number) {
  return `${formatNumber(value)} kWh`;
}

export function formatPayback(months: number | null) {
  if (months === null) return "No payback";
  if (months <= 0) return "Immediate";
  if (months < 1) return "< 1 month";
  if (months >= 240) return "> 20 years";
  return `${formatNumber(months, months < 10 ? 1 : 0)} months`;
}

export function formatYears(years: number | null) {
  if (years === null) return "—";
  return `${formatNumber(years, 1)} yr`;
}
