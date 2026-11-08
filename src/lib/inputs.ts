import { findCountry } from "./countries";
import { DEFAULT_COUNTRY, DEFAULT_ROOMS, DEFAULT_YEARS, ROOM_LIMITS, type PeriodYears, type TechnologyId } from "./defaults";
import { fxFor, tariffFor, type ValueKind } from "./tariffs";

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

export interface InputErrors {
  rooms?: string;
  tariff?: string;
  fxRate?: string;
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
  if (!i.rooms.trim() || !Number.isInteger(rooms) || rooms < ROOM_LIMITS.min || rooms > ROOM_LIMITS.max)
    errors.rooms = `Enter a whole number between ${ROOM_LIMITS.min} and ${ROOM_LIMITS.max.toLocaleString("en")}.`;

  const tariff = parseDecimal(i.tariff);
  if (!i.tariff.trim()) errors.tariff = "Enter the commercial electricity tariff per kWh.";
  else if (!Number.isFinite(tariff) || tariff <= 0 || tariff > 1_000_000) errors.tariff = "Enter a positive tariff.";

  const fx = parseDecimal(i.fxRate);
  if (!i.fxRate.trim()) errors.fxRate = "Enter how many units of local currency 1 USD buys.";
  else if (!Number.isFinite(fx) || fx <= 0 || fx > 1_000_000_000) errors.fxRate = "Enter a positive exchange rate.";
  return errors;
}
