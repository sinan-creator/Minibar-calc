import { findCountry } from "./countries.ts";
import { DEFAULT_COUNTRY, DEFAULT_ROOMS, DEFAULT_YEARS, PERIOD_OPTIONS, ROOM_LIMITS, type PeriodYears, type TechnologyId } from "./defaults.ts";
import { fxFor, tariffFor, type ValueKind } from "./tariffs.ts";

/** Salesperson inputs. Numeric fields are kept as raw text so partial entries ("4." or "4,9") never fight the keyboard. */
export interface SalesInputs {
  countryCode: string;
  rooms: string;
  tariff: string;
  tariffKind: ValueKind;
  fxRate: string;
  fxKind: ValueKind;
  years: PeriodYears;
  /** Competitor the headline and hero card compare against. */
  mode: TechnologyId;
}

/** Error codes; the UI maps them to the active language. */
export interface InputErrors {
  rooms?: "range";
  tariff?: "required" | "positive";
  fxRate?: "required" | "positive";
}

/** Accepts "4,90" as well as "4.90". */
export const parseDecimal = (s: string) => Number(s.trim().replace(",", "."));

/** Country-dependent defaults for a given market. */
export function marketDefaults(countryCode: string) {
  const country = findCountry(countryCode) ?? findCountry(DEFAULT_COUNTRY)!;
  const tariff = tariffFor(country.code);
  const fx = country.currency === "USD" ? { rate: 1 } : fxFor(country.currency);
  return {
    countryCode: country.code,
    tariff: tariff ? String(tariff.value) : "",
    tariffKind: (tariff ? "estimated" : "manual") as ValueKind,
    fxRate: fx ? String(fx.rate) : "",
    fxKind: (fx ? "estimated" : "manual") as ValueKind,
  };
}

export function initialInputs(countryCode = DEFAULT_COUNTRY): SalesInputs {
  return {
    ...marketDefaults(countryCode),
    rooms: String(DEFAULT_ROOMS),
    years: DEFAULT_YEARS,
    mode: "absorption",
  };
}

export function validateInputs(i: SalesInputs): InputErrors {
  const errors: InputErrors = {};
  const rooms = Number(i.rooms.trim());
  if (!i.rooms.trim() || !Number.isInteger(rooms) || rooms < ROOM_LIMITS.min || rooms > ROOM_LIMITS.max) errors.rooms = "range";

  const tariff = parseDecimal(i.tariff);
  if (!i.tariff.trim()) errors.tariff = "required";
  else if (!Number.isFinite(tariff) || tariff <= 0 || tariff > 1_000_000) errors.tariff = "positive";

  const fx = parseDecimal(i.fxRate);
  if (!i.fxRate.trim()) errors.fxRate = "required";
  else if (!Number.isFinite(fx) || fx <= 0 || fx > 1_000_000_000) errors.fxRate = "positive";
  return errors;
}

// ---- URL state (for the QR code and for deep links from the website) ---------

export function toSearchParams(i: SalesInputs): URLSearchParams {
  const p = new URLSearchParams();
  p.set("c", i.countryCode);
  p.set("r", i.rooms);
  p.set("t", i.tariff);
  if (i.tariffKind === "manual") p.set("tk", "m");
  p.set("x", i.fxRate);
  if (i.fxKind === "manual") p.set("xk", "m");
  p.set("y", String(i.years));
  p.set("m", i.mode);
  return p;
}

const MODES: readonly TechnologyId[] = ["absorption", "peltier"];

/** Restores inputs from a query string; anything missing or malformed falls back to the market defaults. */
export function fromSearchParams(search: string): SalesInputs {
  const p = new URLSearchParams(search);
  const country = findCountry(p.get("c") ?? "")?.code ?? DEFAULT_COUNTRY;
  const base = initialInputs(country);
  const num = (key: string, fallback: string) => {
    const v = p.get(key);
    return v !== null && Number.isFinite(parseDecimal(v)) ? v.slice(0, 20) : fallback;
  };
  const years = Number(p.get("y"));
  const mode = p.get("m") as TechnologyId | null;
  return {
    ...base,
    rooms: num("r", base.rooms),
    tariff: num("t", base.tariff),
    tariffKind: p.get("tk") === "m" ? "manual" : base.tariffKind,
    fxRate: num("x", base.fxRate),
    fxKind: p.get("xk") === "m" ? "manual" : base.fxKind,
    years: (PERIOD_OPTIONS as readonly number[]).includes(years) ? (years as PeriodYears) : base.years,
    mode: mode && MODES.includes(mode) ? mode : base.mode,
  };
}
