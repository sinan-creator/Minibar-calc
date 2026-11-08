type Formatter = { format: (n: number) => string };
const moneyCache = new Map<string, Formatter>();

function moneyFormatter(locale: string, currency: string, maximumFractionDigits: number, compact: boolean): Formatter {
  const key = `${locale}|${currency}|${maximumFractionDigits}|${compact}`;
  let fmt = moneyCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 0,
        maximumFractionDigits,
        ...(compact ? { notation: "compact", compactDisplay: "short" } : {}),
      });
    } catch {
      // Malformed currency code: plain number with the code appended.
      const plain = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits });
      fmt = { format: (n) => `${plain.format(n)} ${currency}` };
    }
    moneyCache.set(key, fmt);
  }
  return fmt;
}

export function formatMoney(value: number, currency: string, opts: { digits?: number; compact?: boolean; locale?: string } = {}) {
  if (!Number.isFinite(value)) return "—";
  return moneyFormatter(opts.locale ?? "en", currency, opts.digits ?? 0, opts.compact ?? false).format(value);
}

/** Up to 4 decimals, used for tariffs and exchange rates. */
export function formatRate(value: number, currency: string, locale = "en") {
  if (!Number.isFinite(value)) return "—";
  return moneyFormatter(locale, currency, 4, false).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 0, locale = "en") {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function formatKwh(value: number, locale = "en") {
  return `${formatNumber(value, 0, locale)} kWh`;
}
