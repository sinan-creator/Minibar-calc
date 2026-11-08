import { findCountry } from "./countries.ts";
import {
  CUSTOM_DEFAULT_NAME,
  CUSTOM_ID,
  DEFAULT_COUNTRY,
  DEFAULT_ROOMS,
  DEFAULT_YEARS,
  PERIOD_OPTIONS,
  ROOM_LIMITS,
  TECH_LIMITS,
  type PeriodYears,
  type Technology,
  type TechnologyId,
} from "./defaults.ts";
import { fxFor, tariffFor, type ValueKind } from "./tariffs.ts";

/** The visitor's own minibar, entered per customer. Price is in the local currency. */
export interface CustomMinibar {
  enabled: boolean;
  name: string;
  dailyKwh: string;
  /** Local currency per unit. Empty or 0 = the customer keeps the existing units (no purchase). */
  unitPrice: string;
}

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
  custom: CustomMinibar;
}

export interface InputErrors {
  rooms?: string;
  tariff?: string;
  fxRate?: string;
  customKwh?: string;
  customPrice?: string;
}

export const DISCLAIMER =
  "Results are estimates for comparison purposes only. Actual energy consumption varies with ambient temperature, door openings, load, thermostat settings and operating conditions. Tariffs and exchange rates marked as estimates are desk references for the stated year, not live or verified rates. Confirm current values with the customer before quoting.";

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

export const emptyCustom = (): CustomMinibar => ({ enabled: false, name: "", dailyKwh: "", unitPrice: "" });

export function initialInputs(countryCode = DEFAULT_COUNTRY): SalesInputs {
  return {
    ...marketDefaults(countryCode),
    rooms: String(DEFAULT_ROOMS),
    years: DEFAULT_YEARS,
    mode: "absorption",
    custom: emptyCustom(),
  };
}

export function validateInputs(i: SalesInputs): InputErrors {
  const errors: InputErrors = {};
  const rooms = Number(i.rooms.trim());
  if (!i.rooms.trim() || !Number.isInteger(rooms) || rooms < ROOM_LIMITS.min || rooms > ROOM_LIMITS.max)
    errors.rooms = `Enter a whole number between ${ROOM_LIMITS.min} and ${ROOM_LIMITS.max.toLocaleString("en")}.`;

  const tariff = parseDecimal(i.tariff);
  if (!i.tariff.trim()) errors.tariff = "Enter the commercial electricity tariff per kWh.";
  else if (!Number.isFinite(tariff) || tariff <= 0 || tariff > 1_000_000) errors.tariff = "Enter a positive tariff.";

  const fx = parseDecimal(i.fxRate);
  if (!i.fxRate.trim()) errors.fxRate = "Enter how many units of local currency 1 USD buys.";
  else if (!Number.isFinite(fx) || fx <= 0 || fx > 1_000_000_000) errors.fxRate = "Enter a positive exchange rate.";

  if (i.custom.enabled) {
    const kwh = parseDecimal(i.custom.dailyKwh);
    const { min, max } = TECH_LIMITS.dailyKwh;
    if (!i.custom.dailyKwh.trim() || !Number.isFinite(kwh) || kwh < min || kwh > max)
      errors.customKwh = `Enter the daily consumption from the rating label (${min}–${max} kWh/day).`;
    const price = i.custom.unitPrice.trim() ? parseDecimal(i.custom.unitPrice) : 0;
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000_000) errors.customPrice = "Enter a price of 0 or more.";
  }
  return errors;
}

/** Builds the visitor's minibar as a Technology (price converted to USD), or null when disabled. */
export function customTechnology(i: SalesInputs, fxRate: number): Technology | null {
  if (!i.custom.enabled) return null;
  const price = i.custom.unitPrice.trim() ? parseDecimal(i.custom.unitPrice) : 0;
  return {
    id: CUSTOM_ID,
    name: i.custom.name.trim() || CUSTOM_DEFAULT_NAME,
    dailyKwh: parseDecimal(i.custom.dailyKwh),
    unitPriceUsd: fxRate > 0 ? price / fxRate : 0,
    active: true,
  };
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
  if (i.custom.enabled) {
    p.set("ck", i.custom.dailyKwh);
    if (i.custom.unitPrice.trim()) p.set("cp", i.custom.unitPrice);
    if (i.custom.name.trim()) p.set("cn", i.custom.name.trim().slice(0, TECH_LIMITS.nameMaxLength));
  }
  return p;
}

const MODES: readonly TechnologyId[] = ["absorption", "peltier", "custom"];

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
  const customKwh = p.get("ck");
  return {
    ...base,
    rooms: num("r", base.rooms),
    tariff: num("t", base.tariff),
    tariffKind: p.get("tk") === "m" ? "manual" : base.tariffKind,
    fxRate: num("x", base.fxRate),
    fxKind: p.get("xk") === "m" ? "manual" : base.fxKind,
    years: (PERIOD_OPTIONS as readonly number[]).includes(years) ? (years as PeriodYears) : base.years,
    mode: mode && MODES.includes(mode) ? mode : base.mode,
    custom: customKwh
      ? {
          enabled: true,
          name: (p.get("cn") ?? "").slice(0, TECH_LIMITS.nameMaxLength),
          dailyKwh: num("ck", ""),
          unitPrice: num("cp", ""),
        }
      : emptyCustom(),
  };
}
